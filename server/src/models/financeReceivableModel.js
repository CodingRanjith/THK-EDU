import { query } from '../config/database.js'
import { getNextItNumber } from '../utils/itSequences.js'
import { dateRangeClause } from '../utils/financeDateUtils.js'

function buildListQuery(table, { search, status, startDate, endDate, limit = 200, offset = 0 }) {
  const conditions = []
  const params = []
  let idx = 1

  if (startDate && endDate) {
    conditions.push(dateRangeClause(table, idx))
    params.push(startDate, endDate)
    idx += 2
  }

  if (status) {
    conditions.push(`status = $${idx++}`)
    params.push(status)
  }

  if (search) {
    const term = `%${search}%`
    conditions.push(
      `(party_name ILIKE $${idx} OR invoice_number ILIKE $${idx} OR entry_number ILIKE $${idx} OR description ILIKE $${idx})`
    )
    params.push(term)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  return { where, params, nextIdx: idx, limit, offset }
}

export async function createReceivable(data) {
  const entryNumber = await getNextItNumber('AR')

  const result = await query(
    `INSERT INTO finance_receivables
      (entry_number, party_name, invoice_number, description, amount,
       transaction_date, due_date, settled_date, status, category, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      entryNumber,
      data.partyName,
      data.invoiceNumber || null,
      data.description || null,
      data.amount ?? 0,
      data.transactionDate,
      data.dueDate || null,
      data.settledDate || null,
      data.status || 'pending',
      data.category || null,
      data.paymentMethod || null,
      data.notes || null,
    ]
  )

  return result.rows[0]
}

export async function listReceivables(filters) {
  const { where, params, nextIdx, limit, offset } = buildListQuery('finance_receivables', filters)

  const result = await query(
    `SELECT * FROM finance_receivables ${where}
     ORDER BY transaction_date DESC, created_at DESC
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
    [...params, limit, offset]
  )

  const countResult = await query(`SELECT COUNT(*)::int AS total FROM finance_receivables ${where}`, params)
  return { entries: result.rows, total: countResult.rows[0].total }
}

export async function getReceivableById(id) {
  const result = await query('SELECT * FROM finance_receivables WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateReceivable(id, data) {
  const result = await query(
    `UPDATE finance_receivables SET
      party_name = $2,
      invoice_number = $3,
      description = $4,
      amount = $5,
      transaction_date = $6,
      due_date = $7,
      settled_date = $8,
      status = $9,
      category = $10,
      payment_method = $11,
      notes = $12
     WHERE id = $1
     RETURNING *`,
    [
      id,
      data.partyName,
      data.invoiceNumber || null,
      data.description || null,
      data.amount ?? 0,
      data.transactionDate,
      data.dueDate || null,
      data.settledDate || null,
      data.status || 'pending',
      data.category || null,
      data.paymentMethod || null,
      data.notes || null,
    ]
  )
  return result.rows[0] || null
}

export async function deleteReceivable(id) {
  const result = await query('DELETE FROM finance_receivables WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}

export async function getReceivableStats(startDate, endDate) {
  const params = [startDate, endDate]
  const dateFilter = dateRangeClause('finance_receivables', 1)

  const result = await query(
    `SELECT
      COUNT(*)::int AS total,
      COALESCE(SUM(amount), 0)::float AS total_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'received'), 0)::float AS received_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::float AS pending_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0)::float AS overdue_amount
     FROM finance_receivables
     WHERE ${dateFilter}`,
    params
  )
  return result.rows[0]
}

export async function getReceivableMonthlyBreakdown(startDate, endDate) {
  const result = await query(
    `SELECT
      TO_CHAR(transaction_date, 'YYYY-MM') AS period,
      COALESCE(SUM(amount), 0)::float AS total_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'received'), 0)::float AS settled_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::float AS pending_amount
     FROM finance_receivables
     WHERE transaction_date >= $1 AND transaction_date <= $2
     GROUP BY period
     ORDER BY period`,
    [startDate, endDate]
  )
  return result.rows
}
