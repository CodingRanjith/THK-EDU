import { query } from '../config/database.js'
import { getNextItNumber } from '../utils/itSequences.js'

function buildWhere(filters, searchFields) {
  const conditions = []
  const params = []
  let idx = 1

  for (const [key, value] of Object.entries(filters)) {
    if (key === '_search' || !value) continue
    conditions.push(`${key} = $${idx++}`)
    params.push(value)
  }

  if (filters._search && searchFields.length) {
    const search = `%${filters._search}%`
    const parts = searchFields.map((field) => `${field} ILIKE $${idx}`)
    conditions.push(`(${parts.join(' OR ')})`)
    params.push(search)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where, params, nextIdx: idx }
}

export async function createClient(data) {
  const clientNumber = await getNextItNumber('CL')

  const result = await query(
    `INSERT INTO it_clients
      (client_number, client_name, organization, payment_type, payment, city, country,
       gst_no, status, industry, category, lead_source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      clientNumber,
      data.clientName,
      data.organization || null,
      data.paymentType || null,
      data.payment ?? null,
      data.city || null,
      data.country || null,
      data.gstNo || null,
      data.status || 'active',
      data.industry || null,
      data.category || null,
      data.leadSource || null,
    ]
  )

  return result.rows[0]
}

export async function listClients({ search, status, paymentType, industry, limit = 100, offset = 0 }) {
  const { where, params, nextIdx } = buildWhere(
    { status, payment_type: paymentType, _search: search },
  ['client_number', 'client_name', 'organization', 'city', 'country', 'gst_no']
  )

  const result = await query(
    `SELECT * FROM it_clients ${where}
     ORDER BY created_at DESC
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM it_clients ${where}`, params)

  return { clients: result.rows, total: countResult.rows[0].total }
}

export async function getClientById(id) {
  const result = await query('SELECT * FROM it_clients WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateClient(id, data) {
  const result = await query(
    `UPDATE it_clients SET
      client_name = COALESCE($2, client_name),
      organization = COALESCE($3, organization),
      payment_type = COALESCE($4, payment_type),
      payment = COALESCE($5, payment),
      city = COALESCE($6, city),
      country = COALESCE($7, country),
      gst_no = COALESCE($8, gst_no),
      status = COALESCE($9, status),
      industry = COALESCE($10, industry),
      category = COALESCE($11, category),
      lead_source = COALESCE($12, lead_source)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.clientName,
      data.organization,
      data.paymentType,
      data.payment,
      data.city,
      data.country,
      data.gstNo,
      data.status,
      data.industry,
      data.category,
      data.leadSource,
    ]
  )
  return result.rows[0] || null
}

export async function deleteClient(id) {
  const result = await query('DELETE FROM it_clients WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getClientStats() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'prospect')::int AS prospect,
      COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive
    FROM it_clients
  `)
  return result.rows[0]
}

export async function listClientsBrief() {
  const result = await query(
    `SELECT id, client_number, client_name, organization
     FROM it_clients
     ORDER BY client_name ASC`
  )
  return result.rows
}
