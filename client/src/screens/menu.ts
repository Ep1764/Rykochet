import type { ScreenManager, ScreenName } from '../ui/screen-manager.js';

export function mountMenu(manager: ScreenManager): void {
  document.querySelectorAll<HTMLButtonElement>('#screen-menu .pnav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset['nav'] as ScreenName | undefined;
      if (target) manager.show(target);
    });
  });

  document.querySelectorAll<HTMLButtonElement>('.recording-strip .rc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Placeholder: wire real recording controls later.
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
