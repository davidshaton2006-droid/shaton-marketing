-- Shaton Prime · AI-Mentor: Cloudflare D1 schema (SQLite). Apply once:
--   wrangler d1 execute shaton-mentor --remote --file=mentor.sql

-- Users of the mentor: free-question counter, subscription, daily fair-use counter.
CREATE TABLE IF NOT EXISTS mentor_users (
  uid          TEXT PRIMARY KEY,                 -- 'tg' || Telegram user id (verified from initData)
  name         TEXT NOT NULL DEFAULT '',
  username     TEXT NOT NULL DEFAULT '',
  free_left    INTEGER NOT NULL DEFAULT 3,       -- welcome questions
  plan         TEXT NOT NULL DEFAULT 'free',     -- free | pro | max
  expires_at   INTEGER NOT NULL DEFAULT 0,       -- unix ms; subscription is active while expires_at > now
  day          TEXT NOT NULL DEFAULT '',         -- YYYY-MM-DD of day_count
  day_count    INTEGER NOT NULL DEFAULT 0,       -- questions today (fair-use limit)
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

-- Dialog memory: the last 6-8 messages are fed to the model; older rows are pruned.
CREATE TABLE IF NOT EXISTS mentor_messages (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  uid      TEXT NOT NULL,
  role     TEXT NOT NULL,                        -- user | assistant
  content  TEXT NOT NULL,
  ts       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mentor_messages_uid ON mentor_messages (uid, id);

-- Payment intents. Payments are confirmed by the owner for now (admin panel); a payment provider can write status='paid' later.
CREATE TABLE IF NOT EXISTS mentor_orders (
  id          TEXT PRIMARY KEY,                  -- ord_xxxxxxxx
  uid         TEXT NOT NULL,
  plan_key    TEXT NOT NULL,                     -- pro_month | pro_year | max_month | max_year
  amount      INTEGER NOT NULL,                  -- RUB
  status      TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | cancelled
  created_at  INTEGER NOT NULL,
  paid_at     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_mentor_orders_uid ON mentor_orders (uid, created_at);

-- Knowledge base: one row per chunk (500-800 characters, overlapped), full-text indexed (FTS5, BM25 ranking).
-- access: 'free' (open guides and the public first chapter of paid ones) | 'pro' (full text of paid guides: used only for PRO/MAX answers)
CREATE TABLE IF NOT EXISTS kb_docs (
  doc        TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  access     TEXT NOT NULL DEFAULT 'free',
  chunks     INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
CREATE VIRTUAL TABLE IF NOT EXISTS kb_fts USING fts5(
  text, title,
  doc UNINDEXED, access UNINDEXED, pos UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);
