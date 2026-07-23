import type { ScreenManager } from '../ui/screen-manager.js';

export function mountQuickPlay(manager: ScreenManager): void {
  const list = document.getElementById('qp-mode-list');
  if (list) list.innerHTML = emptyState('No modes available', 'Modes will appear here once the backend is connected.');

  document.querySelectorAll<HTMLButtonElement>('#screen-quickplay [data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      manager.show('menu');
    });
  });
}

function emptyState(title: string, hint: string): string {
  return `<div class="empty-state"><div class="empty-state__title">${title}</div><div class="empty-state__hint">${hint}</div></div>`;
}
