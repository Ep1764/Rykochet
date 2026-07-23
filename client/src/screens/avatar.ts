import type { ScreenManager } from '../ui/screen-manager.js';

const SLOTS = 5;

export function mountAvatar(manager: ScreenManager): void {
  renderSlots();
  renderEditorEmpty();
  wire(manager);
}

function renderSlots(): void {
  const row = document.getElementById('av-slot-row');
  if (!row) return;
  row.innerHTML = Array.from({ length: SLOTS }, (_, i) => `
    <div class="av-slot${i === 0 ? ' is-selected' : ''}" data-slot="${String(i)}">
      <span class="av-slot__empty">Empty</span>
    </div>`).join('');
}

function renderEditorEmpty(): void {
  const layerList = document.getElementById('se-layer-list');
  const library = document.getElementById('se-library');
  if (layerList) layerList.innerHTML = emptyState('No layers', '');
  if (library) library.innerHTML = emptyState('No assets', '');
}

function wire(manager: ScreenManager): void {
  document.querySelectorAll<HTMLButtonElement>('#screen-avatar [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });

  const slotRow = document.getElementById('av-slot-row');
  slotRow?.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.av-slot');
    if (!el) return;
    slotRow.querySelectorAll<HTMLElement>('.av-slot').forEach((s) => s.classList.remove('is-selected'));
    el.classList.add('is-selected');
  });

  const editor = document.getElementById('skin-editor') as HTMLElement | null;
  document.querySelector<HTMLButtonElement>('[data-action="av-edit"]')?.addEventListener('click', () => {
    if (editor) editor.hidden = false;
  });
  document.querySelector<HTMLButtonElement>('[data-action="se-cancel"]')?.addEventListener('click', () => {
    if (editor) editor.hidden = true;
  });
  document.querySelector<HTMLButtonElement>('[data-action="se-save"]')?.addEventListener('click', () => {
    if (editor) editor.hidden = true;
  });
}

function emptyState(title: string, hint: string): string {
  return `<div class="empty-state"><div class="empty-state__title">${title}</div>${hint ? `<div class="empty-state__hint">${hint}</div>` : ''}</div>`;
}
