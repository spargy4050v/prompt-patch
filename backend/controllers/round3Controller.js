import { supabase } from '../lib/supabase.js'
import { refreshLeaderboard } from '../lib/leaderboard.js'

// ── Puzzle answer (Caesar cipher, shift 1) ──
// Encrypted: "Uifsf jt b tfdsfu dpef"
// Answer:    "there is a secret code"
const CIPHER_ANSWER = 'there is a secret code'

// ── Hints with costs ──
const HINTS = {
  1: [
    { text: 'Not every button leads where you think.', cost: 2 },
    { text: 'Look at the very bottom of the page carefully.', cost: 3 },
    { text: 'Text that blends with the background might be clickable.', cost: 5 }
  ],
  2: [
    { text: 'Each letter has been shifted forward in the alphabet.', cost: 2 },
    { text: 'The shift is exactly 1 position. A→B, B→C, etc.', cost: 3 },
    { text: 'The first word decodes to "There".', cost: 5 }
  ],
  3: [
    { text: 'The most obvious button is not always the right one.', cost: 2 },
    { text: 'Look for a less prominent submit option below.', cost: 3 },
    { text: 'The smaller plain button at the bottom actually works.', cost: 5 }
  ]
}

// ── Scoring: 70 base, -1 per 30 seconds, -hint costs ──
function calcScore(startedAt, completedAt, hintPenalty) {
  const secs = Math.floor((new Date(completedAt) - new Date(startedAt)) / 1000)
  const timePenalty = Math.floor(secs / 30)
  return Math.max(0, 70 - timePenalty - hintPenalty)
}

// POST /api/round3/start
export async function startRound(req, res) {
  const { data: rc } = await supabase.from('rounds_config').select('*').eq('id', 3).single()
  if (!rc?.is_unlocked) return res.status(403).json({ error: 'Round 3 is locked' })

  // Check if already started
  const { data: existing } = await supabase.from('round3_sessions')
    .select('*').eq('team_id', req.user.id).single()

  if (existing) {
    if (existing.completed_at) return res.json({ completed: true, score: existing.final_score })
    return res.json({ success: true, session: existing, resumed: true })
  }

  const { data: session } = await supabase.from('round3_sessions')
    .insert({ team_id: req.user.id, is_disqualified: false, disqualify_reason: null, tab_switches: 0 }).select().single()

  return res.json({ success: true, session })
}

// POST /api/round3/complete-task — Mark a task as done
export async function completeTask(req, res) {
  const { task, answer } = req.body
  const taskNum = parseInt(task)

  const { data: session } = await supabase.from('round3_sessions')
    .select('*').eq('team_id', req.user.id).single()
  if (!session) return res.status(400).json({ error: 'No active session' })

  // Enforce sequential order
  if (taskNum === 2 && !session.task1_completed) return res.status(400).json({ error: 'Complete Task 1 first' })
  if (taskNum === 3 && !session.task2_completed) return res.status(400).json({ error: 'Complete Task 2 first' })

  // Task 2: verify cipher answer
  if (taskNum === 2) {
    if (answer?.trim().toLowerCase() !== CIPHER_ANSWER) {
      return res.json({ success: false, message: 'Incorrect answer. Try again.' })
    }
  }

  const updateField = `task${taskNum}_completed`
  await supabase.from('round3_sessions')
    .update({ [updateField]: true }).eq('team_id', req.user.id)

  return res.json({ success: true, message: `Task ${taskNum} completed` })
}

// POST /api/round3/hint
export async function getHint(req, res) {
  const taskNum = parseInt(req.body.task)
  const taskHints = HINTS[taskNum]
  if (!taskHints) return res.status(400).json({ error: 'Invalid task' })

  const { data: session } = await supabase.from('round3_sessions')
    .select('*').eq('team_id', req.user.id).single()
  if (!session) return res.status(400).json({ error: 'No active session' })

  const used = session.hints_used[String(taskNum)] || 0
  if (used >= taskHints.length) return res.json({ success: false, message: 'No more hints' })

  const hint = taskHints[used]
  const updatedHints = { ...session.hints_used, [String(taskNum)]: used + 1 }

  await supabase.from('round3_sessions')
    .update({ hints_used: updatedHints }).eq('team_id', req.user.id)

  return res.json({
    success: true, hint: hint.text, cost: hint.cost,
    hintNumber: used + 1, hintsRemaining: taskHints.length - used - 1
  })
}

// POST /api/round3/submit — Final Task 3 submission
export async function submitFinal(req, res) {
  await new Promise(r => setTimeout(r, 2000)) // Artificial delay

  const { data: session } = await supabase.from('round3_sessions')
    .select('*').eq('team_id', req.user.id).single()
  if (!session) return res.status(400).json({ error: 'No session' })
  if (!session.task1_completed || !session.task2_completed) {
    return res.status(400).json({ error: 'Complete all tasks first' })
  }

  const now = new Date().toISOString()
  const hintPenalty = Object.entries(session.hints_used).reduce((total, [task, count]) => {
    const costs = HINTS[parseInt(task)]
    return total + (costs || []).slice(0, count).reduce((s, h) => s + h.cost, 0)
  }, 0)

  const finalScore = calcScore(session.started_at, now, hintPenalty)

  await supabase.from('round3_sessions').update({
    task3_completed: true, completed_at: now,
    raw_score: 70 - Math.floor((new Date(now) - new Date(session.started_at)) / 30000),
    hint_penalty: hintPenalty, final_score: finalScore
  }).eq('team_id', req.user.id)

  await refreshLeaderboard(req.user.id)

  return res.json({
    success: true, score: finalScore, final_score: finalScore, hintPenalty,
    completionTime: Math.floor((new Date(now) - new Date(session.started_at)) / 1000),
    message: 'Congratulations! You solved the challenge.'
  })
}

// POST /api/round3/disqualify — disabled (kept for backward compatibility)
export async function disqualify(req, res) {
  return res.json({ success: true, disabled: true })
}

// POST /api/round3/reopen/:teamId — Admin reopens round for a team
export async function reopenForTeam(req, res) {
  await supabase.from('round3_sessions').delete().eq('team_id', req.params.teamId)
  return res.json({ success: true, message: 'Round 3 reopened for team' })
}

// GET /api/round3/sessions — Admin views all sessions
export async function getSessions(req, res) {
  const { data } = await supabase.from('round3_sessions')
    .select('*, teams!inner(team_name)')
    .order('started_at', { ascending: false })
  const sessions = (data || []).map(s => ({
    ...s,
    team_name: s.teams?.team_name || null
  }))
  return res.json({ sessions })
}

// GET /api/round3/session — Team gets own session state
export async function getSession(req, res) {
  const { data } = await supabase.from('round3_sessions')
    .select('*').eq('team_id', req.user.id).single()
  return res.json({ session: data || null })
}

// POST /api/round3/tab-switch — disabled (kept for backward compatibility)
export async function trackTabSwitch(req, res) {
  return res.json({ success: true, disabled: true, tabSwitches: 0, warning: false })
}
