import type { AuthAccount, AvatarRecipe, PublicAvatarResponse } from '@rykochet/shared';

import { ApiCallError } from './auth.js';

async function req<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init });
  const text = await res.text();
  const data: unknown = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; message?: string };
    throw new ApiCallError(err.error ?? 'http_error', err.message ?? `HTTP ${String(res.status)}`, res.status);
  }
  return data as T;
}

export function apiSaveSlot(index: number, recipe: AvatarRecipe, name?: string): Promise<AuthAccount> {
  return req<AuthAccount>(`/api/avatar/slot/${String(index)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ recipe, name }),
  });
}

export function apiSelectSlot(index: number): Promise<AuthAccount> {
  return req<AuthAccount>(`/api/avatar/slot/${String(index)}/select`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
}

export function apiFetchPublicAvatar(accountId: string): Promise<PublicAvatarResponse> {
  return req<PublicAvatarResponse>(`/api/avatar/user/${accountId}`);
}
