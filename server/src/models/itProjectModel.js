import { query } from '../config/database.js'
import { getNextItNumber } from '../utils/itSequences.js'

function calcDurationDays(startDate, endDate) {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return days >= 0 ? days : null
}

function buildWhere(filters) {
  const conditions = []
  const params = []
  let idx = 1

  if (filters.status) {
    conditions.push(`p.status = $${idx++}`)
    params.push(filters.status)
  }

  if (filters.projectType) {
    conditions.push(`p.project_type = $${idx++}`)
    params.push(filters.projectType)
  }

  if (filters.projectSource) {
    conditions.push(`p.project_source = $${idx++}`)
    params.push(filters.projectSource)
  }

  if (filters.clientId) {
    conditions.push(`p.client_id = $${idx++}`)
    params.push(filters.clientId)
  }

  if (filters.search) {
    const search = `%${filters.search}%`
    conditions.push(
      `(p.project_number ILIKE $${idx} OR p.project_name ILIKE $${idx} OR c.client_name ILIKE $${idx})`
    )
    params.push(search)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where, params, nextIdx: idx }
}

const SELECT_FIELDS = `
  p.*,
  c.client_number,
  c.client_name,
  c.organization AS client_organization
`

const FROM_JOIN = `
  FROM it_projects p
  LEFT JOIN it_clients c ON c.id = p.client_id
`

export async function createProject(data) {
  const projectNumber = await getNextItNumber('PJ')
  const durationDays = calcDurationDays(data.startDate, data.endDate)

  const result = await query(
    `INSERT INTO it_projects
      (project_number, project_name, client_id, project_type, project_source,
       start_date, end_date, duration_days, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      projectNumber,
      data.projectName,
      data.clientId || null,
      data.projectType || 'billable',
      data.projectSource || 'external',
      data.startDate || null,
      data.endDate || null,
      durationDays,
      data.status || 'planning',
    ]
  )

  return getProjectById(result.rows[0].id)
}

export async function listProjects({ search, status, projectType, projectSource, clientId, limit = 100, offset = 0 }) {
  const { where, params, nextIdx } = buildWhere({ search, status, projectType, projectSource, clientId })

  const result = await query(
    `SELECT ${SELECT_FIELDS}
     ${FROM_JOIN}
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*)::int AS total ${FROM_JOIN} ${where}`,
    params
  )

  return { projects: result.rows, total: countResult.rows[0].total }
}

export async function getProjectById(id) {
  const result = await query(
    `SELECT ${SELECT_FIELDS} ${FROM_JOIN} WHERE p.id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function updateProject(id, data) {
  const existing = await query('SELECT start_date, end_date FROM it_projects WHERE id = $1', [id])
  if (!existing.rows[0]) return null

  const startDate = data.startDate !== undefined ? data.startDate : existing.rows[0].start_date
  const endDate = data.endDate !== undefined ? data.endDate : existing.rows[0].end_date
  const durationDays = calcDurationDays(startDate, endDate)

  const result = await query(
    `UPDATE it_projects SET
      project_name = COALESCE($2, project_name),
      client_id = COALESCE($3, client_id),
      project_type = COALESCE($4, project_type),
      project_source = COALESCE($5, project_source),
      start_date = COALESCE($6, start_date),
      end_date = COALESCE($7, end_date),
      duration_days = $8,
      status = COALESCE($9, status)
     WHERE id = $1
     RETURNING id`,
    [
      id,
      data.projectName,
      data.clientId,
      data.projectType,
      data.projectSource,
      data.startDate,
      data.endDate,
      durationDays,
      data.status,
    ]
  )

  if (!result.rows[0]) return null
  return getProjectById(id)
}

export async function deleteProject(id) {
  const result = await query('DELETE FROM it_projects WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getProjectStats() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active,
      COUNT(*) FILTER (WHERE status = 'planning')::int AS planning,
      COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
      COUNT(*) FILTER (WHERE project_type = 'billable')::int AS billable
    FROM it_projects
  `)
  return result.rows[0]
}
