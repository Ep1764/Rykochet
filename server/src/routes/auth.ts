import argon2 from 'argon2';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type {
  ApiError,
  AuthAccount,
  LoginRequest,
  RecoverStartRequest,
  RecoverStartResponse,
  RecoverVerifyRequest,
  SignupRequest,
} from '@rykochet/shared';

import { config } from '../config.js';
import {
  findAccountByUsername,
  insertAccount,
  loadAccount,
  recordLogin,
  updatePassword,
} from '../db-account.js';
import {
  clearSessionCookie,
  createSession,
  revokeSession,
  SESSION_COOKIE,
  setSessionCookie,
} from '../session.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD = 8;
const MIN_ANSWER = 2;

function bad(reply: FastifyReply, status: number, code: string, message: string): ApiError {
  void reply.code(status);
  return { error: code, message };
}

function clientIp(req: FastifyRequest): string | null {
  const raw = req.ip;
  return raw ? raw : null;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/auth/signup', async (req, reply) => {
    const body = req.body as Partial<SignupRequest> | undefined;
    if (!body) return bad(reply, 400, 'bad_body', 'Missing body.');
    const { username, password, securityQuestion, securityAnswer } = body;
    const rememberMe = Boolean(body.rememberMe);
    const fingerprint = typeof body.fingerprint === 'string' ? body.fingerprint : null;

    if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
      return bad(reply, 400, 'bad_username', '3-20 chars, letters/digits/underscore.');
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
      return bad(reply, 400, 'bad_password', `Password must be at least ${String(MIN_PASSWORD)} characters.`);
    }
    if (typeof securityQuestion !== 'string' || securityQuestion.length < 1) {
      return bad(reply, 400, 'bad_question', 'Pick a security question.');
    }
    if (typeof securityAnswer !== 'string' || securityAnswer.trim().length < MIN_ANSWER) {
      return bad(reply, 400, 'bad_answer', 'Security answer too short.');
    }

    const existing = await findAccountByUsername(username);
    if (existing) return bad(reply, 409, 'username_taken', 'That username is already in use.');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const answerHash = await argon2.hash(securityAnswer.trim().toLowerCase(), { type: argon2.argon2id });

    const id = await insertAccount({
      username,
      passwordHash,
      securityQuestion,
      securityAnswerHash: answerHash,
    });

    await recordLogin(id, clientIp(req), fingerprint);
    const { token } = await createSession({ accountId: id, fingerprint, ip: clientIp(req), remember: rememberMe });
    setSessionCookie(reply, token, rememberMe, config.isProd);

    const account = await loadAccount(id);
    if (!account) return bad(reply, 500, 'load_failed', 'Account created but failed to load.');
    return account;
  });

  app.post('/api/auth/login', async (req, reply) => {
    const body = req.body as Partial<LoginRequest> | undefined;
    if (!body) return bad(reply, 400, 'bad_body', 'Missing body.');
    const { username, password } = body;
    const rememberMe = Boolean(body.rememberMe);
    const fingerprint = typeof body.fingerprint === 'string' ? body.fingerprint : null;

    if (typeof username !== 'string' || typeof password !== 'string') {
      return bad(reply, 400, 'bad_credentials', 'Username and password required.');
    }

    const acc = await findAccountByUsername(username);
    if (!acc) return bad(reply, 401, 'invalid_credentials', 'Invalid username or password.');
    if (acc.disabled) return bad(reply, 403, 'account_disabled', 'This account has been disabled.');

    const ok = await argon2.verify(acc.password_hash, password);
    if (!ok) return bad(reply, 401, 'invalid_credentials', 'Invalid username or password.');

    await recordLogin(acc.id, clientIp(req), fingerprint);
    const { token } = await createSession({ accountId: acc.id, fingerprint, ip: clientIp(req), remember: rememberMe });
    setSessionCookie(reply, token, rememberMe, config.isProd);

    const account = await loadAccount(acc.id);
    if (!account) return bad(reply, 500, 'load_failed', 'Login OK but failed to load account.');
    return account;
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) await revokeSession(token);
    clearSessionCookie(reply, config.isProd);
    return { ok: true };
  });

  app.get('/api/auth/me', async (req, reply): Promise<AuthAccount | ApiError> => {
    if (!req.user) return bad(reply, 401, 'unauthenticated', 'Not logged in.');
    const account = await loadAccount(req.user.id);
    if (!account) return bad(reply, 401, 'unauthenticated', 'Session invalid.');
    return account;
  });

  app.post('/api/auth/recover/start', async (req, reply): Promise<RecoverStartResponse | ApiError> => {
    const body = req.body as Partial<RecoverStartRequest> | undefined;
    if (!body || typeof body.username !== 'string') {
      return bad(reply, 400, 'bad_body', 'Missing username.');
    }
    const acc = await findAccountByUsername(body.username);
    if (!acc) return bad(reply, 404, 'not_found', 'No such account.');
    return { securityQuestion: acc.security_question };
  });

  app.post('/api/auth/recover/verify', async (req, reply) => {
    const body = req.body as Partial<RecoverVerifyRequest> | undefined;
    if (!body || typeof body.username !== 'string' || typeof body.securityAnswer !== 'string' || typeof body.newPassword !== 'string') {
      return bad(reply, 400, 'bad_body', 'Missing fields.');
    }
    if (body.newPassword.length < MIN_PASSWORD) {
      return bad(reply, 400, 'bad_password', `Password must be at least ${String(MIN_PASSWORD)} characters.`);
    }
    const acc = await findAccountByUsername(body.username);
    if (!acc) return bad(reply, 404, 'not_found', 'No such account.');
    const ok = await argon2.verify(acc.security_answer_hash, body.securityAnswer.trim().toLowerCase());
    if (!ok) return bad(reply, 401, 'wrong_answer', 'Security answer is incorrect.');
    const newHash = await argon2.hash(body.newPassword, { type: argon2.argon2id });
    await updatePassword(acc.id, newHash);
    return { ok: true };
  });
}
