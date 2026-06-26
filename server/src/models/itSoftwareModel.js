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

export async function createSoftware(data) {
  const softwareNumber = await getNextItNumber('SW')

  const result = await query(
    `INSERT INTO it_software_assets
      (software_number, software_name, vendor, version, license_type, license_key,
       total_licenses, used_licenses, purchase_date, expiry_date, cost,
       assigned_to, department, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      softwareNumber,
      data.softwareName,
      data.vendor || null,
      data.version || null,
      data.licenseType || 'subscription',
      data.licenseKey || null,
      data.totalLicenses ?? 1,
      data.usedLicenses ?? 0,
      data.purchaseDate || null,
      data.expiryDate || null,
      data.cost ?? null,
      data.assignedTo || null,
      data.department || null,
      data.status || 'active',
      data.notes || null,
    ]
  )

  return result.rows[0]
}

export async function listSoftware({ search, status, licenseType, limit = 200, offset = 0 } = {}) {
  const { where, params, nextIdx } = buildWhere(
    { status, license_type: licenseType, _search: search },
    ['software_number', 'software_name', 'vendor', 'version', 'license_key', 'assigned_to', 'department']
  )

  const result = await query(
    `SELECT * FROM it_software_assets ${where}
     ORDER BY created_at DESC
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM it_software_assets ${where}`, params)
  return { software: result.rows, total: countResult.rows[0].total }
}

export async function getSoftwareById(id) {
  const result = await query('SELECT * FROM it_software_assets WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateSoftware(id, data) {
  const result = await query(
    `UPDATE it_software_assets SET
      software_name = $2,
      vendor = $3,
      version = $4,
      license_type = $5,
      license_key = $6,
      total_licenses = $7,
      used_licenses = $8,
      purchase_date = $9,
      expiry_date = $10,
      cost = $11,
      assigned_to = $12,
      department = $13,
      status = $14,
      notes = $15
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.softwareName,
      data.vendor || null,
      data.version || null,
      data.licenseType || 'subscription',
      data.licenseKey || null,
      data.totalLicenses ?? 1,
      data.usedLicenses ?? 0,
      data.purchaseDate || null,
      data.expiryDate || null,
      data.cost ?? null,
      data.assignedTo || null,
      data.department || null,
      data.status || 'active',
      data.notes || null,
    ]
  )
  return result.rows[0] || null
}

export async function deleteSoftware(id) {
  const result = await query('DELETE FROM it_software_assets WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getSoftwareStats() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'expired')::int AS expired,
      COUNT(*) FILTER (WHERE status = 'trial')::int AS trial,
      COALESCE(SUM(total_licenses), 0)::int AS total_licenses,
      COALESCE(SUM(used_licenses), 0)::int AS used_licenses
    FROM it_software_assets
  `)
  return result.rows[0]
}
