CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  guest_id TEXT UNIQUE,
  nickname TEXT NOT NULL,
  binding_state TEXT NOT NULL,
  provider TEXT,
  provider_uid_hash TEXT UNIQUE,
  deletion_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  platform TEXT NOT NULL,
  app_version TEXT,
  revoked_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  device_id TEXT NOT NULL REFERENCES devices(device_id),
  refresh_token_hash TEXT NOT NULL UNIQUE,
  access_expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_device
  ON sessions(device_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS cloud_saves (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id),
  version INTEGER NOT NULL DEFAULT 1,
  max_unlocked_level INTEGER NOT NULL DEFAULT 1,
  per_level_stars JSONB NOT NULL DEFAULT '{}'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id),
  balances JSONB NOT NULL,
  ledger_cursor BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  ledger_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  idempotency_key TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  deltas JSONB NOT NULL,
  balance_after JSONB NOT NULL,
  audit_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sku_catalog (
  sku_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  price_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL,
  contents JSONB NOT NULL,
  limit_rule JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  order_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  sku_id TEXT NOT NULL REFERENCES sku_catalog(sku_id),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_transaction_id TEXT UNIQUE,
  status TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  fulfillment_ledger_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_show_tokens (
  token_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  placement_id TEXT NOT NULL,
  reward_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_ad_token_consumption
  ON ad_show_tokens(token_id)
  WHERE consumed_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS reward_claims (
  claim_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  reward_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  ledger_id TEXT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_id)
);

CREATE TABLE IF NOT EXISTS event_progress (
  user_id TEXT NOT NULL REFERENCES users(user_id),
  event_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, event_id, task_id)
);

CREATE TABLE IF NOT EXISTS popup_records (
  user_id TEXT NOT NULL REFERENCES users(user_id),
  popup_id TEXT NOT NULL,
  server_day DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  suppressed_today BOOLEAN NOT NULL DEFAULT false,
  last_shown_at TIMESTAMPTZ,
  PRIMARY KEY(user_id, popup_id, server_day)
);

CREATE TABLE IF NOT EXISTS remote_configs (
  version TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id TEXT PRIMARY KEY,
  user_id TEXT,
  device_id TEXT,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_id TEXT PRIMARY KEY,
  user_id TEXT,
  device_id TEXT,
  request_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consents (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id),
  age_status TEXT NOT NULL DEFAULT 'unknown',
  analytics_allowed BOOLEAN NOT NULL DEFAULT false,
  personalized_ads_allowed BOOLEAN NOT NULL DEFAULT false,
  payments_allowed BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_signals (
  signal_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
