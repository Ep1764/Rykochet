import type { AvatarLayer, AvatarRecipe, AvatarSlot, OwnedCosmetic } from '@rykochet/shared';
import { defaultRecipe } from '@rykochet/shared';

import { apiSaveSlot, apiSelectSlot } from '../api/avatar.js';
import { composeAvatarDataUrl } from '../avatar/composer.js';
import { loadManifest, type StickerMeta } from '../avatar/manifest.js';
import { accountStore } from '../state/account.js';
import type { ScreenManager } from '../ui/screen-manager.js';

type LibTab = 'stickers' | 'equipment';

interface EditorState {
  slotIndex: number;
  slotName: string;
  recipe: AvatarRecipe;
  selectedLayerId: string | null;
  libTab: LibTab;
  equipFilter: 'all' | OwnedCosmetic['category'];
  dirty: boolean;
  saving: boolean;
}

let editor: EditorState | null = null;
let manifest: StickerMeta[] = [];
let slotPreviewCache = new Map<string, string>();

export function mountAvatar(manager: ScreenManager): void {
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

  document.querySelector<HTMLButtonElement>('[data-action="av-select"]')?.addEventListener('click', () => {
    const idx = currentSlotIndex();
    if (idx === null) return;
    void apiSelectSlot(idx).then((account) => {
      accountStore.set(account);
    });
  });

  document.querySelector<HTMLButtonElement>('[data-action="av-edit"]')?.addEventListener('click', () => {
    const idx = currentSlotIndex();
    if (idx === null) return;
    void openEditor(idx);
  });

  wireEditor(manager);

  accountStore.subscribe(() => {
    void renderSlots();
  });
  void loadManifest().then((m) => {
    manifest = m.stickers;
  });
}

