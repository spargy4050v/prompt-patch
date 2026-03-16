import { Router } from 'express'
import { listTeams, getTeamDetails, updateTeamStatus, createTeam } from '../controllers/teamController.js'
import { requireAuth, requireAdmin, requireStaff } from '../middleware/auth.js'

const router = Router()

router.post('/', requireAuth, requireAdmin, createTeam)
router.get('/', requireAuth, requireStaff, listTeams)
router.get('/:id', requireAuth, requireStaff, getTeamDetails)
router.patch('/:id/status', requireAuth, requireStaff, updateTeamStatus)

export default router
