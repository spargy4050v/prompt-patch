import { supabase } from '../lib/supabase.js'

// ── Dashboard config ──
export async function getDashboardConfig(req, res) {
  const { data } = await supabase.from('dashboard_config').select('*').eq('id', 1).single()
  return res.json(data)
}

export async function updateDashboardConfig(req, res) {
  const updates = {}
  const allowed = ['active_view', 'break_message', 'break_end_time', 'next_event_message', 'leaderboard_frozen']
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  await supabase.from('dashboard_config').update(updates).eq('id', 1)
  return res.json({ success: true })
}

// ── Rounds config ──
export async function getRounds(req, res) {
  const { data } = await supabase.from('rounds_config').select('*').order('id')
  return res.json({ rounds: data })
}

export async function updateRound(req, res) {
  const allowed = ['is_unlocked', 'is_active', 'timer_end', 'is_score_visible']
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  await supabase.from('rounds_config').update(updates).eq('id', req.params.id)
  return res.json({ success: true })
}

// ── Payment config ──
export async function getPaymentConfig(req, res) {
  const { data } = await supabase.from('payment_config').select('*').eq('id', 1).single()
  return res.json(data)
}

export async function updatePaymentConfig(req, res) {
  const updates = {}
  if (req.body.mobile_number !== undefined) updates.mobile_number = req.body.mobile_number
  await supabase.from('payment_config').update(updates).eq('id', 1)
  return res.json({ success: true })
}

export async function uploadQR(req, res) {
  const file = req.file
  if (!file) return res.status(400).json({ error: 'No file' })

  const fileName = `qr_${Date.now()}.${file.originalname.split('.').pop()}`
  const { error } = await supabase.storage.from('payment-qr')
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true })
  if (error) return res.status(500).json({ error: 'Upload failed' })

  const { data: { publicUrl } } = supabase.storage.from('payment-qr').getPublicUrl(fileName)
  await supabase.from('payment_config').update({ qr_image_url: publicUrl }).eq('id', 1)

  return res.json({ success: true, url: publicUrl })
}

// ── Leaderboard ──
export async function getLeaderboard(req, res) {
  const { data: config } = await supabase.from('dashboard_config').select('leaderboard_frozen').eq('id', 1).single()
  const { data: rounds } = await supabase.from('rounds_config').select('id, is_score_visible')

  const visibility = {}
  for (const r of rounds || []) visibility[r.id] = r.is_score_visible

  const { data } = await supabase.from('leaderboard')
    .select('*').order('total_score', { ascending: false })

  const rows = (data || []).map(row => ({
    ...row,
    round1_score: visibility[1] ? row.round1_score : null,
    round2_score: visibility[2] ? row.round2_score : null,
    round3_score: visibility[3] ? row.round3_score : null,
    total_score: visibility[1] || visibility[2] || visibility[3]
      ? (visibility[1] ? row.round1_score : 0) + (visibility[2] ? row.round2_score : 0) + (visibility[3] ? row.round3_score : 0)
      : null
  }))

  return res.json({ leaderboard: rows, frozen: config?.leaderboard_frozen || false })
}

// ── CSV Export helpers ──
function toCSV(data, headers) {
  const headerRow = headers.map(h => h.label).join(',')
  const rows = data.map(item =>
    headers.map(h => `"${String(item[h.key] ?? '').replace(/"/g, '""')}"`).join(',')
  )
  return [headerRow, ...rows].join('\n')
}

// All available column definitions per export type
const EXPORT_COLUMNS = {
  teams: [
    { key: 'team_name', label: 'Team' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'member_name', label: 'Member' },
    { key: 'roll_number', label: 'Roll No' },
    { key: 'branch', label: 'Branch' },
    { key: 'year', label: 'Year' },
    { key: 'section', label: 'Section' }
  ],
  leaderboard: [
    { key: 'team_name', label: 'Team' },
    { key: 'round1_score', label: 'R1' },
    { key: 'round2_score', label: 'R2' },
    { key: 'round3_score', label: 'R3' },
    { key: 'total_score', label: 'Total' }
  ],
  round1: [
    { key: 'team', label: 'Team' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'score', label: 'Score' }
  ],
  round2: [
    { key: 'sub_round', label: 'Sub-Round' },
    { key: 'drawing_team', label: 'Drawing Team' },
    { key: 'drawing_pts', label: 'Draw Pts' },
    { key: 'guessing_team', label: 'Guessing Team' },
    { key: 'guessing_pts', label: 'Guess Pts' }
  ],
  round3: [
    { key: 'team', label: 'Team' },
    { key: 'final_score', label: 'Score' },
    { key: 'hint_penalty', label: 'Hint Penalty' },
    { key: 'disqualified', label: 'DQ' },
    { key: 'completed', label: 'Completed' }
  ]
}

