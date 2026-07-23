import type { ScreenManager } from './screen-manager.js';

const IN_GAME_SCREENS = new Set(['lobby']);

export function mountStatsBar(manager: ScreenManager, openSettings: () => void): void {
  const bar = document.getElementById('stats-bar');
  const trigger = document.querySelector<HTMLElement>('.stats-bar-trigger');
  const leaveBtn = document.getElementById('sb-leave') as HTMLButtonElement | null;
  if (!bar || !trigger) return;

  let hideTimer: number | null = null;

  const open = (): void => {
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = null;
    bar.classList.add('is-open');
  };
  const scheduleClose = (): void => {
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      bar.classList.remove('is-open');
    }, 400);
  };

  trigger.addEventListener('mouseenter', open);
  bar.addEventListener('mouseenter', open);
  bar.addEventListener('mouseleave', scheduleClose);
  trigger.addEventListener('mouseleave', scheduleClose);

  // Show/hide leave button based on screen.
  manager.onChange((name) => {
    if (leaveBtn) {
      leaveBtn.hidden = !IN_GAME_SCREENS.has(name);
    }
  });

  bar.querySelector('[data-action="open-settings"]')?.addEventListener('click', openSettings);
  bar.querySelector('[data-action="toggle-music"]')?.addEventListener('click', (e) => {
    (e.currentTarget as HTMLElement).classList.toggle('is-off');
  });
  bar.querySelector('[data-action="toggle-sfx"]')?.addEventListener('click', (e) => {
    (e.currentTarget as HTMLElement).classList.toggle('is-off');
  });
  leaveBtn?.addEventListener('click', () => {
    manager.show('menu');
  });
}
