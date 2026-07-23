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
    version: 'v0.0.3',
    date: '2026-07-23',
    fix: [
      'Fixed main menu layout — brand top-left, navigation dead-center, secondary nav pinned to bottom-right.',
      'Removed decorative icon squares from primary navigation buttons.',
    ],
    rmv: [
      'Removed all placeholder content from Quick Play, Parties, Lobby, Shop, Tutorial, and Avatar screens. Screens now show empty states until the backend is connected.',
    ],
  },
  {
    version: 'v0.0.2',
    date: '2026-07-23',
    new: [
      'Refactored main menu into a compact vertical stack inside a parent panel.',
      'Added persistent stats bar with slide-down-on-hover behavior.',
      'Added settings modal (keybinds table with three pairs per action, gameplay options, account section with change-password flow).',
      'Scaffolded all main-menu subpages: Quick Play, Parties, Lobby, Shop, Tutorial, Avatar, Updates.',
    ],
    fix: [
      'Moved recording controls to the top of the main menu.',
    ],
  },
  {
    version: 'v0.0.1',
    date: '2026-07-22',
    new: [
      'Initial project scaffold: client (Vite + TypeScript), server (Fastify + PostgreSQL), shared types.',
      'Deployment pipeline: dev → prod split with basic auth on dev.',
      'Client build: minification + heavy obfuscation for production.',
    ],
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
