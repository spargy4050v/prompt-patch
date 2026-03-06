import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireStaff, requireApproved } from '../middleware/auth.js'
import { uploadImage, getSubmissions, scoreSubmission } from '../controllers/round1Controller.js'
import { getInfo, addScore, getScores, deleteScore } from '../controllers/round2Controller.js'
import * as r3 from '../controllers/round3Controller.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()

// Round 1
router.post('/round1/upload', requireAuth, requireApproved, upload.single('image'), uploadImage)
router.get('/round1/submissions', requireAuth, requireStaff, getSubmissions)
router.post('/round1/score', requireAuth, requireStaff, scoreSubmission)

// Round 2
router.get('/round2/info', requireAuth, requireStaff, getInfo)
router.post('/round2/score', requireAuth, requireStaff, addScore)
router.get('/round2/scores', requireAuth, requireStaff, getScores)
router.delete('/round2/scores/:id', requireAuth, requireStaff, deleteScore)

// Round 3
router.post('/round3/start', requireAuth, requireApproved, r3.startRound)
router.post('/round3/complete-task', requireAuth, requireApproved, r3.completeTask)
router.post('/round3/hint', requireAuth, requireApproved, r3.getHint)
router.post('/round3/submit', requireAuth, requireApproved, r3.submitFinal)
router.post('/round3/disqualify', requireAuth, r3.disqualify)
router.post('/round3/tab-switch', requireAuth, r3.trackTabSwitch)
router.get('/round3/session', requireAuth, r3.getSession)
router.get('/round3/sessions', requireAuth, requireStaff, r3.getSessions)
router.post('/round3/reopen/:teamId', requireAuth, requireStaff, r3.reopenForTeam)

export default router
