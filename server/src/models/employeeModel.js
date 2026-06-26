import { query } from '../config/database.js'
import { getNextItNumber } from '../utils/itSequences.js'

export async function createEmployee(data) {
  const employeeCode = await getNextItNumber('EMP')

  const result = await query(
    `INSERT INTO hr_employees
      (employee_code, name, email, phone, department, designation, join_date, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      employeeCode,
      data.name,
      data.email || null,
      data.phone || null,
      data.department || null,
      data.designation || null,
      data.joinDate || null,
      data.status || 'active',
      data.userId || null,
    ]
  )

  return result.rows[0]
}

export async function listEmployees({ search, status, limit = 200, offset = 0 } = {}) {
  const conditions = []
  const params = []
  let idx = 1

  if (status) {
    conditions.push(`status = $${idx++}`)
    params.push(status)
  }

  if (search) {
    const term = `%${search}%`
    conditions.push(
      `(name ILIKE $${idx} OR email ILIKE $${idx} OR employee_code ILIKE $${idx} OR department ILIKE $${idx})`
    )
    params.push(term)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT * FROM hr_employees ${where}
     ORDER BY name ASC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM hr_employees ${where}`, params)

  return { employees: result.rows, total: countResult.rows[0].total }
}

export async function getEmployeeById(id) {
  const result = await query('SELECT * FROM hr_employees WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateEmployee(id, data) {
  const result = await query(
    `UPDATE hr_employees SET
      name = $1,
      email = $2,
      phone = $3,
      department = $4,
      designation = $5,
      join_date = $6,
      status = $7
     WHERE id = $8
     RETURNING *`,
    [
      data.name,
      data.email || null,
      data.phone || null,
      data.department || null,
      data.designation || null,
      data.joinDate || null,
      data.status || 'active',
      id,
    ]
  )

  return result.rows[0] || null
}

export async function deleteEmployee(id) {
  const result = await query('DELETE FROM hr_employees WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getEmployeeStats() {
  const result = await query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive
     FROM hr_employees`
  )
  return result.rows[0]
}

export async function listActiveEmployees() {
  const result = await query(
    `SELECT id, employee_code, name, department, designation
     FROM hr_employees
     WHERE status = 'active'
     ORDER BY name ASC`
  )
  return result.rows
}
