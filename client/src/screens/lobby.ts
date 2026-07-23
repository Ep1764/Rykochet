import type { ScreenManager } from '../ui/screen-manager.js';

type Team = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'none';

interface Player { name: string; level: number; team: Team; ready: boolean; host?: boolean; }

const PLAYERS: Player[] = [
  { name: 'Quixlume', level: 42, team: 'blue',  ready: true,  host: true },
  { name: 'Nyx',      level: 31, team: 'red',   ready: false },
  { name: 'ivy',      level: 18, team: 'green', ready: true },
];

const SPECS = ['toby', 'kai'];

export function mountLobby(manager: ScreenManager): void {
  renderPlayers();
  renderSpecs();
  renderChat();
  wireControls(manager);
}

function renderPlayers(): void {
  const grid = document.getElementById('lb-player-grid');
  if (!grid) return;
  grid.innerHTML = PLAYERS.map(
    (p) => `
    <div class="player-box team-${p.team === 'none' ? 'none' : p.team}">
      <span class="player-box__avatar"></span>
      <span>
        <span class="player-box__name">${p.name}${p.host ? ' 👑' : ''}</span>
        <br><span class="player-box__meta">Lvl ${String(p.level)} · ${cap(p.team)}</span>
      </span>
      <span>
        ${p.ready ? '<span class="player-box__ready">✓</span>' : '<span class="player-box__conn"></span>'}
      </span>
    </div>`,
  ).join('');
  const count = document.getElementById('lb-player-count');
  if (count) count.textContent = `${String(PLAYERS.length)} / 8`;
}

function renderSpecs(): void {
  const list = document.getElementById('lb-spec-list');
  if (!list) return;
  list.innerHTML = SPECS.map((n) => `<span class="spec-chip">👁 ${n}</span>`).join('');
}

function renderChat(): void {
  const log = document.getElementById('lb-chat-log');
  if (!log) return;
  const lines: string[] = [
    `<div class="chat-sys--join">→ Quixlume joined.</div>`,
    `<div class="chat-sys--join">→ Nyx joined.</div>`,
    `<div class="chat-line"><span class="chat-line__user">Quixlume:</span> gl hf</div>`,
    `<div class="chat-line"><span class="chat-line__user">Nyx:</span> ready when you are</div>`,
    `<div class="chat-sys--join">→ ivy joined.</div>`,
    `<div class="chat-line"><span class="chat-line__user">ivy</span> requested <span class="chat-line__map">Meridian</span><span class="chat-line__load" data-action="lb-load-map">Load</span></div>`,
    `<div class="chat-sys--count">Game starting in 3…</div>`,
  ];
  log.innerHTML = lines.join('');
  log.scrollTop = log.scrollHeight;

  const input = document.getElementById('lb-chat-input') as HTMLInputElement | null;
  input?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const value = input.value.trim();
    if (!value) return;
    const html = `<div class="chat-line"><span class="chat-line__user">You:</span> ${escape(value)}</div>`;
    log.insertAdjacentHTML('beforeend', html);
    log.scrollTop = log.scrollHeight;
    input.value = '';
  });
}

function wireControls(manager: ScreenManager): void {
  const lock = document.querySelector<HTMLButtonElement>('[data-action="toggle-teamlock"]');
  lock?.addEventListener('click', () => {
    const on = lock.classList.toggle('is-locked');
    lock.textContent = on ? '🔒 Lock Teams' : '🔒 Unlock Teams';
  });

  document.querySelectorAll<HTMLButtonElement>('#screen-lobby .mini-btn').forEach((b) => {
    b.addEventListener('click', () => {
      // Placeholders — real behavior wired later.
    });
  });

  document.querySelector<HTMLButtonElement>('[data-action="lb-play"]')?.addEventListener('click', () => {
    // Match-start placeholder.
  });
}

function cap(t: Team): string { return t.charAt(0).toUpperCase() + t.slice(1); }
function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}
