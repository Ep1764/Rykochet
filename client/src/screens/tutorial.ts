import type { ScreenManager } from '../ui/screen-manager.js';

interface Lesson {
  id: string;
  name: string;
  teaches: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  length: string;
}

const LESSONS: Lesson[] = [
  { id: 'basics',    name: 'Basics',            teaches: 'Movement, momentum, and heavy', difficulty: 'Easy',   length: '2 min' },
  { id: 'aiming',    name: 'Aiming',            teaches: 'Reading angles and lead shots', difficulty: 'Medium', length: '3 min' },
  { id: 'rykochet',  name: 'Ricochets',         teaches: 'Bank shots off walls',          difficulty: 'Medium', length: '4 min' },
  { id: 'grapple',   name: 'Grapple Fundamentals', teaches: 'Swinging and anchor timing',  difficulty: 'Hard',  length: '5 min' },
  { id: 'advanced',  name: 'Advanced Movement', teaches: 'Cancels, dashes, wall touches', difficulty: 'Hard',   length: '6 min' },
];

export function mountTutorial(manager: ScreenManager): void {
  const list = document.getElementById('tut-mode-list');
  if (!list) return;

  list.innerHTML = LESSONS.map(
    (l, i) => `
    <div class="tile qp-mode${i === 0 ? ' is-active' : ''}" data-lesson="${l.id}">
      <span class="qp-mode__name">${l.name}</span>
      <span class="qp-mode__count">${l.difficulty}</span>
    </div>`,
  ).join('');

  const select = (l: Lesson): void => {
    list.querySelectorAll<HTMLElement>('.qp-mode').forEach((el) => {
      el.classList.toggle('is-active', el.dataset['lesson'] === l.id);
    });
    setText('tut-desc-title', l.name);
    setText('tut-desc-teach', l.teaches);
    setText('tut-desc-diff', l.difficulty);
    setText('tut-desc-len', l.length);
  };

  list.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.qp-mode');
    if (!el) return;
    const lesson = LESSONS.find((x) => x.id === el.dataset['lesson']);
    if (lesson) select(lesson);
  });

  document.getElementById('tut-launch')?.addEventListener('click', () => {
    // Placeholder — loads the tutorial map.
  });

  document.querySelectorAll<HTMLButtonElement>('#screen-tutorial [data-nav]').forEach((b) => {
    b.addEventListener('click', () => {
      manager.show('menu');
    });
  });

  if (LESSONS[0]) select(LESSONS[0]);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
