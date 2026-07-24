-- Run once, as the rykochet user:
--   sudo -u postgres psql -d rykochet -f deploy/postgres/init.sql
-- Idempotent: safe to re-run.
-- Roles are enforced in application code; DB just stores the string.

CREATE TABLE IF NOT EXISTS accounts (
  id                   BIGSERIAL PRIMARY KEY,
  username             TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  security_question    TEXT NOT NULL,
  security_answer_hash TEXT NOT NULL,
  role                 TEXT NOT NULL DEFAULT 'player'
                       CHECK (role IN ('player','moderator','admin','community_manager','developer')),
  disabled             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at        TIMESTAMPTZ,
  last_seen_ip         INET,
  level                INT NOT NULL DEFAULT 1,
  xp                   INT NOT NULL DEFAULT 0,
  coins                INT NOT NULL DEFAULT 0,
  selected_avatar_slot INT NOT NULL DEFAULT 0 CHECK (selected_avatar_slot BETWEEN 0 AND 4),
  settings             JSONB NOT NULL DEFAULT '{}'::JSONB
);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS level                INT NOT NULL DEFAULT 1;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS xp                   INT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS coins                INT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS selected_avatar_slot INT NOT NULL DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS settings             JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE TABLE IF NOT EXISTS account_fingerprints (
  id          BIGSERIAL PRIMARY KEY,
  account_id  BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_fp_value ON account_fingerprints (fingerprint);

CREATE TABLE IF NOT EXISTS account_ips (
  id         BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ip         INET NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, ip)
);
CREATE INDEX IF NOT EXISTS idx_ip_value ON account_ips (ip);

CREATE TABLE IF NOT EXISTS sessions (
  token        TEXT PRIMARY KEY,
  account_id   BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  fingerprint  TEXT,
  ip           INET,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions (account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at) WHERE NOT revoked;

CREATE TABLE IF NOT EXISTS bans (
  id         BIGSERIAL PRIMARY KEY,
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  issued_by  BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  lifted_at  TIMESTAMPTZ,
  lifted_by  BIGINT REFERENCES accounts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_bans_account ON bans (account_id);

CREATE TABLE IF NOT EXISTS maps (
  id              BIGSERIAL PRIMARY KEY,
  author_id       BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  data            JSONB NOT NULL,
  disabled        BOOLEAN NOT NULL DEFAULT FALSE,
  disabled_by     BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  disabled_reason TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maps_disabled ON maps (disabled);
CREATE INDEX IF NOT EXISTS idx_maps_author   ON maps (author_id);

CREATE TABLE IF NOT EXISTS map_favorites (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  map_id     BIGINT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, map_id)
);
CREATE INDEX IF NOT EXISTS idx_favmaps_map ON map_favorites (map_id);

CREATE TABLE IF NOT EXISTS owned_cosmetics (
  account_id  BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, cosmetic_id)
);

CREATE TABLE IF NOT EXISTS avatar_slots (
  account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  slot_index INT NOT NULL CHECK (slot_index BETWEEN 0 AND 4),
  name       TEXT NOT NULL DEFAULT 'Avatar',
  recipe     JSONB NOT NULL DEFAULT '{"baseColor":"#19E68C","layers":[],"equipment":{"trail":null,"bulletTrail":null,"deathAnimation":null,"spawnEffect":null}}'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, slot_index)
);
ALTER TABLE avatar_slots ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Avatar';

CREATE TABLE IF NOT EXISTS friendships (
  id           BIGSERIAL PRIMARY KEY,
  requester_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  addressee_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status       TEXT NOT NULL CHECK (status IN ('pending','accepted','blocked')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships (addressee_id);

CREATE TABLE IF NOT EXISTS staff_actions (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   BIGINT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_actions_actor  ON staff_actions (actor_id);
CREATE INDEX IF NOT EXISTS idx_staff_actions_target ON staff_actions (target_type, target_id);

CREATE TABLE IF NOT EXISTS recordings (
  id          BIGSERIAL PRIMARY KEY,
  map_id      BIGINT REFERENCES maps(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data        JSONB NOT NULL,
  favorites   INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings (recorded_at);

-- Grant the app role access to everything in the public schema.
-- Required because init.sql is normally run as the `postgres` superuser,
-- which would otherwise own the tables and lock the `rykochet` app role out.
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO rykochet;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rykochet;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO rykochet;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rykochet;
