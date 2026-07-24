import type {
  ApiError,
  AuthAccount,
  LoginRequest,
  RecoverStartResponse,
  SignupRequest,
} from '@rykochet/shared';

import { getFingerprint } from './fingerprint.js';

export class ApiCallError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await handle<T>(res);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  return await handle<T>(res);
}

async function handle<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data: unknown = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiError>;
    throw new ApiCallError(err.error ?? 'http_error', err.message ?? `HTTP ${String(res.status)}`, res.status);
  }
  return data as T;
}

export async function apiSignup(input: Omit<SignupRequest, 'fingerprint'>): Promise<AuthAccount> {
  const fingerprint = await getFingerprint();
  return post<AuthAccount>('/api/auth/signup', { ...input, fingerprint });
}

export async function apiLogin(input: Omit<LoginRequest, 'fingerprint'>): Promise<AuthAccount> {
  const fingerprint = await getFingerprint();
  return post<AuthAccount>('/api/auth/login', { ...input, fingerprint });
}

export async function apiLogout(): Promise<void> {
  await post<{ ok: true }>('/api/auth/logout', {});
}

export async function apiMe(): Promise<AuthAccount | null> {
  try {
    return await get<AuthAccount>('/api/auth/me');
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 401) return null;
    throw err;
  }
}

export async function apiRecoverStart(username: string): Promise<RecoverStartResponse> {
  return post<RecoverStartResponse>('/api/auth/recover/start', { username });
}

export async function apiRecoverVerify(
  username: string,
  securityAnswer: string,
  newPassword: string,
): Promise<void> {
  await post<{ ok: true }>('/api/auth/recover/verify', { username, securityAnswer, newPassword });
}
