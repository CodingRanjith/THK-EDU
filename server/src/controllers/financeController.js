import {
  createReceivable,
  listReceivables,
  getReceivableById,
  updateReceivable,
  deleteReceivable,
  getReceivableStats,
  getReceivableMonthlyBreakdown,
} from '../models/financeReceivableModel.js'
import {
  createPayable,
  listPayables,
  getPayableById,
  updatePayable,
  deletePayable,
  getPayableStats,
  getPayableMonthlyBreakdown,
} from '../models/financePayableModel.js'
import { resolveDateRange } from '../utils/financeDateUtils.js'

const RECEIVABLE_STATUSES = ['pending', 'received', 'overdue', 'cancelled']
const PAYABLE_STATUSES = ['pending', 'paid', 'overdue', 'cancelled']

function getFiltersFromQuery(query) {
  const range = resolveDateRange({
    periodType: query.periodType,
    year: query.year,
    month: query.month,
    startDate: query.startDate,
    endDate: query.endDate,
  })

  return {
    search: query.search,
    status: query.status,
    startDate: range.startDate,
    endDate: range.endDate,
    range,
  }
}

function mapReceivableBody(body) {
  return {
    partyName: body.partyName?.trim(),
    invoiceNumber: body.invoiceNumber,
    description: body.description,
    amount: body.amount,
    transactionDate: body.transactionDate,
    dueDate: body.dueDate,
    settledDate: body.settledDate,
    status: body.status,
    category: body.category,
    paymentMethod: body.paymentMethod,
    notes: body.notes,
  }
}

function mapPayableBody(body) {
  return mapReceivableBody(body)
}

export async function getReceivablesList(req, res) {
  const filters = getFiltersFromQuery(req.query)
  const data = await listReceivables(filters)
  return res.json({ ...data, period: filters.range })
}

export async function getReceivablesStats(req, res) {
  const { startDate, endDate, range } = getFiltersFromQuery(req.query)
  const stats = await getReceivableStats(startDate, endDate)
  return res.json({ stats, period: range })
}

export async function getReceivable(req, res) {
  const entry = await getReceivableById(req.params.id)
  if (!entry) return res.status(404).json({ message: 'Receivable entry not found' })
  return res.json({ entry })
}

