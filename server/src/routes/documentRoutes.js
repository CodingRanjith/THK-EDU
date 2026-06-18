import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import {
  previewDocument,
  createSingleDocument,
  createBulkDocuments,
  getDocuments,
  getDocument,
  updateDocumentById,
  removeDocument,
  downloadDocument,
  getDocumentTypes,
} from '../controllers/documentController.js'

const router = Router()

router.use(authenticate)

router.get('/types', getDocumentTypes)
router.post('/preview', previewDocument)
router.post('/bulk', createBulkDocuments)
router.post('/', createSingleDocument)
router.get('/', getDocuments)
router.get('/:id/download', downloadDocument)
router.get('/:id', getDocument)
router.put('/:id', updateDocumentById)
router.delete('/:id', removeDocument)

export default router
