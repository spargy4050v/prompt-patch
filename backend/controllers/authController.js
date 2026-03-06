import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase.js'
import { generateToken } from '../middleware/auth.js'

// POST /api/auth/register — Team registration
export async function registerTeam(req, res) {
  const { teamName, password, members, transactionId } = req.body

  if (!teamName || !password || !members || !transactionId) {
    return res.status(400).json({ error: 'All fields required' })
  }
  if (members.length < 2 || members.length > 3) {
    return res.status(400).json({ error: 'Teams must have 2-3 members' })
  }
  for (const m of members) {
    if (!m.name || !m.rollNumber || !m.branch || !m.year || !m.section) {
      return res.status(400).json({ error: 'All member fields required' })
    }
  }

  // Block names that already exist (including admin/volunteer accounts)
  const { data: existing } = await supabase
    .from('teams').select('id').eq('team_name', teamName).single()
  if (existing) return res.status(400).json({ error: 'Team name already taken' })

  const hash = await bcrypt.hash(password, 10)

  const { data: team, error } = await supabase
    .from('teams')
    .insert({ team_name: teamName, password_hash: hash, transaction_id: transactionId })
    .select().single()
  if (error) return res.status(500).json({ error: 'Registration failed' })

  const memberRows = members.map(m => ({
    team_id: team.id, name: m.name, roll_number: m.rollNumber,
    branch: m.branch, year: m.year, section: m.section
  }))
  await supabase.from('members').insert(memberRows)

  return res.json({ success: true, message: 'Registration submitted. Awaiting approval.' })
}

// POST /api/auth/login
export async function login(req, res) {
  const { teamName, password } = req.body
  if (!teamName || !password) return res.status(400).json({ error: 'Credentials required' })

  const { data: team } = await supabase
    .from('teams').select('*').eq('team_name', teamName).single()
  if (!team) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, team.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  if (team.role === 'team' && team.status !== 'approved') {
    return res.status(403).json({
      error: team.status === 'pending' ? 'Registration pending approval' : 'Registration rejected'
    })
  }

  // New token invalidates any previous session
  const token = generateToken({ id: team.id, role: team.role })
  await supabase.from('teams').update({ session_token: token }).eq('id', team.id)

  return res.json({
    success: true, token,
    user: { id: team.id, teamName: team.team_name, role: team.role, status: team.status }
  })
}

// POST /api/auth/logout
export async function logout(req, res) {
  await supabase.from('teams').update({ session_token: null }).eq('id', req.user.id)
  return res.json({ success: true })
}

// POST /api/auth/create-user — Admin creates volunteer/admin
export async function createUser(req, res) {
  const { teamName, password, role } = req.body
  if (!teamName || !password || !['admin', 'volunteer'].includes(role)) {
    return res.status(400).json({ error: 'Valid teamName, password, and role required' })
  }

  const { data: existing } = await supabase
    .from('teams').select('id').eq('team_name', teamName).single()
  if (existing) return res.status(400).json({ error: 'Name already taken' })

  const hash = await bcrypt.hash(password, 10)
  const { error } = await supabase.from('teams').insert({
    team_name: teamName, password_hash: hash, role, status: 'approved'
  })
  if (error) return res.status(500).json({ error: 'Failed to create user' })

  return res.json({ success: true, message: `${role} account created` })
}

// DELETE /api/auth/users/:id — Admin deletes non-permanent admin/volunteer
export async function deleteUser(req, res) {
  const { data: target } = await supabase
    .from('teams').select('is_permanent, role').eq('id', req.params.id).single()
  if (!target) return res.status(404).json({ error: 'User not found' })
  if (target.is_permanent) return res.status(403).json({ error: 'Cannot delete permanent admin' })
  if (target.role === 'team') return res.status(400).json({ error: 'Use team management instead' })

  await supabase.from('teams').delete().eq('id', req.params.id)
  return res.json({ success: true })
}
