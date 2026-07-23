import type { ScreenManager } from '../ui/screen-manager.js';

interface Mode {
  id: string;
  name: string;
  players: number;
  objective: string;
  controls: string;
  overview: string;
}

const MODES: Mode[] = [
  { id: 'classic',  name: 'Classic',       players: 1204, objective: 'Knock everyone else off the map.',            controls: 'Move · Heavy',            overview: 'The original mode. Physics-driven balls, momentum matters, last one standing wins the round.' },
  { id: 'rykochet', name: 'Rykochet',      players: 862,  objective: 'Bounce arrows off walls to hit opponents.',    controls: 'Move · Aim · Heavy',      overview: 'Signature Rykochet mode. Every shot ricochets — angles decide the round.' },
  { id: 'bullet',   name: 'Bullet',        players: 517,  objective: 'Fast projectiles, high skill ceiling.',        controls: 'Move · Fire · Heavy',     overview: 'Snappy fire, low damage. Movement is everything.' },
  { id: 'rubber',   name: 'Rubber Bullet', players: 231,  objective: 'Slow, heavy shots that bounce forever.',       controls: 'Move · Fire · Heavy',     overview: 'Bounces stay live. The arena fills up fast — read the patterns.' },
  { id: 'grapple',  name: 'Grapple',       players: 674,  objective: 'Swing across the map, control zones.',         controls: 'Move · Grapple · Heavy',  overview: 'Attach and swing. Verticality opens up new lines everyone else cannot reach.' },
];

export function mountQuickPlay(manager: ScreenManager): void {
  const list = document.getElementById('qp-mode-list');
  if (!list) return;

  list.innerHTML = MODES.map(
    (m, i) => `
    <div class="tile qp-mode${i === 0 ? ' is-active' : ''}" data-mode="${m.id}">
      <span class="qp-mode__name">${m.name}</span>
      <span class="qp-mode__count"><b>${m.players.toLocaleString()}</b> playing</span>
    </div>`,
  ).join('');

  const select = (m: Mode): void => {
    list.querySelectorAll<HTMLElement>('.qp-mode').forEach((el) => {
      el.classList.toggle('is-active', el.dataset['mode'] === m.id);
    });
    setText('qp-desc-title', m.name);
    setText('qp-desc-obj', m.objective);
    setText('qp-desc-ctrl', m.controls);
    setText('qp-desc-over', m.overview);
    setText('qp-live-num', m.players.toLocaleString());
    const ph = document.getElementById('qp-showcase-ph');
    if (ph) ph.textContent = `${m.name} · Snapshot`;
  };

  list.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.qp-mode');
    if (!el) return;
    const mode = MODES.find((x) => x.id === el.dataset['mode']);
    if (mode) select(mode);
  });

  document.getElementById('qp-launch')?.addEventListener('click', () => {
    // Placeholder for matchmaking.
  });

  document.querySelectorAll<HTMLButtonElement>('#screen-quickplay [data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      manager.show('menu');
    });
  });

  if (MODES[0]) select(MODES[0]);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
