import type { ScreenManager } from '../ui/screen-manager.js';

interface Lobby {
  name: string;
  host: string;
  mode: string;
  minLvl: number;
  cur: number;
  max: number;
  region: string;
  locked: boolean;
  full: boolean;
}

const SAMPLE: Lobby[] = [
  { name: 'Ranked Grind #1',    host: 'Nyx',     mode: 'Classic',       minLvl: 10, cur: 6, max: 8,  region: 'NA', locked: false, full: false },
  { name: 'Casual Rykochets',   host: 'Baker',   mode: 'Rykochet',      minLvl: 0,  cur: 8, max: 8,  region: 'EU', locked: false, full: true  },
  { name: 'Bring your best',    host: 'Quixlume',mode: 'Bullet',        minLvl: 25, cur: 3, max: 12, region: 'NA', locked: true,  full: false },
  { name: 'Chill grapple',      host: 'ivy',     mode: 'Grapple',       minLvl: 5,  cur: 4, max: 6,  region: 'EU', locked: false, full: false },
  { name: 'Rubber bounce room', host: 'toby',    mode: 'Rubber Bullet', minLvl: 15, cur: 2, max: 8,  region: 'AS', locked: false, full: false },
  { name: 'Newbies welcome',    host: 'kai',     mode: 'Classic',       minLvl: 0,  cur: 5, max: 16, region: 'SA', locked: false, full: false },
];

export function mountParties(manager: ScreenManager): void {
  const tbody = document.getElementById('lobby-tbody');
  if (!tbody) return;

  const render = (): void => {
    tbody.innerHTML = SAMPLE.map(
      (l) => `
      <tr class="${l.locked ? 'is-locked' : ''} ${l.full ? 'is-full' : ''}" data-lobby="${l.name}">
        <td>${l.name}</td>
        <td>${l.host}</td>
        <td>${l.mode}</td>
        <td>${String(l.minLvl)}</td>
        <td class="lb-count"><b>${String(l.cur)}</b>/${String(l.max)}</td>
        <td><span class="lb-region">${l.region}</span></td>
        <td>${l.locked ? '<span class="lb-lock lb-lock--on">🔒 Yes</span>' : '<span class="lb-lock">—</span>'}</td>
      </tr>`,
    ).join('');
  };
  render();
  setText('parties-total-lobbies', String(SAMPLE.length));
  setText('parties-total-players', String(SAMPLE.reduce((a, l) => a + l.cur, 0)));

  tbody.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('tr');
    if (!row) return;
    playJoinSequence(() => {
      manager.show('lobby');
    });
  });

  document.querySelectorAll<HTMLButtonElement>('#screen-parties [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });

  const clOpen = document.querySelector<HTMLButtonElement>('[data-action="open-create-lobby"]');
  const clModal = document.getElementById('create-lobby-modal') as HTMLElement | null;
  clOpen?.addEventListener('click', () => {
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
    if (clModal) clModal.hidden = true;
    manager.show('lobby');
  });
}

function playJoinSequence(onDone: () => void): void {
  const modal = document.getElementById('join-progress-modal') as HTMLElement | null;
  if (!modal) return;
  const lines = modal.querySelectorAll<HTMLElement>('.jp-line');
  lines.forEach((l) => {
    l.classList.remove('is-active', 'is-done');
  });
  modal.hidden = false;

  let step = 0;
  const tick = (): void => {
    if (step > 0) lines[step - 1]?.classList.add('is-done');
    if (step >= lines.length) {
      window.setTimeout(() => {
        modal.hidden = true;
        onDone();
      }, 350);
      return;
    }
    lines[step]?.classList.remove('is-done');
    lines[step]?.classList.add('is-active');
    step++;
    window.setTimeout(tick, 380);
  };
  tick();
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
