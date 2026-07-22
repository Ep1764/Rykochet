-- Run once, as the rykochet user:
--   sudo -u postgres psql -d rykochet -f deploy/postgres/init.sql
-- Roles are enforced in application code; DB just stores the string.

CREATE TABLE IF NOT EXISTS accounts (
  id                BIGSERIAL PRIMARY KEY,
  username          TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  security_question TEXT NOT NULL,
  security_answer_hash TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'player'
                    CHECK (role IN ('player','moderator','admin','community_manager','developer')),
  disabled          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ,
  last_seen_ip      INET
);

CREATE TABLE IF NOT EXISTS account_fingerprints (
  id           BIGSERIAL PRIMARY KEY,
  account_id   BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  fingerprint  TEXT NOT NULL,
  first_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  token          TEXT PRIMARY KEY,
  account_id     BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  fingerprint    TEXT,
  ip             INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  revoked        BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions (account_id);

CREATE TABLE IF NOT EXISTS bans (
  id             BIGSERIAL PRIMARY KEY,
  account_id     BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  issued_by      BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  reason         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ,
  lifted_at      TIMESTAMPTZ,
  lifted_by      BIGINT REFERENCES accounts(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_bans_account ON bans (account_id);

CREATE TABLE IF NOT EXISTS maps (
  id           BIGSERIAL PRIMARY KEY,
  author_id    BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  data         JSONB NOT NULL,
  disabled     BOOLEAN NOT NULL DEFAULT FALSE,
  disabled_by  BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  disabled_reason TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maps_disabled ON maps (disabled);

-- Moderator audit log: who did what, to whom, when.
CREATE TABLE IF NOT EXISTS staff_actions (
  id           BIGSERIAL PRIMARY KEY,
  actor_id     BIGINT REFERENCES accounts(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,        -- 'ban','unban','kick','disable_map','enable_map','disable_account',...
  target_type  TEXT NOT NULL,        -- 'account' | 'map'
  target_id    BIGINT,
  details      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_staff_actions_actor  ON staff_actions (actor_id);
CREATE INDEX IF NOT EXISTS idx_staff_actions_target ON staff_actions (target_type, target_id);

-- Daily-rotating recording pool (JSON event streams, not video).
CREATE TABLE IF NOT EXISTS recordings (
  id          BIGSERIAL PRIMARY KEY,
  map_id      BIGINT REFERENCES maps(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data        JSONB NOT NULL,
  favorites   INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recordings_recorded_at ON recordings (recorded_at);
