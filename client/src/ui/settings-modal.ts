interface KeybindRow {
  action: string;
  defaults: [string, string, string];
}

const ROWS: KeybindRow[] = [
  { action: 'Move Up',    defaults: ['W',     'ArrowUp',    ''] },
  { action: 'Move Left',  defaults: ['A',     'ArrowLeft',  ''] },
  { action: 'Move Down',  defaults: ['S',     'ArrowDown',  ''] },
  { action: 'Move Right', defaults: ['D',     'ArrowRight', ''] },
  { action: 'Heavy',      defaults: ['Shift', 'ControlRight', ''] },
  { action: 'Special',    defaults: ['Space', 'Enter',      ''] },
];

export function mountSettingsModal(): { open: () => void; close: () => void } {
  const modal = document.getElementById('settings-modal') as HTMLElement | null;
  const cpModal = document.getElementById('change-password-modal') as HTMLElement | null;
  const tbody = document.getElementById('keybind-tbody');
  if (!modal || !cpModal || !tbody) return { open: () => {}, close: () => {} };

  buildKeybindTable(tbody);
  wireKeybindListening(tbody);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  modal.querySelector('[data-action="close-settings"]')?.addEventListener('click', close);

  modal.querySelector('[data-action="open-change-password"]')?.addEventListener('click', () => {
    cpModal.hidden = false;
  });
  cpModal.addEventListener('click', (e) => {
    if (e.target === cpModal) cpModal.hidden = true;
  });
  cpModal.querySelector('[data-action="close-change-password"]')?.addEventListener('click', () => {
    cpModal.hidden = true;
  });
  (document.getElementById('cp-form') as HTMLFormElement | null)?.addEventListener('submit', (e) => {
    e.preventDefault();
    cpModal.hidden = true;
  });

  // Quality segmented control
  const seg = modal.querySelectorAll<HTMLButtonElement>('.segmented__opt');
  seg.forEach((b) => {
    b.addEventListener('click', () => {
      seg.forEach((x) => x.classList.toggle('is-active', x === b));
    });
  });

  function open(): void { modal!.hidden = false; }
  function close(): void { modal!.hidden = true; }

  return { open, close };
}

function buildKeybindTable(tbody: HTMLElement): void {
  tbody.innerHTML = ROWS.map(
    (r) => `
    <tr>
      <td>${r.action}</td>
      <td>${kbdCell(r.defaults[0])}</td>
      <td>${kbdCell(r.defaults[1])}</td>
      <td>${kbdCell(r.defaults[2])}</td>
    </tr>`,
  ).join('');
}

function kbdCell(value: string): string {
  const empty = value === '';
  const label = empty ? '—' : prettyKey(value);
  return `<button class="kbd${empty ? ' kbd--empty' : ''}" type="button" data-key="${value}">${label}</button>`;
}

function prettyKey(k: string): string {
  if (k.startsWith('Arrow')) return { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }[k] ?? k;
  if (k === 'Space') return '␣';
  if (k === 'ControlRight') return 'RCtrl';
  return k;
}

function wireKeybindListening(tbody: HTMLElement): void {
  let listening: HTMLButtonElement | null = null;

  tbody.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.kbd');
    if (!btn) return;
    if (listening) listening.classList.remove('is-listening');
    listening = btn;
    btn.classList.add('is-listening');
    btn.textContent = '…';
  });

  window.addEventListener('keydown', (e) => {
    if (!listening) return;
    e.preventDefault();
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.code;
    listening.dataset['key'] = key;
    listening.classList.remove('is-listening', 'kbd--empty');
    listening.textContent = prettyKey(key);
    listening = null;
  });
}
