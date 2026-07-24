import type { AuthAccount } from '@rykochet/shared';

type Listener = (account: AuthAccount | null) => void;

class AccountStore {
  private current: AuthAccount | null = null;
  private listeners = new Set<Listener>();

  set(next: AuthAccount | null): void {
    this.current = next;
    if (next) {
      // eslint-disable-next-line no-console
      console.log('[rykochet] account:', next);
    }
    this.listeners.forEach((fn) => {
      fn(next);
    });
  }

  get(): AuthAccount | null { return this.current; }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.current);
    return () => this.listeners.delete(fn);
  }
}

export const accountStore = new AccountStore();
