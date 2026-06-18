import { query } from '../config/database.js'
import { getDocumentTypeConfig } from '../config/documentTypes.js'

export async function getNextDocumentNumber(documentType) {
  const config = getDocumentTypeConfig(documentType)
  if (!config) throw new Error('Invalid document type')

  const { prefix } = config

  const result = await query(
    `INSERT INTO document_sequences (prefix, last_number)
     VALUES ($1, 1)
     ON CONFLICT (prefix) DO UPDATE SET last_number = document_sequences.last_number + 1
     RETURNING last_number`,
    [prefix]
  )

  const num = result.rows[0].last_number
  return `${prefix}-${String(num).padStart(3, '0')}`
}

export async function createDocument({
  documentType,
  recipientName,
  recipientEmail,
  title,
  formData,
  htmlContent,
  status = 'generated',
  createdBy,
}) {
  const documentNumber = await getNextDocumentNumber(documentType)

  const result = await query(
    `INSERT INTO documents
      (document_number, document_type, recipient_name, recipient_email, title, form_data, html_content, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      documentNumber,
      documentType,
      recipientName,
      recipientEmail || null,
      title,
      JSON.stringify(formData),
      htmlContent,
      status,
      createdBy,
    ]
  )

  return result.rows[0]
}

export async function listDocuments({ type, search, limit = 50, offset = 0 }) {
  const conditions = []
  const params = []
  let idx = 1

  if (type) {
    conditions.push(`document_type = $${idx++}`)
    params.push(type)
  }

  if (search) {
    conditions.push(
      `(recipient_name ILIKE $${idx} OR document_number ILIKE $${idx} OR title ILIKE $${idx})`
    )
    params.push(`%${search}%`)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT id, document_number, document_type, recipient_name, recipient_email,
            title, status, created_by, created_at, updated_at
     FROM documents ${where}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    [...params, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM documents ${where}`,
    params
  )

  return { documents: result.rows, total: countResult.rows[0].total }
}

export async function getDocumentById(id) {
  const result = await query('SELECT * FROM documents WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateDocument(id, { recipientName, recipientEmail, title, formData, htmlContent, status }) {
  const result = await query(
    `UPDATE documents SET
      recipient_name = COALESCE($2, recipient_name),
      recipient_email = COALESCE($3, recipient_email),
      title = COALESCE($4, title),
      form_data = COALESCE($5, form_data),
      html_content = COALESCE($6, html_content),
      status = COALESCE($7, status)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      recipientName,
      recipientEmail,
      title,
      formData ? JSON.stringify(formData) : null,
      htmlContent,
      status,
    ]
  )
  return result.rows[0] || null
}

export async function deleteDocument(id) {
  const result = await query('DELETE FROM documents WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}
