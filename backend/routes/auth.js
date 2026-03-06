import { Router } from 'express'
import { registerTeam, login, logout, createUser, deleteUser } from '../controllers/authController.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.post('/register', registerTeam)
router.post('/login', login)
router.post('/logout', requireAuth, logout)
router.post('/create-user', requireAuth, requireAdmin, createUser)
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser)

export default router
