import { FilterBar } from '@/components/ui/page'
import { fieldClassName } from '@/components/ui/input'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getDefaultPeriod() {
  const now = new Date()
  return {
    periodType: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    startDate: '',
    endDate: '',
  }
}

export function periodToQuery(period) {
  const query = { periodType: period.periodType, year: period.year }

  if (period.periodType === 'month') {
    query.month = period.month
  }

  if (period.periodType === 'range') {
    query.startDate = period.startDate
    query.endDate = period.endDate
  }

  return query
}

export function formatPeriodLabel(period) {
  if (!period) return ''

  if (period.periodType === 'month') {
    return `${MONTHS[(period.month || 1) - 1]} ${period.year}`
  }
  if (period.periodType === 'year') {
    return `Year ${period.year}`
  }
  if (period.startDate && period.endDate) {
    return `${period.startDate} to ${period.endDate}`
  }
  return 'Custom range'
}

export function FinancePeriodFilter({ period, onChange, className = '' }) {
  const years = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i)

  return (
    <FilterBar className={className}>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Period</label>
        <select
          className={fieldClassName}
          value={period.periodType}
          onChange={(e) => onChange({ ...period, periodType: e.target.value })}
        >
          <option value="month">Month wise</option>
          <option value="year">Year wise</option>
          <option value="range">Start to End Date</option>
        </select>
      </div>

      {period.periodType === 'month' && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Month</label>
            <select
              className={fieldClassName}
              value={period.month}
              onChange={(e) => onChange({ ...period, month: Number(e.target.value) })}
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
            <select
              className={fieldClassName}
              value={period.year}
              onChange={(e) => onChange({ ...period, year: Number(e.target.value) })}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {period.periodType === 'year' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
          <select
            className={fieldClassName}
            value={period.year}
            onChange={(e) => onChange({ ...period, year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {period.periodType === 'range' && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</label>
            <input
              type="date"
              className={fieldClassName}
              value={period.startDate}
              onChange={(e) => onChange({ ...period, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End Date</label>
            <input
              type="date"
              className={fieldClassName}
              value={period.endDate}
              onChange={(e) => onChange({ ...period, endDate: e.target.value })}
            />
          </div>
        </>
      )}
    </FilterBar>
  )
}
