import type { AvatarRecipe } from './api.js';

export const DEFAULT_BASE_COLOR = '#19E68C';

export function defaultRecipe(): AvatarRecipe {
  return {
    baseColor: DEFAULT_BASE_COLOR,
    layers: [],
    equipment: {
      trail: null,
      bulletTrail: null,
      deathAnimation: null,
      spawnEffect: null,
    },
  };
}

export function defaultSlotName(slotIndex: number): string {
  return `Avatar ${String(slotIndex + 1)}`;
}
