import { Router } from 'express'
import multer from 'multer'
import { requireAuth, requireAdmin, requireStaff } from '../middleware/auth.js'
import * as admin from '../controllers/adminController.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const router = Router()

// Dashboard control
router.get('/dashboard', admin.getDashboardConfig)
router.patch('/dashboard', requireAuth, requireAdmin, admin.updateDashboardConfig)

// Rounds config
router.get('/rounds', admin.getRounds)
router.patch('/rounds/:id', requireAuth, requireAdmin, admin.updateRound)

// Payment
router.get('/payment', admin.getPaymentConfig)
router.patch('/payment', requireAuth, requireAdmin, admin.updatePaymentConfig)
router.post('/payment/qr', requireAuth, requireAdmin, upload.single('qr'), admin.uploadQR)

// Leaderboard
router.get('/leaderboard', admin.getLeaderboard)

// Staff management
router.get('/staff', requireAuth, requireAdmin, admin.getStaff)

// Exports
router.get('/export/columns/:type', requireAuth, requireStaff, admin.getExportColumns)
router.get('/export/teams', requireAuth, requireStaff, admin.exportTeams)
router.get('/export/leaderboard', requireAuth, requireStaff, admin.exportLeaderboard)
router.get('/export/round/:id', requireAuth, requireStaff, admin.exportRound)

export default router
