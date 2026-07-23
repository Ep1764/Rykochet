import type { ScreenManager } from '../ui/screen-manager.js';

const SLOTS = 5;
const LAYERS = ['Base Body', 'Body Pattern', 'Eyes', 'Mouth', 'Hat'];
const ASSETS = ['eyes_round', 'eyes_angry', 'mouth_smile', 'mouth_sad', 'hat_cowboy', 'hat_crown', 'hat_wizard', 'horns', 'glasses', 'cape'];

export function mountAvatar(manager: ScreenManager): void {
  renderSlots();
  renderEditor();
  wire(manager);
}

function renderSlots(): void {
  const row = document.getElementById('av-slot-row');
  if (!row) return;
  row.innerHTML = Array.from({ length: SLOTS }, (_, i) => {
    const isActive = i === 0;
    const isSelected = i === 0;
    return `
    <div class="av-slot${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}" data-slot="${String(i)}">
      <div class="av-slot__preview"></div>
    </div>`;
  }).join('');
}

function renderEditor(): void {
  const layerList = document.getElementById('se-layer-list');
  const library = document.getElementById('se-library');
  if (layerList) {
    layerList.innerHTML = LAYERS.map(
      (name, i) => `
      <div class="se-layer${i === 2 ? ' is-selected' : ''}" data-layer="${name}">
        <span>${name}</span>
        <span>≡</span>
      </div>`,
    ).join('');
  }
  if (library) {
    library.innerHTML = ASSETS.map(
      (a) => `<div class="se-asset" data-asset="${a}">${a.replace('_', ' ')}</div>`,
    ).join('');
  }
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

  // Highlight matching asset when hovering a layer.
  const layerList = document.getElementById('se-layer-list');
  const library = document.getElementById('se-library');
  layerList?.addEventListener('mouseover', (e) => {
    const layer = (e.target as HTMLElement).closest<HTMLElement>('.se-layer');
    if (!layer || !library) return;
    const name = (layer.dataset['layer'] ?? '').toLowerCase().replace(/\s+/g, '_');
    library.querySelectorAll<HTMLElement>('.se-asset').forEach((a) => {
      a.classList.toggle('is-highlighted', (a.dataset['asset'] ?? '').includes(name));
    });
  });
  layerList?.addEventListener('mouseout', () => {
    library?.querySelectorAll<HTMLElement>('.se-asset').forEach((a) => a.classList.remove('is-highlighted'));
  });
}