// GET /admin/export/columns/:type — return available columns for an export type
export function getExportColumns(req, res) {
  const type = req.params.type  // teams | leaderboard | round1 | round2 | round3
  const cols = EXPORT_COLUMNS[type]
  if (!cols) return res.status(400).json({ error: 'Invalid export type' })
  return res.json({ columns: cols })
}

// Pick columns in order requested via ?columns=key1,key2,...
function pickColumns(allHeaders, queryColumns) {
  if (!queryColumns) return allHeaders
  const keys = queryColumns.split(',').map(k => k.trim())
  return keys.map(k => allHeaders.find(h => h.key === k)).filter(Boolean)
}

export async function exportTeams(req, res) {
  let query = supabase.from('teams')
    .select('team_name, role, status, transaction_id, created_at, members(name, roll_number, branch, year, section)')
    .order('created_at')
  if (req.query.status) query = query.eq('status', req.query.status)
  if (req.query.role) query = query.eq('role', req.query.role)

  const { data } = await query
  const flat = (data || []).flatMap(t =>
    (t.members || [{}]).map(m => ({
      team_name: t.team_name, role: t.role, status: t.status,
      transaction_id: t.transaction_id, member_name: m.name || '',
      roll_number: m.roll_number || '', branch: m.branch || '',
      year: m.year || '', section: m.section || ''
    }))
  )
  const headers = pickColumns(EXPORT_COLUMNS.teams, req.query.columns)
  const csv = toCSV(flat, headers)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=teams.csv')
  return res.send(csv)
}

export async function exportLeaderboard(req, res) {
  const { data } = await supabase.from('leaderboard').select('*').order('total_score', { ascending: false })
  const headers = pickColumns(EXPORT_COLUMNS.leaderboard, req.query.columns)
  const csv = toCSV(data || [], headers)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=leaderboard.csv')
  return res.send(csv)
}

export async function exportRound(req, res) {
  const roundId = parseInt(req.params.id)
  let csv = ''

  if (roundId === 1) {
    const { data } = await supabase.from('round1_submissions').select('*').eq('is_final', true)
    // Attach team names
    const teamIds = [...new Set((data || []).map(d => d.team_id))]
    const { data: teams } = await supabase.from('teams').select('id, team_name').in('id', teamIds)
    const nameMap = Object.fromEntries((teams || []).map(t => [t.id, t.team_name]))
    const flat = (data || []).map(d => ({
      team: nameMap[d.team_id] || 'Unknown', difficulty: d.difficulty, score: d.score ?? 'unscored'
    }))
    const headers = pickColumns(EXPORT_COLUMNS.round1, req.query.columns)
    csv = toCSV(flat, headers)
  } else if (roundId === 2) {
    const { data } = await supabase.from('round2_scores')
      .select('*, drawing_team:teams!round2_scores_drawing_team_id_fkey(team_name), guessing_team:teams!round2_scores_guessing_team_id_fkey(team_name)')
      .order('round_number')
    const flat = (data || []).map(d => ({
      sub_round: d.round_number, drawing_team: d.drawing_team?.team_name || 'Host',
      drawing_pts: d.drawing_points, guessing_team: d.guessing_team?.team_name || '-',
      guessing_pts: d.guessing_points
    }))
    const headers = pickColumns(EXPORT_COLUMNS.round2, req.query.columns)
    csv = toCSV(flat, headers)
  } else if (roundId === 3) {
    const { data } = await supabase.from('round3_sessions')
      .select('*, teams!round3_sessions_team_id_fkey(team_name)')
    const flat = (data || []).map(d => ({
      team: d.teams?.team_name || 'Unknown', final_score: d.final_score ?? 'incomplete',
      hint_penalty: d.hint_penalty, disqualified: d.is_disqualified ? 'Yes' : 'No',
      completed: d.completed_at ? 'Yes' : 'No'
    }))
    const headers = pickColumns(EXPORT_COLUMNS.round3, req.query.columns)
    csv = toCSV(flat, headers)
  }

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=round${roundId}.csv`)
  return res.send(csv)
}

// ── Staff list (for admin to manage) ──
export async function getStaff(req, res) {
  const { data } = await supabase.from('teams')
    .select('id, team_name, role, is_permanent, created_at')
    .in('role', ['admin', 'volunteer'])
    .order('created_at')
  return res.json({ staff: data || [] })
}
