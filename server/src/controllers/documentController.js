import { isValidDocumentType, getDocumentTypeConfig } from '../config/documentTypes.js'
import { renderDocumentHtml } from '../services/documentTemplates.js'
import { htmlToPdfBuffer } from '../services/pdfService.js'
import {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from '../models/documentModel.js'

function getRecipientName(formData, documentType) {
  if (documentType === 'policy_document') return formData.policyTitle
  if (documentType === 'intern_offer_letter') return formData.studentName
  return formData.recipientName
}

function buildTitle(documentType, formData) {
  const config = getDocumentTypeConfig(documentType)
  const name = getRecipientName(formData, documentType) || 'Document'
  return `${config?.label || documentType} - ${name}`
}

export async function previewDocument(req, res) {
  const { documentType, formData } = req.body

  if (!isValidDocumentType(documentType)) {
    return res.status(400).json({ message: 'Invalid document type' })
  }

  const html = renderDocumentHtml(documentType, formData || {}, 'PREVIEW')
  return res.json({ html })
}

export async function createSingleDocument(req, res) {
  const { documentType, formData, recipientEmail, status } = req.body

  if (!isValidDocumentType(documentType)) {
    return res.status(400).json({ message: 'Invalid document type' })
  }

  if (!getRecipientName(formData, documentType)) {
    const msg =
      documentType === 'intern_offer_letter'
        ? 'Candidate name is required'
        : documentType === 'policy_document'
          ? 'Policy title is required'
          : 'Recipient name is required'
    return res.status(400).json({ message: msg })
  }

  if (documentType === 'policy_document' && !formData?.policyTitle) {
    return res.status(400).json({ message: 'Policy title is required' })
  }

  const recipientName = getRecipientName(formData, documentType)
  const htmlContent = renderDocumentHtml(documentType, formData)

  const doc = await createDocument({
    documentType,
    recipientName,
    recipientEmail,
    title: buildTitle(documentType, formData),
    formData,
    htmlContent,
    status: status || 'generated',
    createdBy: req.user.id,
  })

  return res.status(201).json({ message: 'Document created', document: doc })
}

export async function createBulkDocuments(req, res) {
  const { documentType, items } = req.body

  if (!isValidDocumentType(documentType)) {
    return res.status(400).json({ message: 'Invalid document type' })
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'At least one item is required for bulk creation' })
  }

  const results = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rowNum = item.row || i + 1

    try {
      const formData = item.formData || item
      const recipientName = getRecipientName(formData, documentType)

      if (!recipientName) {
        results.push({
          row: rowNum,
          success: false,
          error: documentType === 'intern_offer_letter' ? 'Student name is required' : 'Recipient name is required',
        })
        continue
      }

      const htmlContent = renderDocumentHtml(documentType, formData)
      const doc = await createDocument({
        documentType,
        recipientName,
        recipientEmail: item.recipientEmail || formData.recipientEmail,
        title: buildTitle(documentType, formData),
        formData,
        htmlContent,
        status: 'generated',
        createdBy: req.user.id,
      })

      results.push({
        row: rowNum,
        success: true,
        document_number: doc.document_number,
        name: recipientName,
      })
    } catch (err) {
      results.push({
        row: rowNum,
        success: false,
        error: err.message || 'Failed to create document',
      })
    }
  }

  const success = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return res.status(201).json({
    message: `${success} succeeded, ${failed} failed`,
    summary: { success, failed, total: results.length },
    results,
  })
}

export async function getDocuments(req, res) {
  const { type, search, limit, offset } = req.query
  const result = await listDocuments({
    type,
    search,
    limit: limit ? Number(limit) : 50,
    offset: offset ? Number(offset) : 0,
  })
  return res.json(result)
}

export async function getDocument(req, res) {
  const doc = await getDocumentById(req.params.id)
  if (!doc) return res.status(404).json({ message: 'Document not found' })
  return res.json({ document: doc })
}

export async function updateDocumentById(req, res) {
  const existing = await getDocumentById(req.params.id)
  if (!existing) return res.status(404).json({ message: 'Document not found' })

  const { formData, recipientEmail, status } = req.body
  const mergedFormData = formData
    ? { ...(typeof existing.form_data === 'string' ? JSON.parse(existing.form_data) : existing.form_data), ...formData }
    : existing.form_data
  const htmlContent = renderDocumentHtml(existing.document_type, mergedFormData, existing.document_number)
  const recipientName = mergedFormData.recipientName || mergedFormData.studentName || mergedFormData.policyTitle

  const doc = await updateDocument(req.params.id, {
    recipientName,
    recipientEmail,
    title: buildTitle(existing.document_type, mergedFormData),
    formData: mergedFormData,
    htmlContent,
    status,
  })

  return res.json({ message: 'Document updated', document: doc })
}

export async function removeDocument(req, res) {
  const deleted = await deleteDocument(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Document not found' })
  return res.json({ message: 'Document deleted' })
}

export async function downloadDocument(req, res) {
  const doc = await getDocumentById(req.params.id)
  if (!doc) return res.status(404).json({ message: 'Document not found' })

  try {
    const pdfBuffer = await htmlToPdfBuffer(doc.html_content)
    const filename = `${doc.document_number}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(pdfBuffer)
  } catch (err) {
    console.error('PDF generation failed:', err.message)
    return res.status(500).json({ message: 'Failed to generate PDF' })
  }
}

export async function getDocumentTypes(_req, res) {
  const { DOCUMENT_TYPES } = await import('../config/documentTypes.js')
  const types = Object.entries(DOCUMENT_TYPES).map(([key, val]) => ({
    key,
    ...val,
  }))
  return res.json({ types })
}
