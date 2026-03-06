import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import { supabase } from './lib/supabase.js'
import authRoutes from './routes/auth.js'
import teamRoutes from './routes/teams.js'
import roundRoutes from './routes/rounds.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api', roundRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// Seed default admin on startup
async function seedAdmin() {
  const name = process.env.ADMIN_TEAM_NAME || 'ADMIN'
  const { data } = await supabase.from('teams').select('id').eq('is_permanent', true).single()
  if (!data) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin2026', 10)
    await supabase.from('teams').insert({
      team_name: name, password_hash: hash, role: 'admin', status: 'approved', is_permanent: true
    })
    console.log(`Default admin "${name}" created`)
  }
}

seedAdmin().then(() => {
  if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
  }
}).catch(err => {
  console.error('Startup failed:', err)
  if (process.env.VERCEL !== '1') process.exit(1)
})

export default app
