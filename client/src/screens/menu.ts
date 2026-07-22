import type { ScreenManager } from '../ui/screen-manager.js';

export function mountMenu(manager: ScreenManager): void {
  const logout = document.querySelector<HTMLButtonElement>('[data-action="logout"]');
  logout?.addEventListener('click', () => {
    manager.show('login');
  });

  document.querySelectorAll<HTMLButtonElement>('.rc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Placeholder: recording control actions wired up later.
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.pnav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Placeholder: primary nav routes wired up later.
    });
  });

  drawBackgroundPlaceholder();
}

function drawBackgroundPlaceholder(): void {
  const canvas = document.getElementById('menu-background-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = (): void => {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, '#071411');
    g.addColorStop(0.5, '#0B1F1A');
    g.addColorStop(1, '#102B24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);
}
