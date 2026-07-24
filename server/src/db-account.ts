import type {
  AccountSettings,
  AuthAccount,
  AvatarRecipe,
  AvatarSlot,
  FriendSummary,
  MapSummary,
  OwnedCosmetic,
  Role,
} from '@rykochet/shared';
import { DEFAULT_SETTINGS, defaultRecipe, defaultSlotName } from '@rykochet/shared';

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
    // Seed 5 avatar slots, each with default name + default (circular) recipe.
    const recipeJson = JSON.stringify(defaultRecipe());
    for (let i = 0; i < 5; i++) {
      await client.query(
        `INSERT INTO avatar_slots (account_id, slot_index, name, recipe)
         VALUES ($1, $2, $3, $4::jsonb)`,
        [id, i, defaultSlotName(i), recipeJson],
      );
    }
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
        `INSERT INTO account_ips (account_id, ip) VALUES ($1, $2)
         ON CONFLICT (account_id, ip) DO UPDATE SET last_seen = NOW()`,
        [accountId, ip],
      );
    }
    if (fingerprint) {
      await client.query(
        `INSERT INTO account_fingerprints (account_id, fingerprint) VALUES ($1, $2)
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
    loadAvatarSlots(accountId, a.selected_avatar_slot),
    loadCreatedMaps(accountId),
    loadFavoriteMaps(accountId),
    loadOwnedCosmetics(accountId),
    loadFriends(accountId),
  ]);

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
    settings: mergeSettings(a.settings),
    createdAt: a.created_at.toISOString(),
  };
}

async function loadAvatarSlots(accountId: string, selectedIndex: number): Promise<AvatarSlot[]> {
  const { rows } = await pool.query<{ slot_index: number; name: string; recipe: unknown }>(
    `SELECT slot_index, name, recipe FROM avatar_slots
      WHERE account_id = $1 ORDER BY slot_index ASC`,
    [accountId],
  );
  const map = new Map(rows.map((r) => [r.slot_index, r]));
  const slots: AvatarSlot[] = [];
  for (let i = 0; i < 5; i++) {
    const row = map.get(i);
    const recipe = (row?.recipe ?? defaultRecipe()) as AvatarRecipe;
    slots.push({
      slot: i,
      name: row?.name ?? `Avatar ${String(i + 1)}`,
      selected: i === selectedIndex,
      recipe,
    });
  }
  return slots;
}

export async function saveAvatarSlot(
  accountId: string,
  slotIndex: number,
  recipe: AvatarRecipe,
  name: string | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO avatar_slots (account_id, slot_index, name, recipe, updated_at)
     VALUES ($1, $2, COALESCE($3, 'Avatar ' || ($2 + 1)::text), $4::jsonb, NOW())
     ON CONFLICT (account_id, slot_index)
     DO UPDATE SET recipe = EXCLUDED.recipe,
                   name = COALESCE($3, avatar_slots.name),
                   updated_at = NOW()`,
    [accountId, slotIndex, name, JSON.stringify(recipe)],
  );
}

export async function selectAvatarSlot(accountId: string, slotIndex: number): Promise<void> {
  await pool.query(
    `UPDATE accounts SET selected_avatar_slot = $2 WHERE id = $1`,
    [accountId, slotIndex],
  );
}

export async function loadPublicActiveAvatar(
  accountId: string,
): Promise<{ username: string; recipe: AvatarRecipe } | null> {
  const { rows } = await pool.query<{ username: string; recipe: unknown }>(
    `SELECT a.username, s.recipe
       FROM accounts a
       JOIN avatar_slots s ON s.account_id = a.id AND s.slot_index = a.selected_avatar_slot
      WHERE a.id = $1 AND NOT a.disabled`,
    [accountId],
  );
  const row = rows[0];
  if (!row) return null;
  return { username: row.username, recipe: (row.recipe as AvatarRecipe) ?? defaultRecipe() };
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

async function loadOwnedCosmetics(accountId: string): Promise<OwnedCosmetic[]> {
  const { rows } = await pool.query<{ cosmetic_id: string; acquired_at: Date }>(
    `SELECT cosmetic_id, acquired_at FROM owned_cosmetics WHERE account_id = $1`,
    [accountId],
  );
  return rows.map((r) => ({
    id: r.cosmetic_id,
    category: inferCategory(r.cosmetic_id),
    name: humanizeCosmeticId(r.cosmetic_id),
    acquiredAt: r.acquired_at.toISOString(),
  }));
}

function inferCategory(id: string): OwnedCosmetic['category'] {
  if (id.startsWith('trail_')) return 'trail';
  if (id.startsWith('bt_')) return 'bulletTrail';
  if (id.startsWith('death_')) return 'deathAnimation';
  if (id.startsWith('spawn_')) return 'spawnEffect';
  return 'trail';
}

function humanizeCosmeticId(id: string): string {
  const parts = id.split('_').slice(1);
  return parts
    .map((p) => (p.length > 0 ? p[0]!.toUpperCase() + p.slice(1) : p))
    .join(' ');
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
