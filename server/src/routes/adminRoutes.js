import { Router } from 'express'
import {
  getAllUsers,
  createNewUser,
  toggleUserStatus,
  removeUser,
  getDashboardStats,
} from '../controllers/adminController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/stats', getDashboardStats)
router.get('/users', getAllUsers)
router.post('/users', createNewUser)
router.patch('/users/:id/status', toggleUserStatus)
router.delete('/users/:id', removeUser)

export default router
