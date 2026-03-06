import { supabase } from '../lib/supabase.js'
import { refreshLeaderboard } from '../lib/leaderboard.js'

// GET /api/round2/info — return sub-round info (total, completed, host draws used)
export async function getInfo(req, res) {
  // Count approved teams
  const { count: teamCount } = await supabase.from('teams')
    .select('id', { count: 'exact', head: true }).eq('role', 'team').eq('status', 'approved')
  const totalSubRounds = 2 * (teamCount || 0) + 2

  // Count existing entries + host draws
  const { data: entries } = await supabase.from('round2_scores')
    .select('id, drawing_team_id').order('round_number')
  const completedSubRounds = entries?.length || 0
  const hostDrawsUsed = (entries || []).filter(e => !e.drawing_team_id).length

  return res.json({ totalSubRounds, completedSubRounds, hostDrawsUsed, maxHostDraws: 2 })
}

// POST /api/round2/score — Add a Skribbl sub-round score entry
// Body: { sub_round, drawing_team_id?, guessing_team_id?, word_guessed }
// Outcomes:
//   1. No win (word not guessed, no drawing team) → 0 pts all
//   2. Host draws, a team guesses → guesser +2, host gets nothing (max 2 host draws)
//   3. Nobody guesses → 0 pts for all
//   4. Team draws, a team guesses → drawer +5, guesser +2
export async function addScore(req, res) {
  const subRound = req.body.sub_round || req.body.round_number || req.body.roundNumber
  const drawingTeamId = req.body.drawing_team_id || req.body.drawingTeamId || null
  const guessingTeamId = req.body.guessing_team_id || req.body.guessingTeamId || null
  const wordGuessed = req.body.word_guessed ?? req.body.drawing_correct ?? req.body.drawingCorrect ?? false

  if (!subRound) return res.status(400).json({ error: 'sub_round required' })

  // Validate host-draw limit (max 2)
  if (!drawingTeamId) {
    const { count } = await supabase.from('round2_scores')
      .select('id', { count: 'exact', head: true }).is('drawing_team_id', null)
    if ((count || 0) >= 2) return res.status(400).json({ error: 'Host can only draw in 2 sub-rounds' })
  }

  // Calculate points per the 4 outcomes
  const drawingPts = wordGuessed && drawingTeamId ? 5 : 0
  const guessingPts = wordGuessed && guessingTeamId ? 2 : 0

  const { data, error } = await supabase.from('round2_scores').insert({
    round_number: subRound,
    drawing_team_id: drawingTeamId || null,
    guessing_team_id: guessingTeamId || null,
    drawing_points: drawingPts,
    guessing_points: guessingPts,
    scored_by: req.user.id
  }).select().single()

  if (error) return res.status(500).json({ error: 'Failed to add score' })

  // Refresh leaderboard for affected teams
  if (drawingTeamId) await refreshLeaderboard(drawingTeamId)
  if (guessingTeamId) await refreshLeaderboard(guessingTeamId)

  return res.json({ success: true, entry: data })
}

// GET /api/round2/scores
export async function getScores(req, res) {
  const { data } = await supabase.from('round2_scores')
    .select('*, drawing_team:teams!round2_scores_drawing_team_id_fkey(team_name), guessing_team:teams!round2_scores_guessing_team_id_fkey(team_name)')
    .order('created_at', { ascending: false })
  return res.json({ scores: data || [] })
}

// DELETE /api/round2/score/:id — Admin deletes an entry
export async function deleteScore(req, res) {
  const { data: entry } = await supabase.from('round2_scores')
    .select('drawing_team_id, guessing_team_id').eq('id', req.params.id).single()
  if (!entry) return res.status(404).json({ error: 'Not found' })

  await supabase.from('round2_scores').delete().eq('id', req.params.id)

  if (entry.drawing_team_id) await refreshLeaderboard(entry.drawing_team_id)
  if (entry.guessing_team_id) await refreshLeaderboard(entry.guessing_team_id)

  return res.json({ success: true })
}
