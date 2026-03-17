import { supabase } from '../lib/supabase.js'
import { refreshLeaderboard } from '../lib/leaderboard.js'

// POST /api/round1/upload — Team uploads an image
export async function uploadImage(req, res) {
  const file = req.file
  const { difficulty } = req.body
  if (!file) return res.status(400).json({ error: 'No file provided' })
  if (!['easy', 'hard'].includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' })

  // Check round is unlocked and timer not expired
  const { data: rc } = await supabase.from('rounds_config').select('*').eq('id', 1).single()
  if (!rc?.is_unlocked) return res.status(403).json({ error: 'Round 1 is locked' })
  if (rc.timer_end && new Date(rc.timer_end) < new Date()) {
    return res.status(403).json({ error: 'Time expired. Submissions locked.' })
  }

  const fileName = `${req.user.id}/${difficulty}/${Date.now()}_${file.originalname}`
  const { error: uploadErr } = await supabase.storage
    .from('round1-submissions')
    .upload(fileName, file.buffer, { contentType: file.mimetype })
  if (uploadErr) return res.status(500).json({ error: uploadErr.message || 'Upload failed' })

  const { data: { publicUrl } } = supabase.storage.from('round1-submissions').getPublicUrl(fileName)

  // Insert new submission as final; unmark previous finals for same difficulty
  const { data: sub } = await supabase.from('round1_submissions')
    .insert({ team_id: req.user.id, difficulty, image_url: publicUrl, is_final: true })
    .select().single()

  await supabase.from('round1_submissions')
    .update({ is_final: false })
    .eq('team_id', req.user.id).eq('difficulty', difficulty)
    .neq('id', sub.id)

  return res.json({ success: true, submission: sub })
}

// GET /api/round1/submissions — Teams see own finals, staff can view/filter all
export async function getSubmissions(req, res) {
  let query = supabase.from('round1_submissions')
    .select('*')
    .eq('is_final', true)
    .order('uploaded_at', { ascending: false })

  // Teams can only see their own uploads; staff can filter by any team_id.
  if (req.user.role === 'team') {
    query = query.eq('team_id', req.user.id)
  } else if (req.query.team_id) {
    query = query.eq('team_id', req.query.team_id)
  }

  if (req.query.difficulty) query = query.eq('difficulty', req.query.difficulty)

  const { data } = await query

  // Attach team names
  if (data?.length) {
    const teamIds = [...new Set(data.map(s => s.team_id))]
    const { data: teams } = await supabase.from('teams').select('id, team_name').in('id', teamIds)
    const nameMap = Object.fromEntries((teams || []).map(t => [t.id, t.team_name]))
    data.forEach(s => { s.team_name = nameMap[s.team_id] || 'Unknown' })
  }

  return res.json({ submissions: data || [] })
}

// POST /api/round1/score — Staff scores a submission
export async function scoreSubmission(req, res) {
  const { submissionId, score } = req.body
  const { data: sub } = await supabase.from('round1_submissions')
    .select('*').eq('id', submissionId).single()
  if (!sub) return res.status(404).json({ error: 'Not found' })

  const max = sub.difficulty === 'easy' ? 15 : 25
  if (typeof score !== 'number' || score < 0 || score > max) {
    return res.status(400).json({ error: `Score must be 0-${max}` })
  }

  // Volunteers can't overwrite another scorer's score; admins can
  if (req.user.role === 'volunteer' && sub.scored_by && sub.scored_by !== req.user.id) {
    return res.status(403).json({ error: 'Already scored. Admin can override.' })
  }

  await supabase.from('round1_submissions').update({
    score, scored_by: req.user.id, scored_at: new Date().toISOString()
  }).eq('id', submissionId)

  await refreshLeaderboard(sub.team_id)
  return res.json({ success: true })
}

// POST /api/round1/manual-award — Admin awards score even without image upload
export async function manualAwardRound1(req, res) {
  const { teamId, difficulty, score } = req.body
  if (!teamId) return res.status(400).json({ error: 'teamId is required' })
  if (!['easy', 'hard'].includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' })

  const max = difficulty === 'easy' ? 15 : 25
  if (typeof score !== 'number' || score < 0 || score > max) {
    return res.status(400).json({ error: `Score must be 0-${max}` })
  }

  // Ensure target is a team account
  const { data: team } = await supabase
    .from('teams')
    .select('id, role')
    .eq('id', teamId)
    .single()
  if (!team || team.role !== 'team') return res.status(404).json({ error: 'Team not found' })

  // Reuse latest final submission if available; otherwise create a placeholder submission.
  const { data: existing } = await supabase
    .from('round1_submissions')
    .select('id')
    .eq('team_id', teamId)
    .eq('difficulty', difficulty)
    .eq('is_final', true)
    .order('uploaded_at', { ascending: false })
    .limit(1)

  if (existing?.length) {
    await supabase.from('round1_submissions').update({
      score,
      scored_by: req.user.id,
      scored_at: new Date().toISOString()
    }).eq('id', existing[0].id)
  } else {
    const placeholderUrl = `https://placehold.co/800x600?text=Manual+Award+${difficulty}`
    await supabase.from('round1_submissions').insert({
      team_id: teamId,
      difficulty,
      image_url: placeholderUrl,
      is_final: true,
      score,
      scored_by: req.user.id,
      scored_at: new Date().toISOString()
    })
  }

  await refreshLeaderboard(teamId)
  return res.json({ success: true })
}
