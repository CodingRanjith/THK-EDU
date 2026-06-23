import { query } from '../config/database.js'
import { getNextItNumber } from '../utils/itSequences.js'

function buildWhere(filters) {
  const conditions = []
  const params = []
  let idx = 1

  if (filters.status) {
    conditions.push(`status = $${idx++}`)
    params.push(filters.status)
  }

  if (filters.search) {
    const search = `%${filters.search}%`
    conditions.push(
      `(proposal_number ILIKE $${idx} OR proposal_name ILIKE $${idx} OR organization ILIKE $${idx})`
    )
    params.push(search)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where, params, nextIdx: idx }
}

export async function createProposal(data) {
  const proposalNumber = await getNextItNumber('PR')

  const result = await query(
    `INSERT INTO it_proposals
      (proposal_number, proposal_name, organization, received_date, offer_submission_date,
       proposal_value, remarks, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      proposalNumber,
      data.proposalName,
      data.organization || null,
      data.receivedDate || null,
      data.offerSubmissionDate || null,
      data.proposalValue ?? null,
      data.remarks || null,
      data.notes || null,
      data.status || 'draft',
    ]
  )

  return result.rows[0]
}

export async function listProposals({ search, status, limit = 100, offset = 0 }) {
  const { where, params, nextIdx } = buildWhere({ search, status })

  const result = await query(
    `SELECT * FROM it_proposals ${where}
     ORDER BY created_at DESC
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM it_proposals ${where}`, params)

  return { proposals: result.rows, total: countResult.rows[0].total }
}

export async function getProposalById(id) {
  const result = await query('SELECT * FROM it_proposals WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateProposal(id, data) {
  const result = await query(
    `UPDATE it_proposals SET
      proposal_name = COALESCE($2, proposal_name),
      organization = COALESCE($3, organization),
      received_date = COALESCE($4, received_date),
      offer_submission_date = COALESCE($5, offer_submission_date),
      proposal_value = COALESCE($6, proposal_value),
      remarks = COALESCE($7, remarks),
      notes = COALESCE($8, notes),
      status = COALESCE($9, status)
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.proposalName,
      data.organization,
      data.receivedDate,
      data.offerSubmissionDate,
      data.proposalValue,
      data.remarks,
      data.notes,
      data.status,
    ]
  )
  return result.rows[0] || null
}

export async function deleteProposal(id) {
  const result = await query('DELETE FROM it_proposals WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getProposalStats() {
  const result = await query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
      COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
      COUNT(*) FILTER (WHERE status = 'won')::int AS won,
      COALESCE(SUM(proposal_value) FILTER (WHERE status = 'won'), 0)::numeric AS won_value
    FROM it_proposals
  `)
  return result.rows[0]
}