export async function createReceivableHandler(req, res) {
  const data = mapReceivableBody(req.body)

  if (!data.partyName) {
    return res.status(400).json({ message: 'Party name is required' })
  }
  if (!data.amount || Number(data.amount) <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' })
  }
  if (!data.transactionDate) {
    return res.status(400).json({ message: 'Transaction date is required' })
  }
  if (data.status && !RECEIVABLE_STATUSES.includes(data.status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }

  const entry = await createReceivable(data)
  return res.status(201).json({ message: 'Receivable created', entry })
}

export async function updateReceivableHandler(req, res) {
  const data = mapReceivableBody(req.body)

  if (!data.partyName) {
    return res.status(400).json({ message: 'Party name is required' })
  }
  if (!data.amount || Number(data.amount) <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' })
  }
  if (!data.transactionDate) {
    return res.status(400).json({ message: 'Transaction date is required' })
  }

  const entry = await updateReceivable(req.params.id, data)
  if (!entry) return res.status(404).json({ message: 'Receivable entry not found' })
  return res.json({ message: 'Receivable updated', entry })
}

export async function removeReceivable(req, res) {
  const deleted = await deleteReceivable(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Receivable entry not found' })
  return res.json({ message: 'Receivable deleted' })
}

export async function getPayablesList(req, res) {
  const filters = getFiltersFromQuery(req.query)
  const data = await listPayables(filters)
  return res.json({ ...data, period: filters.range })
}

export async function getPayablesStats(req, res) {
  const { startDate, endDate, range } = getFiltersFromQuery(req.query)
  const stats = await getPayableStats(startDate, endDate)
  return res.json({ stats, period: range })
}

export async function getPayable(req, res) {
  const entry = await getPayableById(req.params.id)
  if (!entry) return res.status(404).json({ message: 'Payable entry not found' })
  return res.json({ entry })
}

export async function createPayableHandler(req, res) {
  const data = mapPayableBody(req.body)

  if (!data.partyName) {
    return res.status(400).json({ message: 'Party name is required' })
  }
  if (!data.amount || Number(data.amount) <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' })
  }
  if (!data.transactionDate) {
    return res.status(400).json({ message: 'Transaction date is required' })
  }
  if (data.status && !PAYABLE_STATUSES.includes(data.status)) {
    return res.status(400).json({ message: 'Invalid status' })
  }

  const entry = await createPayable(data)
  return res.status(201).json({ message: 'Payable created', entry })
}

export async function updatePayableHandler(req, res) {
  const data = mapPayableBody(req.body)

  if (!data.partyName) {
    return res.status(400).json({ message: 'Party name is required' })
  }
  if (!data.amount || Number(data.amount) <= 0) {
    return res.status(400).json({ message: 'Valid amount is required' })
  }
  if (!data.transactionDate) {
    return res.status(400).json({ message: 'Transaction date is required' })
  }

  const entry = await updatePayable(req.params.id, data)
  if (!entry) return res.status(404).json({ message: 'Payable entry not found' })
  return res.json({ message: 'Payable updated', entry })
}

export async function removePayable(req, res) {
  const deleted = await deletePayable(req.params.id)
  if (!deleted) return res.status(404).json({ message: 'Payable entry not found' })
  return res.json({ message: 'Payable deleted' })
}

export async function getFinanceReport(req, res) {
  const { startDate, endDate, range } = getFiltersFromQuery(req.query)

  const [receivableStats, payableStats, receivables, payables, receivableMonths, payableMonths] =
    await Promise.all([
      getReceivableStats(startDate, endDate),
      getPayableStats(startDate, endDate),
      listReceivables({ startDate, endDate }),
      listPayables({ startDate, endDate }),
      getReceivableMonthlyBreakdown(startDate, endDate),
      getPayableMonthlyBreakdown(startDate, endDate),
    ])

  const monthMap = new Map()

  for (const row of receivableMonths) {
    monthMap.set(row.period, {
      period: row.period,
      receivableTotal: Number(row.total_amount),
      receivableReceived: Number(row.settled_amount),
      receivablePending: Number(row.pending_amount),
      payableTotal: 0,
      payablePaid: 0,
      payablePending: 0,
    })
  }

  for (const row of payableMonths) {
    const existing = monthMap.get(row.period) || {
      period: row.period,
      receivableTotal: 0,
      receivableReceived: 0,
      receivablePending: 0,
      payableTotal: 0,
      payablePaid: 0,
      payablePending: 0,
    }
    existing.payableTotal = Number(row.total_amount)
    existing.payablePaid = Number(row.settled_amount)
    existing.payablePending = Number(row.pending_amount)
    monthMap.set(row.period, existing)
  }

  const monthlyBreakdown = [...monthMap.values()]
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((row) => ({
      ...row,
      netReceived: row.receivableReceived - row.payablePaid,
      netOutstanding: row.receivablePending - row.payablePending,
    }))

  const summary = {
    receivableTotal: Number(receivableStats.total_amount),
    receivableReceived: Number(receivableStats.received_amount),
    receivablePending: Number(receivableStats.pending_amount),
    receivableOverdue: Number(receivableStats.overdue_amount),
    payableTotal: Number(payableStats.total_amount),
    payablePaid: Number(payableStats.paid_amount),
    payablePending: Number(payableStats.pending_amount),
    payableOverdue: Number(payableStats.overdue_amount),
    netCashFlow: Number(receivableStats.received_amount) - Number(payableStats.paid_amount),
    netOutstanding: Number(receivableStats.pending_amount) - Number(payableStats.pending_amount),
  }

  return res.json({
    summary,
    monthlyBreakdown,
    receivables: receivables.entries,
    payables: payables.entries,
    period: range,
  })
}
