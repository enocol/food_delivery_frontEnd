-- Neon migration: make firebase_uid the canonical user key
-- Run this in Neon after reviewing table/constraint names in your schema.

BEGIN;

-- 1) Users table: firebase_uid as primary key (text)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT;

-- IMPORTANT:
-- Backfill firebase_uid for existing rows before enforcing NOT NULL/PK.
-- Example (only if your current user_id already stores Firebase UID text):
-- UPDATE users SET firebase_uid = user_id::text WHERE firebase_uid IS NULL;

-- Make firebase_uid required.
ALTER TABLE users
  ALTER COLUMN firebase_uid SET NOT NULL;

-- Keep old user_id for now during rollout; remove old PK and create new PK on firebase_uid.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_pkey'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_pkey;
  END IF;
END $$;

ALTER TABLE users
  ADD CONSTRAINT users_pkey PRIMARY KEY (firebase_uid);

-- Optional: once all dependent tables are migrated, drop old user_id.
-- ALTER TABLE users DROP COLUMN IF EXISTS user_id;

-- 2) Example dependent table migration pattern (repeat for each table)
-- Replace <table_name> and <fk_name> with your real names.
-- ALTER TABLE <table_name> ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
-- UPDATE <table_name> t
-- SET firebase_uid = u.firebase_uid
-- FROM users u
-- WHERE t.user_id = u.user_id
--   AND t.firebase_uid IS NULL;
-- ALTER TABLE <table_name> ALTER COLUMN firebase_uid SET NOT NULL;
-- ALTER TABLE <table_name> DROP CONSTRAINT IF EXISTS <fk_name>;
-- ALTER TABLE <table_name>
--   ADD CONSTRAINT <table_name>_firebase_uid_fkey
--   FOREIGN KEY (firebase_uid) REFERENCES users(firebase_uid)
--   ON UPDATE CASCADE ON DELETE RESTRICT;
-- -- Optional cleanup after all code paths switched:
-- -- ALTER TABLE <table_name> DROP COLUMN IF EXISTS user_id;

COMMIT;

-- Runtime contract for backend:
-- 1) Verify Firebase ID token on every authenticated request.
-- 2) Read uid from verified token.
-- 3) Upsert users(firebase_uid, email, ...) — see query below.
-- 4) Use firebase_uid for all user-scoped reads/writes.

-- ============================================================
-- Backend route: POST /api/users/sync
-- ============================================================
-- Triggered by the frontend after every successful Firebase
-- sign-in or sign-up. The backend verifies the ID token,
-- reads firebase_uid and email, then runs this upsert:
--
-- INSERT INTO users (firebase_uid, email, created_at, updated_at)
-- VALUES ($1, $2, now(), now())
-- ON CONFLICT (firebase_uid)
-- DO UPDATE SET
--   email      = EXCLUDED.email,
--   updated_at = now()
-- RETURNING *;
--
-- $1 = decodedToken.uid    (from Firebase Admin SDK verifyIdToken)
-- $2 = decodedToken.email
--
-- This ensures:
--   - New Firebase users are inserted into Neon on first login.
--   - Returning users update their email (e.g. if it changes).
--   - No duplicate rows (ON CONFLICT handles idempotency).
-- ============================================================
