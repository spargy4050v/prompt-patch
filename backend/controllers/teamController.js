import { supabase } from '../lib/supabase.js'
import bcrypt from 'bcryptjs'

// GET /api/teams
export async function listTeams(req, res) {
  let query = supabase
    .from('teams')
    .select('id, team_name, role, status, transaction_id, created_at, members(*)')
    .order('created_at', { ascending: false })

  if (req.query.status) query = query.eq('status', req.query.status)
  if (req.query.role) query = query.eq('role', req.query.role)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch teams' })
  return res.json({ teams: data })
}

// GET /api/teams/:id
export async function getTeamDetails(req, res) {
  const { data } = await supabase
    .from('teams')
    .select('id, team_name, role, status, transaction_id, created_at, members(*)')
    .eq('id', req.params.id).single()
  if (!data) return res.status(404).json({ error: 'Not found' })
  return res.json({ team: data })
}

// PATCH /api/teams/:id/status — Approve / reject
export async function updateTeamStatus(req, res) {
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  const { data: team, error } = await supabase
    .from('teams')
    .update({ status })
    .eq('id', req.params.id).eq('role', 'team')
    .select('id, team_name').single()

  if (error || !team) return res.status(404).json({ error: 'Team not found' })

  if (status === 'approved') {
    await supabase.from('leaderboard').upsert({
      team_id: team.id, team_name: team.team_name,
      round1_score: 0, round2_score: 0, round3_score: 0, total_score: 0
    })
  }
  if (status === 'rejected') {
    await supabase.from('leaderboard').delete().eq('team_id', team.id)
  }

  return res.json({ success: true, team })
}

// POST /api/teams — Admin creates team directly (auto-approved)
export async function createTeam(req, res) {
  const { teamName, password, members, transactionId } = req.body

  if (!teamName || !password || !Array.isArray(members)) {
    return res.status(400).json({ error: 'teamName, password, and members are required' })
  }
  if (members.length < 2 || members.length > 3) {
    return res.status(400).json({ error: 'Teams must have 2-3 members' })
  }

  for (const m of members) {
    if (!m.name || !m.rollNumber || !m.collegeName || !m.phoneNumber) {
      return res.status(400).json({ error: 'All member fields are required' })
    }
  }

  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('team_name', teamName)
    .single()

  if (existing) return res.status(400).json({ error: 'Team name already taken' })

  const hash = await bcrypt.hash(password, 10)
  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      team_name: teamName,
      password_hash: hash,
      role: 'team',
      status: 'approved',
      transaction_id: transactionId || null
    })
    .select('id, team_name, role, status, transaction_id, created_at')
    .single()

  if (error || !team) {
    return res.status(500).json({ error: 'Failed to create team' })
  }

  const memberRows = members.map(m => ({
    team_id: team.id,
    name: m.name,
    roll_number: m.rollNumber,
    college_name: m.collegeName,
    phone_number: m.phoneNumber
  }))

  const { error: memberError } = await supabase.from('members').insert(memberRows)
  if (memberError) {
    await supabase.from('teams').delete().eq('id', team.id)
    return res.status(500).json({ error: 'Failed to create team members' })
  }

  await supabase.from('leaderboard').upsert({
    team_id: team.id,
    team_name: team.team_name,
    round1_score: 0,
    round2_score: 0,
    round3_score: 0,
    total_score: 0
  })

  return res.json({ success: true, team, message: 'Team created and approved' })
}
