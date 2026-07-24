import type { FastifyInstance } from 'fastify';

import { lookupSession, SESSION_COOKIE } from '../session.js';
import { pool } from '../db.js';
import type { Role } from '@rykochet/shared';

interface AccountRow {
  id: string;
  username: string;
  role: Role;
  disabled: boolean;
}

export async function sessionPlugin(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', async (req) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return;
    const s = await lookupSession(token);
    if (!s) return;
    const { rows } = await pool.query<AccountRow>(
      `SELECT id::text, username, role, disabled FROM accounts WHERE id = $1`,
      [s.accountId],
    );
    const acc = rows[0];
    if (!acc || acc.disabled) return;
    req.user = { id: acc.id, username: acc.username, role: acc.role };
  });
}
