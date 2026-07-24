import { randomBytes } from 'node:crypto';

import type { FastifyReply } from 'fastify';

import { pool } from './db.js';

export const SESSION_COOKIE = 'rk_sid';
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
const SHORT_MS = 24 * 60 * 60 * 1000;

export function newToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(params: {
  accountId: string;
  fingerprint: string | null;
  ip: string | null;
  remember: boolean;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const ttl = params.remember ? REMEMBER_MS : SHORT_MS;
  const expiresAt = new Date(Date.now() + ttl);
  await pool.query(
    `INSERT INTO sessions (token, account_id, fingerprint, ip, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [token, params.accountId, params.fingerprint, params.ip, expiresAt],
  );
  return { token, expiresAt };
}

export async function lookupSession(
  token: string,
): Promise<{ accountId: string } | null> {
  const { rows } = await pool.query<{ account_id: string }>(
    `UPDATE sessions
        SET last_used_at = NOW()
      WHERE token = $1
        AND NOT revoked
        AND expires_at > NOW()
      RETURNING account_id`,
    [token],
  );
  const row = rows[0];
  if (!row) return null;
  return { accountId: row.account_id };
}

export async function revokeSession(token: string): Promise<void> {
  await pool.query(`UPDATE sessions SET revoked = TRUE WHERE token = $1`, [token]);
}

export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  remember: boolean,
  isProd: boolean,
): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor((remember ? REMEMBER_MS : SHORT_MS) / 1000),
  });
}

export function clearSessionCookie(reply: FastifyReply, isProd: boolean): void {
  reply.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });
}
