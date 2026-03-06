-- ═══════════════════════════════════════════════
-- PROMPT & PATCH — Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TEAMS (includes admins, volunteers, participants) ──
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team' CHECK (role IN ('team', 'admin', 'volunteer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  transaction_id TEXT,
  session_token TEXT,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── MEMBERS (2-3 per team) ──
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  branch TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT NOT NULL
);

-- ── ROUNDS CONFIG ──
CREATE TABLE rounds_config (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  is_unlocked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  timer_end TIMESTAMPTZ,
  max_score INTEGER NOT NULL,
  is_score_visible BOOLEAN DEFAULT true
);

-- ── DASHBOARD CONFIG (single row) ──
CREATE TABLE dashboard_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  active_view TEXT DEFAULT 'idle' CHECK (active_view IN ('round1', 'round2', 'round3', 'break', 'lunch', 'idle')),
  break_message TEXT DEFAULT '',
  break_end_time TIMESTAMPTZ,
  next_event_message TEXT DEFAULT '',
  leaderboard_frozen BOOLEAN DEFAULT false
);

-- ── PAYMENT CONFIG (single row) ──
CREATE TABLE payment_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  qr_image_url TEXT,
  mobile_number TEXT
);

-- ── ROUND 1 SUBMISSIONS (PROMPTVERSE) ──
CREATE TABLE round1_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'hard')),
  image_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT false,
  score INTEGER,
  scored_by UUID REFERENCES teams(id),
  scored_at TIMESTAMPTZ
);

-- ── ROUND 2 SCORES (SECRET SCRIBBLE) ──
CREATE TABLE round2_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  drawing_team_id UUID REFERENCES teams(id),
  guessing_team_id UUID REFERENCES teams(id),
  drawing_points INTEGER DEFAULT 0,
  guessing_points INTEGER DEFAULT 0,
  scored_by UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROUND 3 SESSIONS (OOP's WHAT'S WRONG) ──
CREATE TABLE round3_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  task1_completed BOOLEAN DEFAULT false,
  task2_completed BOOLEAN DEFAULT false,
  task3_completed BOOLEAN DEFAULT false,
  hints_used JSONB DEFAULT '{"1": 0, "2": 0, "3": 0}',
  is_disqualified BOOLEAN DEFAULT false,
  disqualify_reason TEXT,
  raw_score INTEGER,
  hint_penalty INTEGER DEFAULT 0,
  final_score INTEGER,
  tab_switches INTEGER DEFAULT 0
);

-- ── LEADERBOARD CACHE (realtime subscriptions) ──
CREATE TABLE leaderboard (
  team_id UUID PRIMARY KEY REFERENCES teams(id),
  team_name TEXT NOT NULL,
  round1_score INTEGER DEFAULT 0,
  round2_score INTEGER DEFAULT 0,
  round3_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED DATA ──
INSERT INTO rounds_config (id, name, max_score) VALUES
  (1, 'PROMPTVERSE', 40),
  (2, 'SECRET SCRIBBLE', 60),
  (3, 'OOPs WHATS WRONG', 70);

INSERT INTO dashboard_config (id) VALUES (1);
INSERT INTO payment_config (id) VALUES (1);

-- ── ENABLE RLS ──
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE round1_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE round2_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE round3_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Public read policies (for frontend Supabase Realtime via anon key)
CREATE POLICY "Public read leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public read dashboard_config" ON dashboard_config FOR SELECT USING (true);
CREATE POLICY "Public read rounds_config" ON rounds_config FOR SELECT USING (true);
CREATE POLICY "Public read payment_config" ON payment_config FOR SELECT USING (true);

-- ── ENABLE REALTIME ──
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_config;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds_config;

-- ══════════════════════════════════════════════════════════
-- AFTER RUNNING THIS SQL:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create bucket: "payment-qr" (set to Public)
-- 3. Create bucket: "round1-submissions" (set to Public)
-- ══════════════════════════════════════════════════════════
