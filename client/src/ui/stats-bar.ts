import { apiLogout } from '../api/auth.js';
import { activeAvatarStore } from '../avatar/store.js';
import { accountStore } from '../state/account.js';
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

  manager.onChange((name) => {
    if (leaveBtn) leaveBtn.hidden = !IN_GAME_SCREENS.has(name);
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

  // Hydrate from account state.
  const username = document.getElementById('sb-username');
  const levelNum = document.getElementById('sb-level-num');
  const levelRing = bar.querySelector<HTMLElement>('.sb-level');
  const avatarEl = bar.querySelector<HTMLElement>('.sb-avatar');
  accountStore.subscribe((account) => {
    if (username) username.textContent = account?.username ?? '—';
    if (levelNum) levelNum.textContent = String(account?.level ?? 0);
    if (levelRing) {
      const xp = account?.xp ?? 0;
      const pct = clamp(xp % 100, 0, 100);
      levelRing.style.setProperty('--fill', String(pct));
    }
  });
  activeAvatarStore.subscribe((dataUrl) => {
    if (!avatarEl) return;
    if (dataUrl) {
      avatarEl.style.backgroundImage = `url(${dataUrl})`;
      avatarEl.style.backgroundSize = 'cover';
    } else {
      avatarEl.style.backgroundImage = '';
    }
  });

  bar.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
    void (async (): Promise<void> => {
      try {
        await apiLogout();
      } finally {
        accountStore.set(null);
        manager.show('login');
      }
    })();
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
