import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  getHardwareList,
  getHardwareStatsHandler,
  getHardware,
  createHardwareHandler,
  updateHardwareHandler,
  removeHardware,
  getSoftwareList,
  getSoftwareStatsHandler,
  getSoftware,
  createSoftwareHandler,
  updateSoftwareHandler,
  removeSoftware,
} from '../controllers/itAssetsController.js'

const router = Router()

router.use(authenticate)

router.get('/hardware/stats', getHardwareStatsHandler)
router.get('/hardware', getHardwareList)
router.post('/hardware', createHardwareHandler)
router.get('/hardware/:id', getHardware)
router.put('/hardware/:id', updateHardwareHandler)
router.delete('/hardware/:id', removeHardware)

router.get('/software/stats', getSoftwareStatsHandler)
router.get('/software', getSoftwareList)
router.post('/software', createSoftwareHandler)
router.get('/software/:id', getSoftware)
router.put('/software/:id', updateSoftwareHandler)
router.delete('/software/:id', removeSoftware)

export default router
