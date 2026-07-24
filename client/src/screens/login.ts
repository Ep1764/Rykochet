import { apiLogin, apiSignup, ApiCallError } from '../api/auth.js';
import { accountStore } from '../state/account.js';
import type { ScreenManager } from '../ui/screen-manager.js';

export function mountLogin(manager: ScreenManager): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.login-tab');
  const forms = {
    signin: document.getElementById('form-signin') as HTMLFormElement | null,
    signup: document.getElementById('form-signup') as HTMLFormElement | null,
  };
  const errorEl = document.getElementById('login-error') as HTMLElement | null;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset['tab'] as 'signin' | 'signup' | undefined;
      if (!target) return;
      tabs.forEach((t) => t.classList.toggle('is-active', t === tab));
      forms.signin?.classList.toggle('is-active', target === 'signin');
      forms.signup?.classList.toggle('is-active', target === 'signup');
      clearError();
    });
  });

  forms.signin?.addEventListener('submit', (e) => {
    e.preventDefault();
    void handleSignin(forms.signin!);
  });

  forms.signup?.addEventListener('submit', (e) => {
    e.preventDefault();
    void handleSignup(forms.signup!);
  });

  async function handleSignin(form: HTMLFormElement): Promise<void> {
    clearError();
    const fd = new FormData(form);
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    setBusy(submit, true);
    try {
      const account = await apiLogin({
        username: String(fd.get('username') ?? '').trim(),
        password: String(fd.get('password') ?? ''),
        rememberMe: fd.get('remember') === 'on',
      });
      accountStore.set(account);
      manager.show('menu');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(submit, false);
    }
  }

  async function handleSignup(form: HTMLFormElement): Promise<void> {
    clearError();
    const fd = new FormData(form);
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    setBusy(submit, true);
    try {
      const account = await apiSignup({
        username: String(fd.get('username') ?? '').trim(),
        password: String(fd.get('password') ?? ''),
        securityQuestion: String(fd.get('question') ?? ''),
        securityAnswer: String(fd.get('answer') ?? ''),
        rememberMe: fd.get('remember') === 'on',
      });
      accountStore.set(account);
      manager.show('menu');
    } catch (err) {
      showError(err);
    } finally {
      setBusy(submit, false);
    }
  }

  function clearError(): void {
    if (errorEl) errorEl.textContent = '';
  }
  function showError(err: unknown): void {
    if (!errorEl) return;
    if (err instanceof ApiCallError) errorEl.textContent = err.message;
    else errorEl.textContent = 'Something went wrong. Try again.';
  }
  function setBusy(btn: HTMLButtonElement | null, busy: boolean): void {
    if (!btn) return;
    btn.disabled = busy;
    btn.dataset['busy'] = busy ? '1' : '';
  }
}
