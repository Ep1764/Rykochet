import { accountStore } from '../state/account.js';
import type { ScreenManager } from '../ui/screen-manager.js';

export function mountFriends(manager: ScreenManager): void {
  const list = document.getElementById('friends-list');
  const count = document.getElementById('friends-count');

  const render = (): void => {
    if (!list) return;
    const account = accountStore.get();
    const friends = account?.friends ?? [];
    if (count) count.textContent = String(friends.length);
    if (friends.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state__title">No friends yet</div><div class="empty-state__hint">Send a request from another player's profile to add them here.</div></div>`;
      return;
    }
    list.innerHTML = friends
      .map(
        (f) => `
      <div class="friend-row tile">
        <span class="friend-avatar"></span>
        <span>
          <span class="friend-name">${escape(f.username)}</span>
          <br><span class="friend-meta">Lvl ${String(f.level)} · ${f.online ? '<span class="friend-online">online</span>' : 'offline'}</span>
        </span>
        <span class="friend-actions">
          <button class="mini-btn" type="button">Message</button>
          <button class="mini-btn is-danger" type="button">Remove</button>
        </span>
      </div>`,
      )
      .join('');
  };

  accountStore.subscribe(render);

  document.querySelectorAll<HTMLButtonElement>('#screen-friends [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}
