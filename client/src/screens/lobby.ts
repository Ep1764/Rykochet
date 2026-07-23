import type { ScreenManager } from '../ui/screen-manager.js';

export function mountLobby(manager: ScreenManager): void {
  const grid = document.getElementById('lb-player-grid');
  if (grid) grid.innerHTML = emptyState('No players', 'The lobby is empty.');

  const specs = document.getElementById('lb-spec-list');
  if (specs) specs.innerHTML = emptyState('No spectators', '');

  const chat = document.getElementById('lb-chat-log');
  if (chat) chat.innerHTML = emptyState('No messages yet', '');

  const count = document.getElementById('lb-player-count');
  if (count) count.textContent = '0 / 8';

  const mapName = document.getElementById('lb-map-name');
  if (mapName) mapName.textContent = '—';
  const mapAuthor = document.getElementById('lb-map-author');
  if (mapAuthor) mapAuthor.textContent = '—';

  const modeName = document.getElementById('lb-mode-name');
  if (modeName) modeName.textContent = '';

  const lock = document.querySelector<HTMLButtonElement>('[data-action="toggle-teamlock"]');
  lock?.addEventListener('click', () => {
    const on = lock.classList.toggle('is-locked');
    lock.textContent = on ? '🔒 Lock Teams' : '🔒 Unlock Teams';
  });

  const input = document.getElementById('lb-chat-input') as HTMLInputElement | null;
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
  });
}

function emptyState(title: string, hint: string): string {
  return `<div class="empty-state"><div class="empty-state__title">${title}</div>${hint ? `<div class="empty-state__hint">${hint}</div>` : ''}</div>`;
}
