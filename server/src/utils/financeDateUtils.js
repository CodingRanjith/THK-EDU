export function resolveDateRange({ periodType = 'month', year, month, startDate, endDate }) {
  const now = new Date()
  const y = parseInt(year, 10) || now.getFullYear()

  if (periodType === 'year') {
    return {
      periodType: 'year',
      year: y,
      month: null,
      startDate: `${y}-01-01`,
      endDate: `${y}-12-31`,
    }
  }

  if (periodType === 'range' && startDate && endDate) {
    return {
      periodType: 'range',
      year: y,
      month: null,
      startDate: startDate.slice(0, 10),
      endDate: endDate.slice(0, 10),
    }
  }

  const m = parseInt(month, 10) || now.getMonth() + 1
  const lastDay = new Date(y, m, 0).getDate()

  return {
    periodType: 'month',
    year: y,
    month: m,
    startDate: `${y}-${String(m).padStart(2, '0')}-01`,
    endDate: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function dateRangeClause(alias, startIdx) {
  return `${alias}.transaction_date >= $${startIdx} AND ${alias}.transaction_date <= $${startIdx + 1}`
}
