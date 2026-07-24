import type { AvatarRecipe } from '@rykochet/shared';

import { accountStore } from '../state/account.js';

import { composeAvatarDataUrl } from './composer.js';

type Listener = (dataUrl: string | null) => void;

class ActiveAvatarStore {
  private dataUrl: string | null = null;
  private listeners = new Set<Listener>();
  private lastRecipeHash: string | null = null;

  constructor() {
    accountStore.subscribe((account) => {
      if (!account) {
        this.dataUrl = null;
        this.lastRecipeHash = null;
        this.emit();
        return;
      }
      const active = account.avatars[account.selectedAvatar];
      if (!active) return;
      const hash = JSON.stringify(active.recipe);
      if (hash === this.lastRecipeHash) return;
      this.lastRecipeHash = hash;
      void this.recompose(active.recipe);
    });
  }

  private async recompose(recipe: AvatarRecipe): Promise<void> {
    try {
      this.dataUrl = await composeAvatarDataUrl(recipe);
    } catch {
      this.dataUrl = null;
    }
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((fn) => {
      fn(this.dataUrl);
    });
  }

  get(): string | null { return this.dataUrl; }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.dataUrl);
    return () => this.listeners.delete(fn);
  }
}

export const activeAvatarStore = new ActiveAvatarStore();
