import { Router } from 'express'
import {
  register,
  getRegistrations,
  resetRegistrations
} from '../controllers/registrationController.js'

const router = Router()

// POST /api/register — submit a new registration
router.post('/register', register)

// GET /api/registrations — judges view all submissions
router.get('/registrations', getRegistrations)

// POST /api/reset — judges reset all data
router.post('/reset', resetRegistrations)

export default router
