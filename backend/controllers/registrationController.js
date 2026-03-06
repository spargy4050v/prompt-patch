import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, '..', 'data', 'registrations.json')

function readData() {
  const raw = readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(raw)
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// ──────────────────────────────────────────────
// POST /api/register
// Validates and saves registration to JSON file
// LAG: Artificial 3-second delay to simulate slow server
// ──────────────────────────────────────────────
export async function register(req, res) {
  // Artificial delay — participants must wait
  await new Promise(resolve => setTimeout(resolve, 3000))

  const { name, email, teamName, college } = req.body

  // Server-side validation (more lenient than the buggy frontend)
  if (!name || !email || !teamName || !college) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    })
  }

  // Backend accepts standard email formats (unlike the frontend bug)
  const emailRegex = /^[\w.+-]+@[\w.-]+\.\w{2,}$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    })
  }

  // Generate unique verification token
  const token = crypto.randomBytes(8).toString('hex').toUpperCase()

  const data = readData()
  data.registrations.push({
    name,
    email,
    teamName,
    college,
    token,
    timestamp: new Date().toISOString()
  })
  writeData(data)

  return res.json({
    success: true,
    token,
    message: 'Registration successful'
  })
}

// ──────────────────────────────────────────────
// GET /api/registrations
// Returns all submissions — for judges to verify
// ──────────────────────────────────────────────
export function getRegistrations(req, res) {
  const data = readData()
  return res.json(data)
}

// ──────────────────────────────────────────────
// POST /api/reset
// Clears all registrations — for judges to reset between rounds
// ──────────────────────────────────────────────
export function resetRegistrations(req, res) {
  writeData({ registrations: [] })
  return res.json({ success: true, message: 'All registrations cleared' })
}
