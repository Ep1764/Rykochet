export type ScreenName = 'login' | 'menu';

export class ScreenManager {
  private current: ScreenName | null = null;

  show(name: ScreenName): void {
    const screens = document.querySelectorAll<HTMLElement>('.screen');
    screens.forEach((el) => {
      const isTarget = el.dataset['screen'] === name;
      el.hidden = !isTarget;
    });
    this.current = name;
  }

  getCurrent(): ScreenName | null {
    return this.current;
  }
}
