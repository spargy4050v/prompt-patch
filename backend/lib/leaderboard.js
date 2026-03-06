import { supabase } from './supabase.js'

// Recalculates and updates the leaderboard row for a given team.
// Called after any score change in Round 1, 2, or 3.
export async function refreshLeaderboard(teamId) {
  // Round 1: sum scores of final submissions
  const { data: r1 } = await supabase
    .from('round1_submissions')
    .select('score')
    .eq('team_id', teamId)
    .eq('is_final', true)
    .not('score', 'is', null)
  const r1Score = (r1 || []).reduce((s, r) => s + (r.score || 0), 0)

  // Round 2: sum drawing + guessing points
  const { data: r2d } = await supabase
    .from('round2_scores')
    .select('drawing_points')
    .eq('drawing_team_id', teamId)
  const { data: r2g } = await supabase
    .from('round2_scores')
    .select('guessing_points')
    .eq('guessing_team_id', teamId)
  const r2Score = (r2d || []).reduce((s, r) => s + (r.drawing_points || 0), 0)
    + (r2g || []).reduce((s, r) => s + (r.guessing_points || 0), 0)

  // Round 3: final_score from session
  const { data: r3 } = await supabase
    .from('round3_sessions')
    .select('final_score')
    .eq('team_id', teamId)
    .single()
  const r3Score = r3?.final_score || 0

  await supabase
    .from('leaderboard')
    .update({
      round1_score: r1Score,
      round2_score: r2Score,
      round3_score: r3Score,
      total_score: r1Score + r2Score + r3Score,
      updated_at: new Date().toISOString()
    })
    .eq('team_id', teamId)
}