function currentSlotIndex(): number | null {
  const sel = document.querySelector<HTMLElement>('.av-slot.is-selected');
  const raw = sel?.dataset['slot'];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

async function renderSlots(): Promise<void> {
  const row = document.getElementById('av-slot-row');
  if (!row) return;
  const account = accountStore.get();
  if (!account) return;

  const previews = await Promise.all(
    account.avatars.map(async (slot) => {
      const key = JSON.stringify(slot.recipe);
      if (!slotPreviewCache.has(key)) {
        try {
          slotPreviewCache.set(key, await composeAvatarDataUrl(slot.recipe));
        } catch {
          slotPreviewCache.set(key, '');
        }
      }
      return slotPreviewCache.get(key) ?? '';
    }),
  );

  // Cap cache growth.
  if (slotPreviewCache.size > 40) {
    const first = slotPreviewCache.keys().next().value as string | undefined;
    if (first) slotPreviewCache.delete(first);
  }

  const preservedSelection = currentSlotIndex() ?? account.selectedAvatar;
  row.innerHTML = account.avatars
    .map((slot, i) => {
      const isSelected = i === preservedSelection;
      const isActive = slot.selected;
      const preview = previews[i] ?? '';
      return `
      <div class="av-slot${isActive ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}" data-slot="${String(i)}">
        ${preview ? `<img class="av-slot__img" src="${preview}" alt="Slot ${String(i + 1)}"/>` : `<span class="av-slot__empty">Loading…</span>`}
        <span class="av-slot__label">${escapeHtml(slot.name)}</span>
      </div>`;
    })
    .join('');
}

async function openEditor(slotIndex: number): Promise<void> {
  const account = accountStore.get();
  if (!account) return;
  const slot: AvatarSlot | undefined = account.avatars[slotIndex];
  if (!slot) return;

  editor = {
    slotIndex,
    slotName: slot.name,
    recipe: cloneRecipe(slot.recipe),
    selectedLayerId: null,
    libTab: 'stickers',
    equipFilter: 'all',
    dirty: false,
    saving: false,
  };

  await loadManifest().then((m) => { manifest = m.stickers; });

  const overlay = document.getElementById('skin-editor') as HTMLElement | null;
  if (overlay) overlay.hidden = false;
  renderEditor();
}

function closeEditor(): void {
  const overlay = document.getElementById('skin-editor') as HTMLElement | null;
  if (overlay) overlay.hidden = true;
  editor = null;
}

function wireEditor(_manager: ScreenManager): void {
  document.querySelector<HTMLButtonElement>('[data-action="se-cancel"]')?.addEventListener('click', closeEditor);
  document.querySelector<HTMLButtonElement>('[data-action="se-save"]')?.addEventListener('click', () => {
    void saveEditor();
  });

  // Tab switching (Stickers | Equipment)
  document.querySelectorAll<HTMLButtonElement>('.se-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!editor) return;
      editor.libTab = (btn.dataset['tab'] as LibTab | undefined) ?? 'stickers';
      renderLibrary();
    });
  });

  // Equipment filter
  document.getElementById('se-equip-filter')?.addEventListener('change', (e) => {
    if (!editor) return;
    editor.equipFilter = (e.currentTarget as HTMLSelectElement).value as EditorState['equipFilter'];
    renderLibrary();
  });

  // Base color picker
  document.getElementById('se-basecolor')?.addEventListener('input', (e) => {
    if (!editor) return;
    editor.recipe.baseColor = (e.currentTarget as HTMLInputElement).value;
    editor.dirty = true;
    updatePreview();
  });

  // Layer property inputs (delegated)
  const props = document.getElementById('se-props-body');
  props?.addEventListener('input', (e) => {
    if (!editor?.selectedLayerId) return;
    const input = e.target as HTMLInputElement;
    const prop = input.dataset['prop'];
    if (!prop) return;
    const layer = editor.recipe.layers.find((l) => l.id === editor?.selectedLayerId);
    if (!layer) return;
    if (prop === 'color') {
      layer.color = input.value;
    } else {
      const num = Number(input.value);
      if (!Number.isFinite(num)) return;
      if (prop === 'x') layer.x = num;
      else if (prop === 'y') layer.y = num;
      else if (prop === 'scale') layer.scale = num;
      else if (prop === 'rotation') layer.rotation = num;
      else if (prop === 'opacity') layer.opacity = num;
    }
    editor.dirty = true;
    updatePreview();
  });

  document.querySelector<HTMLButtonElement>('[data-action="se-clear-color"]')?.addEventListener('click', () => {
    if (!editor?.selectedLayerId) return;
    const layer = editor.recipe.layers.find((l) => l.id === editor?.selectedLayerId);
    if (!layer) return;
    layer.color = null;
    editor.dirty = true;
    renderPropertyPanel();
    updatePreview();
  });
}

function renderEditor(): void {
  if (!editor) return;
  const nameSpan = document.getElementById('se-slot-name');
  if (nameSpan) nameSpan.textContent = editor.slotName;
  renderLayers();
  renderPropertyPanel();
  renderLibrary();
  updatePreview();
}

function renderLayers(): void {
  const list = document.getElementById('se-layer-list');
  const count = document.getElementById('se-layer-count');
  if (!list || !editor) return;

  if (count) count.textContent = String(editor.recipe.layers.length);
  if (editor.recipe.layers.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state__title">No layers</div><div class="empty-state__hint">Click a sticker below to add a layer.</div></div>`;
    return;
  }

  list.innerHTML = editor.recipe.layers
    .map((layer, index) => {
      const meta = manifest.find((m) => m.id === layer.stickerId);
      const label = meta?.name ?? layer.stickerId;
      const isSel = layer.id === editor?.selectedLayerId;
      return `
      <div class="se-layer${isSel ? ' is-selected' : ''}" data-layer-id="${layer.id}">
        <span class="se-layer__num">${String(index + 1)}</span>
        <span class="se-layer__name">${escapeHtml(label)}</span>
        <span class="se-layer__ops">
          <button class="se-layer__op" data-op="up"      title="Move up">↑</button>
          <button class="se-layer__op" data-op="down"    title="Move down">↓</button>
          <button class="se-layer__op" data-op="dup"     title="Duplicate">⧉</button>
          <button class="se-layer__op is-danger" data-op="del" title="Delete">×</button>
        </span>
      </div>`;
    })
    .join('');

  list.querySelectorAll<HTMLElement>('.se-layer').forEach((el) => {
    el.addEventListener('click', (e) => {
      const op = (e.target as HTMLElement).closest<HTMLButtonElement>('.se-layer__op');
      const id = el.dataset['layerId'];
      if (!id || !editor) return;
      if (op) {
        e.stopPropagation();
        handleLayerOp(id, op.dataset['op'] ?? '');
        return;
      }
      editor.selectedLayerId = editor.selectedLayerId === id ? null : id;
      renderLayers();
      renderPropertyPanel();
    });
  });
}

