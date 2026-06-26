import { Router } from 'express'
import {
  getEmployees,
  getEmployeeStatsHandler,
  getEmployee,
  createEmployeeHandler,
  updateEmployeeHandler,
  removeEmployee,
  getMonthlyAttendance,
  setAttendance,
  bulkSetAttendance,
} from '../controllers/hrController.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/employees/stats', getEmployeeStatsHandler)
router.get('/employees', getEmployees)
router.get('/employees/:id', getEmployee)
router.post('/employees', createEmployeeHandler)
router.put('/employees/:id', updateEmployeeHandler)
router.delete('/employees/:id', removeEmployee)

router.get('/attendance', getMonthlyAttendance)
router.post('/attendance', setAttendance)
router.post('/attendance/bulk', bulkSetAttendance)

export default router
