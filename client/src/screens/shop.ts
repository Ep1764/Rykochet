import type { ScreenManager } from '../ui/screen-manager.js';

export function mountShop(manager: ScreenManager): void {
  const catList = document.getElementById('shop-cats');
  const itemGrid = document.getElementById('shop-items');
  const catTitle = document.getElementById('shop-cat-title');
  const balance = document.getElementById('shop-coins');

  if (balance) balance.textContent = '0';
  if (catTitle) catTitle.textContent = '—';
  if (catList) catList.innerHTML = emptyState('No categories', '');
  if (itemGrid) itemGrid.innerHTML = emptyState('No items', 'Items will appear here once the backend is connected.');

  document.querySelectorAll<HTMLButtonElement>('#screen-shop [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });
}

function emptyState(title: string, hint: string): string {
  return `<div class="empty-state"><div class="empty-state__title">${title}</div>${hint ? `<div class="empty-state__hint">${hint}</div>` : ''}</div>`;
}