function handleLayerOp(id: string, op: string): void {
  if (!editor) return;
  const layers = editor.recipe.layers;
  const idx = layers.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const layer = layers[idx];
  if (!layer) return;

  if (op === 'del') {
    layers.splice(idx, 1);
    if (editor.selectedLayerId === id) editor.selectedLayerId = null;
  } else if (op === 'dup') {
    const copy: AvatarLayer = { ...layer, id: newId() };
    layers.splice(idx + 1, 0, copy);
    editor.selectedLayerId = copy.id;
  } else if (op === 'up' && idx > 0) {
    const prev = layers[idx - 1];
    if (prev) {
      layers[idx - 1] = layer;
      layers[idx] = prev;
    }
  } else if (op === 'down' && idx < layers.length - 1) {
    const next = layers[idx + 1];
    if (next) {
      layers[idx + 1] = layer;
      layers[idx] = next;
    }
  } else {
    return;
  }

  editor.dirty = true;
  renderLayers();
  renderPropertyPanel();
  updatePreview();
}

function renderPropertyPanel(): void {
  if (!editor) return;
  const baseView = document.getElementById('se-props-base');
  const layerView = document.getElementById('se-props-layer');
  const title = document.getElementById('se-props-title');
  const hasLayer = !!editor.selectedLayerId;
  if (baseView) baseView.hidden = hasLayer;
  if (layerView) layerView.hidden = !hasLayer;
  if (title) title.textContent = hasLayer ? 'Layer Properties' : 'Base Color';

  if (!hasLayer) {
    const bc = document.getElementById('se-basecolor') as HTMLInputElement | null;
    if (bc) bc.value = editor.recipe.baseColor;
    return;
  }

  const layer = editor.recipe.layers.find((l) => l.id === editor?.selectedLayerId);
  if (!layer || !layerView) return;
  const set = (prop: string, value: string): void => {
    const input = layerView.querySelector<HTMLInputElement>(`[data-prop="${prop}"]`);
    if (input) input.value = value;
  };
  set('x', String(layer.x));
  set('y', String(layer.y));
  set('scale', String(layer.scale));
  set('rotation', String(layer.rotation));
  set('opacity', String(layer.opacity));
  set('color', layer.color ?? '#FFFFFF');
}

function renderLibrary(): void {
  if (!editor) return;
  const stickers = document.getElementById('se-stickers');
  const equipment = document.getElementById('se-equipment');
  const filter = document.getElementById('se-equip-filter') as HTMLSelectElement | null;
  document.querySelectorAll<HTMLButtonElement>('.se-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset['tab'] === editor?.libTab);
  });
  const isStickers = editor.libTab === 'stickers';
  if (stickers) stickers.hidden = !isStickers;
  if (equipment) equipment.hidden = isStickers;
  if (filter) filter.hidden = isStickers;

  if (isStickers) {
    renderStickers();
  } else {
    renderEquipment();
  }
}

