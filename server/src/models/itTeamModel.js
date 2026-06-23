import { query } from '../config/database.js'

const PROJECT_SELECT = `
  p.*,
  c.client_number,
  c.client_name,
  c.organization AS client_organization,
  COALESCE(t.team_count, 0)::int AS team_count,
  COALESCE(t.total_working_hours, 0)::numeric AS total_working_hours
`

const PROJECT_FROM = `
  FROM it_projects p
  LEFT JOIN it_clients c ON c.id = p.client_id
  LEFT JOIN (
    SELECT project_id,
           COUNT(DISTINCT team_member_id)::int AS team_count,
           COALESCE(SUM(working_hours), 0) AS total_working_hours
    FROM it_project_team_allocations
    GROUP BY project_id
  ) t ON t.project_id = p.id
`

export async function listProjectsWithTeam({ search, status, limit = 100, offset = 0 }) {
  const conditions = []
  const params = []
  let idx = 1

  if (status) {
    conditions.push(`p.status = $${idx++}`)
    params.push(status)
  }

  if (search) {
    const s = `%${search}%`
    conditions.push(
      `(p.project_number ILIKE $${idx} OR p.project_name ILIKE $${idx} OR c.client_name ILIKE $${idx})`
    )
    params.push(s)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT ${PROJECT_SELECT} ${PROJECT_FROM} ${where}
     ORDER BY p.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(
    `SELECT COUNT(*)::int AS total ${PROJECT_FROM} ${where}`,
    params
  )

  return { projects: result.rows, total: countResult.rows[0].total }
}

export async function listTeamMembers({ search, status } = {}) {
  const conditions = []
  const params = []
  let idx = 1

  if (status) {
    conditions.push(`status = $${idx++}`)
    params.push(status)
  }

  if (search) {
    const s = `%${search}%`
    conditions.push(`(member_name ILIKE $${idx} OR email ILIKE $${idx} OR designation ILIKE $${idx})`)
    params.push(s)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await query(
    `SELECT * FROM it_team_members ${where} ORDER BY member_name ASC`,
    params
  )

  return result.rows
}

export async function createTeamMember(data) {
  const result = await query(
    `INSERT INTO it_team_members (member_name, email, designation, default_available_hours, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.memberName,
      data.email || null,
      data.designation || null,
      data.defaultAvailableHours ?? 40,
      data.status || 'active',
    ]
  )
  return result.rows[0]
}

export async function updateTeamMember(id, data) {
  const result = await query(
    `UPDATE it_team_members SET
      member_name = COALESCE($2, member_name),
      email = COALESCE($3, email),
      designation = COALESCE($4, designation),
      default_available_hours = COALESCE($5, default_available_hours),
      status = COALESCE($6, status)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.memberName,
      data.email,
      data.designation,
      data.defaultAvailableHours,
      data.status,
    ]
  )
  return result.rows[0] || null
}

export async function deleteTeamMember(id) {
  const result = await query('DELETE FROM it_team_members WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

const ALLOCATION_SELECT = `
  a.*,
  m.member_name,
  m.email,
  m.designation
`

export async function listProjectAllocations(projectId, { workArea } = {}) {
  const conditions = ['a.project_id = $1']
  const params = [projectId]
  let idx = 2

  if (workArea) {
    conditions.push(`a.work_area = $${idx++}`)
    params.push(workArea)
  }

  const result = await query(
    `SELECT ${ALLOCATION_SELECT}
     FROM it_project_team_allocations a
     JOIN it_team_members m ON m.id = a.team_member_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.work_area ASC, m.member_name ASC`,
    params
  )

  return result.rows
}

export async function getProjectTeamStats(projectId) {
  const result = await query(
    `SELECT
      COUNT(DISTINCT team_member_id)::int AS members,
      COUNT(*)::int AS allocations,
      COALESCE(SUM(working_hours), 0)::numeric AS total_working_hours,
      COALESCE(SUM(available_hours), 0)::numeric AS total_available_hours
     FROM it_project_team_allocations
     WHERE project_id = $1`,
    [projectId]
  )

  const byArea = await query(
    `SELECT work_area,
            COUNT(*)::int AS count,
            COALESCE(SUM(working_hours), 0)::numeric AS working_hours
     FROM it_project_team_allocations
     WHERE project_id = $1
     GROUP BY work_area
     ORDER BY working_hours DESC`,
    [projectId]
  )

  return { summary: result.rows[0], byWorkArea: byArea.rows }
}

export async function createAllocation(projectId, data) {
  const result = await query(
    `INSERT INTO it_project_team_allocations
      (project_id, team_member_id, work_area, working_hours, available_hours, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      projectId,
      data.teamMemberId,
      data.workArea,
      data.workingHours ?? 0,
      data.availableHours ?? 40,
      data.notes || null,
    ]
  )

  const row = result.rows[0]
  const enriched = await query(
    `SELECT ${ALLOCATION_SELECT}
     FROM it_project_team_allocations a
     JOIN it_team_members m ON m.id = a.team_member_id
     WHERE a.id = $1`,
    [row.id]
  )
  return enriched.rows[0]
}

export async function updateAllocation(id, data) {
  const result = await query(
    `UPDATE it_project_team_allocations SET
      team_member_id = COALESCE($2, team_member_id),
      work_area = COALESCE($3, work_area),
      working_hours = COALESCE($4, working_hours),
      available_hours = COALESCE($5, available_hours),
      notes = COALESCE($6, notes)
     WHERE id = $1
     RETURNING id`,
    [
      id,
      data.teamMemberId,
      data.workArea,
      data.workingHours,
      data.availableHours,
      data.notes,
    ]
  )

  if (!result.rows[0]) return null

  const enriched = await query(
    `SELECT ${ALLOCATION_SELECT}
     FROM it_project_team_allocations a
     JOIN it_team_members m ON m.id = a.team_member_id
     WHERE a.id = $1`,
    [id]
  )
  return enriched.rows[0]
}

export async function deleteAllocation(id) {
  const result = await query(
    'DELETE FROM it_project_team_allocations WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rows[0] || null
}
