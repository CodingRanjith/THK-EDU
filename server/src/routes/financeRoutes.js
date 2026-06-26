import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getReceivablesList,
  getReceivablesStats,
  getReceivable,
  createReceivableHandler,
  updateReceivableHandler,
  removeReceivable,
  getPayablesList,
  getPayablesStats,
  getPayable,
  createPayableHandler,
  updatePayableHandler,
  removePayable,
  getFinanceReport,
} from '../controllers/financeController.js'

const router = Router()

router.use(authenticate)

router.get('/reports', getFinanceReport)

router.get('/receivables/stats', getReceivablesStats)
router.get('/receivables', getReceivablesList)
router.post('/receivables', createReceivableHandler)
router.get('/receivables/:id', getReceivable)
router.put('/receivables/:id', updateReceivableHandler)
router.delete('/receivables/:id', removeReceivable)

router.get('/payables/stats', getPayablesStats)
router.get('/payables', getPayablesList)
router.post('/payables', createPayableHandler)
router.get('/payables/:id', getPayable)
router.put('/payables/:id', updatePayableHandler)
router.delete('/payables/:id', removePayable)

export default router
