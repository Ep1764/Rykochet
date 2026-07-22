import type { ScreenManager } from '../ui/screen-manager.js';

export function mountLogin(manager: ScreenManager): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.login-tab');
  const forms = {
    signin: document.getElementById('form-signin') as HTMLFormElement | null,
    signup: document.getElementById('form-signup') as HTMLFormElement | null,
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset['tab'] as 'signin' | 'signup' | undefined;
      if (!target) return;
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      forms.signin?.classList.toggle('is-active', target === 'signin');
      forms.signup?.classList.toggle('is-active', target === 'signup');
    });
  });

  forms.signin?.addEventListener('submit', (e) => {
    e.preventDefault();
    manager.show('menu');
  });

  forms.signup?.addEventListener('submit', (e) => {
    e.preventDefault();
    manager.show('menu');
  });
}
