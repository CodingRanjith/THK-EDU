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

export async function createHardware(data) {
  const assetNumber = await getNextItNumber('HW')

  const result = await query(
    `INSERT INTO it_hardware_assets
      (asset_number, asset_name, category, brand, model, serial_number,
       purchase_date, purchase_cost, warranty_expiry, assigned_to, location,
       status, condition, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      assetNumber,
      data.assetName,
      data.category || 'other',
      data.brand || null,
      data.model || null,
      data.serialNumber || null,
      data.purchaseDate || null,
      data.purchaseCost ?? null,
      data.warrantyExpiry || null,
      data.assignedTo || null,
      data.location || null,
      data.status || 'available',
      data.condition || 'good',
      data.notes || null,
    ]
  )

  return result.rows[0]
}

export async function listHardware({ search, status, category, limit = 200, offset = 0 } = {}) {
  const { where, params, nextIdx } = buildWhere(
    { status, category, _search: search },
    ['asset_number', 'asset_name', 'brand', 'model', 'serial_number', 'assigned_to', 'location']
  )

  const result = await query(
    `SELECT * FROM it_hardware_assets ${where}
     ORDER BY created_at DESC
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM it_hardware_assets ${where}`, params)
  return { assets: result.rows, total: countResult.rows[0].total }
}

export async function getHardwareById(id) {
  const result = await query('SELECT * FROM it_hardware_assets WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateHardware(id, data) {
  const result = await query(
    `UPDATE it_hardware_assets SET
      asset_name = $2,
      category = $3,
      brand = $4,
      model = $5,
      serial_number = $6,
      purchase_date = $7,
      purchase_cost = $8,
      warranty_expiry = $9,
      assigned_to = $10,
      location = $11,
      status = $12,
      condition = $13,
      notes = $14
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.assetName,
      data.category || 'other',
      data.brand || null,
      data.model || null,
      data.serialNumber || null,
      data.purchaseDate || null,
      data.purchaseCost ?? null,
      data.warrantyExpiry || null,
      data.assignedTo || null,
      data.location || null,
      data.status || 'available',
      data.condition || 'good',
      data.notes || null,
    ]
  )
  return result.rows[0] || null
}

export async function deleteHardware(id) {
  const result = await query('DELETE FROM it_hardware_assets WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getHardwareStats() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'available')::int AS available,
      COUNT(*) FILTER (WHERE status = 'assigned')::int AS assigned,
      COUNT(*) FILTER (WHERE status = 'in_repair')::int AS in_repair,
      COUNT(*) FILTER (WHERE status = 'retired')::int AS retired
    FROM it_hardware_assets
  `)
  return result.rows[0]
}
