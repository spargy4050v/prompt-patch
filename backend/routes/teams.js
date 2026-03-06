import { Router } from 'express'
import { listTeams, getTeamDetails, updateTeamStatus } from '../controllers/teamController.js'
import { requireAuth, requireStaff } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, requireStaff, listTeams)
router.get('/:id', requireAuth, requireStaff, getTeamDetails)
router.patch('/:id/status', requireAuth, requireStaff, updateTeamStatus)

export default router
