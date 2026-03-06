import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabase.js'

const JWT_SECRET = process.env.JWT_SECRET || 'prompt-patch-secret-2026'

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

// Validates JWT and enforces single active session per team
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const { data: team } = await supabase
      .from('teams')
      .select('id, team_name, role, status, session_token')
      .eq('id', decoded.id)
      .single()

    if (!team || team.session_token !== token) {
      return res.status(401).json({ error: 'Session expired' })
    }

    req.user = { id: team.id, teamName: team.team_name, role: team.role, status: team.status }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}

export function requireStaff(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'volunteer') {
    return res.status(403).json({ error: 'Staff only' })
  }
  next()
}

export function requireApproved(req, res, next) {
  if (req.user.role === 'team' && req.user.status !== 'approved') {
    return res.status(403).json({ error: 'Team not approved' })
  }
  next()
}
