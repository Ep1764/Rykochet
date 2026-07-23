export type ScreenName =
  | 'login'
  | 'menu'
  | 'quickplay'
  | 'parties'
  | 'lobby'
  | 'shop'
  | 'tutorial'
  | 'avatar'
  | 'updates';

type Listener = (name: ScreenName) => void;

export class ScreenManager {
  private current: ScreenName | null = null;
  private listeners = new Set<Listener>();

  show(name: ScreenName): void {
    const screens = document.querySelectorAll<HTMLElement>('.screen');
    screens.forEach((el) => {
      const isTarget = el.dataset['screen'] === name;
      el.hidden = !isTarget;
    });
    this.current = name;
    this.listeners.forEach((fn) => {
      fn(name);
    });
  }

  getCurrent(): ScreenName | null {
    return this.current;
  }

  onChange(fn: Listener): void {
    this.listeners.add(fn);
  }
}
