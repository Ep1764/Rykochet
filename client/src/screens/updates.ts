import type { ScreenManager } from '../ui/screen-manager.js';

interface Entry {
  version: string;
  date: string;
  new?: string[];
  fix?: string[];
  bal?: string[];
  rmv?: string[];
}

const ENTRIES: Entry[] = [
  {
    version: 'v0.0.1',
    date: '2026-07-23',
    new: [
      'Scaffold: login, main menu, parties, lobby, shop, tutorial, avatar, updates screens.',
      'Persistent stats bar with slide-down animation.',
      'Settings modal with keybinds (3 pairs per action), gameplay, and account sections.',
    ],
    fix: ['Recording controls moved to top of main menu.'],
  },
  {
    version: 'v0.0.0',
    date: '2026-07-22',
    new: ['Initial project scaffold: client (Vite + TS), server (Fastify + Postgres), shared types.', 'Deployment pipeline: dev → prod split with basic auth on dev.'],
  },
];

export function mountUpdates(manager: ScreenManager): void {
  const list = document.getElementById('up-list');
  if (!list) return;
  list.innerHTML = ENTRIES.map(
    (e) => `
    <div class="up-entry">
      <div class="up-entry__head">
        <span class="up-entry__version">${e.version}</span>
        <span class="up-entry__date">${e.date}</span>
      </div>
      ${group('New',      'new', e.new)}
      ${group('Fixes',    'fix', e.fix)}
      ${group('Balance',  'bal', e.bal)}
      ${group('Removed',  'rmv', e.rmv)}
    </div>`,
  ).join('');

  document.querySelectorAll<HTMLButtonElement>('#screen-updates [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });
}

function group(label: string, kind: string, items: string[] | undefined): string {
  if (!items || items.length === 0) return '';
  return `
    <div class="up-group">
      <span class="up-group__label up-group__label--${kind}">${label}</span>
      <ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>
    </div>`;
}
