import type {
  AccountSettings,
  AuthAccount,
  AvatarSlot,
  FriendSummary,
  MapSummary,
  Role,
} from '@rykochet/shared';
import { DEFAULT_SETTINGS } from '@rykochet/shared';

import { pool } from './db.js';

interface AccountRow {
  id: string;
  username: string;
  role: Role;
  level: number;
  xp: number;
  coins: number;
  selected_avatar_slot: number;
  settings: unknown;
  created_at: Date;
  disabled: boolean;
}

export async function findAccountByUsername(username: string): Promise<{
  id: string;
  username: string;
  password_hash: string;
  security_question: string;
  security_answer_hash: string;
  role: Role;
  disabled: boolean;
} | null> {
  const { rows } = await pool.query(
    `SELECT id::text, username, password_hash, security_question, security_answer_hash, role, disabled
       FROM accounts WHERE lower(username) = lower($1)`,
    [username],
  );
  return rows[0] ?? null;
}

export async function insertAccount(params: {
  username: string;
  passwordHash: string;
  securityQuestion: string;
  securityAnswerHash: string;
}): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO accounts (username, password_hash, security_question, security_answer_hash, settings)
       VALUES ($1, $2, $3, $4, $5) RETURNING id::text`,
      [
        params.username,
        params.passwordHash,
        params.securityQuestion,
        params.securityAnswerHash,
        JSON.stringify(DEFAULT_SETTINGS),
      ],
    );
    const id = rows[0]?.id;
    if (!id) throw new Error('insert failed');
    // Seed 5 empty avatar slots.
    await client.query(
      `INSERT INTO avatar_slots (account_id, slot_index, recipe)
        SELECT $1, gs, NULL FROM generate_series(0, 4) AS gs`,
      [id],
    );
    await client.query('COMMIT');
    return id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updatePassword(accountId: string, newHash: string): Promise<void> {
  await pool.query(`UPDATE accounts SET password_hash = $1 WHERE id = $2`, [newHash, accountId]);
}

export async function recordLogin(
  accountId: string,
  ip: string | null,
  fingerprint: string | null,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE accounts SET last_login_at = NOW(), last_seen_ip = $2 WHERE id = $1`,
      [accountId, ip],
    );
    if (ip) {
      await client.query(
        `INSERT INTO account_ips (account_id, ip)
         VALUES ($1, $2)
         ON CONFLICT (account_id, ip) DO UPDATE SET last_seen = NOW()`,
        [accountId, ip],
      );
    }
    if (fingerprint) {
      await client.query(
        `INSERT INTO account_fingerprints (account_id, fingerprint)
         VALUES ($1, $2)
         ON CONFLICT (account_id, fingerprint) DO UPDATE SET last_seen = NOW()`,
        [accountId, fingerprint],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function loadAccount(accountId: string): Promise<AuthAccount | null> {
  const { rows: aRows } = await pool.query<AccountRow>(
    `SELECT id::text, username, role, level, xp, coins,
            selected_avatar_slot, settings, created_at, disabled
       FROM accounts WHERE id = $1`,
    [accountId],
  );
  const a = aRows[0];
  if (!a || a.disabled) return null;

  const [avatars, createdMaps, favoriteMaps, ownedCosmetics, friends] = await Promise.all([
    loadAvatarSlots(accountId),
    loadCreatedMaps(accountId),
    loadFavoriteMaps(accountId),
    loadOwnedCosmetics(accountId),
    loadFriends(accountId),
  ]);

  const settings = mergeSettings(a.settings);

  return {
    id: a.id,
    username: a.username,
    role: a.role,
    level: a.level,
    xp: a.xp,
    coins: a.coins,
    selectedAvatar: a.selected_avatar_slot,
    avatars,
    createdMaps,
    favoriteMaps,
    ownedCosmetics,
    friends,
    settings,
    createdAt: a.created_at.toISOString(),
  };
}

async function loadAvatarSlots(accountId: string): Promise<AvatarSlot[]> {
  const { rows } = await pool.query<{ slot_index: number; recipe: unknown }>(
    `SELECT slot_index, recipe FROM avatar_slots
      WHERE account_id = $1 ORDER BY slot_index ASC`,
    [accountId],
  );
  const map = new Map(rows.map((r) => [r.slot_index, r.recipe]));
  const slots: AvatarSlot[] = [];
  for (let i = 0; i < 5; i++) {
    const recipe = map.get(i) as AvatarSlot['recipe'] | undefined;
    slots.push({ slot: i, recipe: recipe ?? null });
  }
  return slots;
}

async function loadCreatedMaps(accountId: string): Promise<MapSummary[]> {
  const { rows } = await pool.query<{ id: string; name: string; created_at: Date }>(
    `SELECT id::text, name, created_at FROM maps
      WHERE author_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [accountId],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at.toISOString() }));
}

async function loadFavoriteMaps(accountId: string): Promise<MapSummary[]> {
  const { rows } = await pool.query<{ id: string; name: string; created_at: Date }>(
    `SELECT m.id::text, m.name, m.created_at
       FROM map_favorites f JOIN maps m ON m.id = f.map_id
      WHERE f.account_id = $1 ORDER BY f.created_at DESC LIMIT 200`,
    [accountId],
  );
  return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at.toISOString() }));
}

async function loadOwnedCosmetics(accountId: string): Promise<string[]> {
  const { rows } = await pool.query<{ cosmetic_id: string }>(
    `SELECT cosmetic_id FROM owned_cosmetics WHERE account_id = $1`,
    [accountId],
  );
  return rows.map((r) => r.cosmetic_id);
}

async function loadFriends(accountId: string): Promise<FriendSummary[]> {
  const { rows } = await pool.query<{ id: string; username: string; level: number }>(
    `SELECT a.id::text, a.username, a.level
       FROM friendships f
       JOIN accounts a ON a.id = CASE WHEN f.requester_id::text = $1 THEN f.addressee_id ELSE f.requester_id END
      WHERE (f.requester_id::text = $1 OR f.addressee_id::text = $1)
        AND f.status = 'accepted'`,
    [accountId],
  );
  return rows.map((r) => ({ id: r.id, username: r.username, level: r.level, online: false }));
}

function mergeSettings(raw: unknown): AccountSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS;
  const obj = raw as Partial<AccountSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...obj,
    keybinds: { ...DEFAULT_SETTINGS.keybinds, ...(obj.keybinds ?? {}) },
  };
}
