import type { ScreenManager } from '../ui/screen-manager.js';

export function mountTutorial(manager: ScreenManager): void {
  const list = document.getElementById('tut-mode-list');
  if (list) list.innerHTML = emptyState('No lessons available', 'Lessons will appear here once the backend is connected.');

  document.querySelectorAll<HTMLButtonElement>('#screen-tutorial [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });
}

function emptyState(title: string, hint: string): string {
  return `<div class="empty-state"><div class="empty-state__title">${title}</div><div class="empty-state__hint">${hint}</div></div>`;
}
