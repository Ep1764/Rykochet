import type { ScreenManager } from '../ui/screen-manager.js';

export function mountParties(manager: ScreenManager): void {
  const tbody = document.getElementById('lobby-tbody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-state__title">No lobbies</div><div class="empty-state__hint">Public lobbies will appear here once the backend is connected.</div></div></td></tr>`;
  }

  document.querySelectorAll<HTMLButtonElement>('#screen-parties [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });

  const clModal = document.getElementById('create-lobby-modal') as HTMLElement | null;
  document.querySelector<HTMLButtonElement>('[data-action="open-create-lobby"]')?.addEventListener('click', () => {
    if (clModal) clModal.hidden = false;
  });
  clModal?.addEventListener('click', (e) => {
    if (e.target === clModal) clModal.hidden = true;
  });
  clModal?.querySelector('[data-action="close-create-lobby"]')?.addEventListener('click', () => {
    clModal.hidden = true;
  });
  (document.getElementById('cl-form') as HTMLFormElement | null)?.addEventListener('submit', (e) => {
    e.preventDefault();
  });
}
