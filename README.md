# PROMPT & PATCH — BHASWARA 2026

A production event management platform for the **Department of CSE** tech fest.  
3 rounds, team registration with payments, real-time leaderboard, role-based admin panel, anti-cheat, and CSV exports.

---

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React 18 + Vite 5 + TailwindCSS |
| Backend | Node.js + Express 4 |
| Database | Supabase PostgreSQL + Realtime |
| Storage | Supabase Storage (images, QR) |
| Auth | JWT + single-session enforcement |

---

## Rounds

| Round | Name | Max | Scoring |
|-------|------|-----|---------|
| 1 | PROMPTVERSE | 40 | Easy (15) + Hard (25), scored by volunteers |
| 2 | SECRET SCRIBBLE | ~60 | Drawing team +5, first guesser +2 (Skribbl.io) |
| 3 | OOP's WHAT'S WRONG | 70 | 70 − ⌊seconds/30⌋ − hint penalties |

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → paste and run `backend/schema.sql`
3. Go to Storage → create two **public** buckets: `payment-qr` and `round1-submissions`
4. Copy your **URL**, **anon key**, and **service role key** from Settings → API

### 2. Backend

```bash
cd backend
cp .env.example .env    # Fill in your Supabase credentials
npm install
npm run dev             # Starts on :3001
```

On first start, the default admin account is auto-created:
- **Username:** `ADMIN` (configurable via `ADMIN_TEAM_NAME`)
- **Password:** `admin2026` (configurable via `ADMIN_PASSWORD`)

### 3. Frontend

```bash
cd frontend
cp .env.example .env    # Fill in Supabase URL + anon key + API URL
npm install
npm run dev             # Starts on :5173
```

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full control: teams, rounds, scoring, users, dashboard, exports |
| **Volunteer** | View teams, score rounds, export data |
| **Team** | Dashboard, round participation, leaderboard |

The permanent admin account **cannot be deleted**. It can create additional admin/volunteer accounts.

---

## Event Day Flow

1. Admin uploads payment QR and mobile number in Settings
2. Teams register → Admin approves in Teams tab
3. Admin sets Dashboard to Round 1 → Unlocks round → Sets timer
4. Teams upload images → Volunteers score them
5. Admin switches to Break/Lunch as needed
6. Admin sets Dashboard to Round 2 → Volunteers score Skribbl entries live
7. Admin sets Dashboard to Round 3 → Unlocks round
8. Teams start self-paced puzzle challenge (time-based scoring, anti-cheat)
9. Admin exports all data as CSV

---

## Anti-Cheat (Round 3)

- Page refresh → disqualification (detected via `performance.navigation`)
- Tab switch × 3 → disqualification (tracked via `visibilitychange`)
- `beforeunload` warning on exit attempt
- One-time start (cannot restart without admin reopen)
- Admin can reopen a team's session if needed

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Team registration |
| POST | `/api/auth/login` | — | Login (all roles) |
| POST | `/api/auth/logout` | ✓ | Logout |
| POST | `/api/auth/create-user` | Admin | Create admin/volunteer |
| DELETE | `/api/auth/users/:id` | Admin | Delete non-permanent user |

### Teams
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/teams` | Staff | List teams |
| GET | `/api/teams/:id` | Staff | Team details |
| PATCH | `/api/teams/:id/status` | Staff | Approve/reject |

### Rounds
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/round1/upload` | Team | Upload image |
| GET | `/api/round1/submissions` | Auth | Teams: own submissions, Staff: all/filter |
| POST | `/api/round1/score` | Staff | Score submission |
| POST | `/api/round2/score` | Staff | Add R2 score entry |
| GET | `/api/round2/scores` | Staff | View R2 scores |
| DELETE | `/api/round2/scores/:id` | Staff | Delete R2 entry |
| POST | `/api/round3/start` | Team | Start R3 session |
| POST | `/api/round3/complete-task` | Team | Complete task |
| POST | `/api/round3/hint` | Team | Get hint |
| POST | `/api/round3/submit` | Team | Submit R3 |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/PATCH | `/api/admin/dashboard` | Admin | Dashboard config |
| GET/PATCH | `/api/admin/rounds/:id` | Admin | Round config |
| GET/PATCH | `/api/admin/payment` | Admin | Payment config |
| POST | `/api/admin/payment/qr` | Admin | Upload QR image |
| GET | `/api/admin/leaderboard` | — | Leaderboard (public) |
| GET | `/api/admin/staff` | Admin | List staff |
| GET | `/api/admin/export/:type` | Staff | CSV export |

---

## Puzzle Reference (Judges Only)

### Round 3 Walkthrough

1. Click **"Start Round 3"** from the dashboard
2. **Task 1:** Find the hidden clickable text among trap buttons (tiny text at page bottom)
3. **Task 2:** Decode Caesar cipher `"Uifsf jt b tfdsfu dpef"` → `there is a secret code` (shift 1)
4. **Task 3:** Fill the form, use Tab for college field (invisible overlay blocks mouse), click the tiny "submit" button (not the flashy fake one)

### Scoring Formula
```
final_score = max(0, 70 - floor(seconds / 30) - hint_penalty)
```

Hint costs per task: −2, −3, −5 (progressive)