function renderStickers(): void {
  const list = document.getElementById('se-stickers');
  if (!list) return;
  if (manifest.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state__title">No stickers</div><div class="empty-state__hint">Add SVGs to client/public/avatar/stickers/ and register in manifest.json.</div></div>`;
    return;
  }
  list.innerHTML = manifest
    .map(
      (m) => `
    <button class="se-asset" type="button" data-sticker="${m.id}" title="${escapeHtml(m.name)}">
      <img src="/avatar/stickers/${m.file}" alt="${escapeHtml(m.name)}"/>
    </button>`,
    )
    .join('');
  list.querySelectorAll<HTMLButtonElement>('.se-asset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset['sticker'];
      if (id) addLayerFromSticker(id);
    });
  });
}

function renderEquipment(): void {
  const list = document.getElementById('se-equipment');
  if (!list || !editor) return;
  const account = accountStore.get();
  const owned = account?.ownedCosmetics ?? [];
  const filtered = editor.equipFilter === 'all' ? owned : owned.filter((c) => c.category === editor?.equipFilter);
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state__title">No items owned</div><div class="empty-state__hint">Buy trails, death animations, and other effects from the Shop.</div></div>`;
    return;
  }
  const equipment = editor.recipe.equipment;
  list.innerHTML = filtered
    .map((c) => {
      const isEquipped = equipment[c.category] === c.id;
      return `
      <div class="se-equip-card${isEquipped ? ' is-equipped' : ''}" data-cosmetic="${c.id}" data-category="${c.category}">
        <span class="se-equip-card__name">${escapeHtml(c.name)}</span>
        <span class="se-equip-card__cat">${categoryLabel(c.category)}</span>
        <button class="mini-btn" type="button">${isEquipped ? 'Unequip' : 'Equip'}</button>
      </div>`;
    })
    .join('');
  list.querySelectorAll<HTMLElement>('.se-equip-card').forEach((el) => {
    el.addEventListener('click', () => {
      if (!editor) return;
      const id = el.dataset['cosmetic'];
      const cat = el.dataset['category'] as OwnedCosmetic['category'] | undefined;
      if (!id || !cat) return;
      const current = editor.recipe.equipment[cat];
      editor.recipe.equipment[cat] = current === id ? null : id;
      editor.dirty = true;
      renderEquipment();
    });
  });
}

function categoryLabel(c: OwnedCosmetic['category']): string {
  switch (c) {
    case 'trail': return 'Trail';
    case 'bulletTrail': return 'Bullet Trail';
    case 'deathAnimation': return 'Death Animation';
    case 'spawnEffect': return 'Spawn Effect';
  }
}

function addLayerFromSticker(stickerId: string): void {
  if (!editor) return;
  const layer: AvatarLayer = {
    id: newId(),
    stickerId,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    color: null,
  };
  editor.recipe.layers.push(layer);
  editor.selectedLayerId = layer.id;
  editor.dirty = true;
  renderLayers();
  renderPropertyPanel();
  updatePreview();
}

async function updatePreview(): Promise<void> {
  if (!editor) return;
  const img = document.getElementById('se-canvas-img') as HTMLImageElement | null;
  if (!img) return;
  try {
    const url = await composeAvatarDataUrl(editor.recipe);
    if (editor) img.src = url;
  } catch {
    /* ignore render errors */
  }
}

async function saveEditor(): Promise<void> {
  if (!editor || editor.saving) return;
  const btn = document.getElementById('se-save-btn') as HTMLButtonElement | null;
  editor.saving = true;
  if (btn) btn.disabled = true;
  try {
    const account = await apiSaveSlot(editor.slotIndex, editor.recipe, editor.slotName);
    accountStore.set(account);
    slotPreviewCache.clear();
    void renderSlots();
    closeEditor();
  } catch {
    /* keep editor open on error */
  } finally {
    if (btn) btn.disabled = false;
    if (editor) editor.saving = false;
  }
}

function cloneRecipe(r: AvatarRecipe): AvatarRecipe {
  return {
    baseColor: r.baseColor,
    layers: r.layers.map((l) => ({ ...l })),
    equipment: { ...(r.equipment ?? defaultRecipe().equipment) },
  };
}

function newId(): string {
  return `l_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}
