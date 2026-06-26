import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { hrApi } from '@/lib/api'
import { useAlert } from '@/context/AlertContext'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function computeTotals(records, employeeId, days) {
  let present = 0
  let absent = 0

  for (const day of days) {
    const status = records[employeeId]?.[day.date]
    if (status === 'present') present++
    else if (status === 'absent') absent++
  }

  return { present, absent, marked: present + absent }
}

function nextStatus(current) {
  if (!current) return 'present'
  if (current === 'present') return 'absent'
  return null
}

export function AttendancePage() {
  const { showError } = useAlert()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState({})
  const [days, setDays] = useState([])
  const [daysInMonth, setDaysInMonth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingCell, setSavingCell] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    hrApi
      .getMonthlyAttendance({ year, month })
      .then((res) => {
        setEmployees(res.data.employees)
        setRecords(res.data.records)
        setDays(res.data.days)
        setDaysInMonth(res.data.daysInMonth)
      })
      .catch(() => {
        setEmployees([])
        setRecords({})
        setDays([])
      })
      .finally(() => setLoading(false))
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const handleCellClick = async (employeeId, date) => {
    const current = records[employeeId]?.[date] || null
    const next = nextStatus(current)
    const cellKey = `${employeeId}-${date}`

    setRecords((prev) => {
      const empRecords = { ...(prev[employeeId] || {}) }
      if (next) empRecords[date] = next
      else delete empRecords[date]
      return { ...prev, [employeeId]: empRecords }
    })

    setSavingCell(cellKey)
    try {
      await hrApi.setAttendance({ employeeId, date, status: next })
    } catch (err) {
      setRecords((prev) => {
        const empRecords = { ...(prev[employeeId] || {}) }
        if (current) empRecords[date] = current
        else delete empRecords[date]
        return { ...prev, [employeeId]: empRecords }
      })
      showError(err.response?.data?.message || 'Failed to save attendance')
    } finally {
      setSavingCell(null)
    }
  }

  const monthSummary = useMemo(() => {
    let totalPresent = 0
    let totalAbsent = 0
    for (const emp of employees) {
      const t = computeTotals(records, emp.id, days)
      totalPresent += t.present
      totalAbsent += t.absent
    }
    return { totalPresent, totalAbsent }
  }, [employees, records, days])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">
            Manual month-wise attendance sheet — click cells to mark Present (P) or Absent (A)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              {MONTHS.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none"
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-green-100 font-bold text-green-700">P</span>
          Present
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-100 font-bold text-red-700">A</span>
          Absent
        </span>
        <span className="text-muted-foreground">
          Click empty → P → A → clear
        </span>
        <span className="ml-auto text-muted-foreground">
          Month total: {daysInMonth} days · P: {monthSummary.totalPresent} · A: {monthSummary.totalAbsent}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {MONTHS[month - 1]} {year} Attendance Sheet
          </CardTitle>
          <CardDescription>
            Employees on the left, daily attendance across the month, totals on the right
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading attendance...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active employees. Add employees in Employee Management first.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-max border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 z-20 min-w-[180px] border-b border-r bg-muted/95 px-3 py-2 text-left font-semibold">
                      Employee
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.date}
                        className={cn(
                          'min-w-[36px] border-b px-0.5 py-2 text-center font-medium',
                          day.isWeekend && 'bg-muted/30 text-muted-foreground'
                        )}
                        title={`${day.weekday}, ${day.date}`}
                      >
                        <div>{day.day}</div>
                        <div className="text-[10px] font-normal opacity-70">{day.weekday}</div>
                      </th>
                    ))}
                    <th className="sticky right-[72px] z-10 min-w-[44px] border-b border-l bg-green-50 px-2 py-2 text-center font-semibold text-green-700">
                      P
                    </th>
                    <th className="sticky right-[36px] z-10 min-w-[44px] border-b bg-red-50 px-2 py-2 text-center font-semibold text-red-700">
                      A
                    </th>
                    <th className="sticky right-0 z-10 min-w-[44px] border-b border-l bg-muted/80 px-2 py-2 text-center font-semibold">
                      Days
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const totals = computeTotals(records, emp.id, days)
                    return (
                      <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="sticky left-0 z-10 border-r bg-card px-3 py-2">
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {emp.employee_code}
                            {emp.department ? ` · ${emp.department}` : ''}
                          </div>
                        </td>
                        {days.map((day) => {
                          const status = records[emp.id]?.[day.date]
                          const cellKey = `${emp.id}-${day.date}`
                          const isSaving = savingCell === cellKey

                          return (
                            <td
                              key={day.date}
                              className={cn(
                                'border-r p-0.5 text-center',
                                day.isWeekend && 'bg-muted/10'
                              )}
                            >
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleCellClick(emp.id, day.date)}
                                className={cn(
                                  'flex h-8 w-full items-center justify-center rounded text-xs font-bold transition-colors',
                                  !status && 'hover:bg-muted text-transparent hover:text-muted-foreground',
                                  status === 'present' && 'bg-green-100 text-green-700 hover:bg-green-200',
                                  status === 'absent' && 'bg-red-100 text-red-700 hover:bg-red-200',
                                  isSaving && 'opacity-50'
                                )}
                                title={`${emp.name} — ${day.date}: click to mark`}
                              >
                                {status === 'present' ? 'P' : status === 'absent' ? 'A' : '·'}
                              </button>
                            </td>
                          )
                        })}
                        <td className="sticky right-[72px] z-10 border-l bg-green-50/80 px-2 py-2 text-center font-bold text-green-700">
                          {totals.present}
                        </td>
                        <td className="sticky right-[36px] z-10 bg-red-50/80 px-2 py-2 text-center font-bold text-red-700">
                          {totals.absent}
                        </td>
                        <td className="sticky right-0 z-10 border-l bg-muted/50 px-2 py-2 text-center font-semibold">
                          {daysInMonth}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 font-semibold">
                    <td className="sticky left-0 z-10 border-r border-t bg-muted/90 px-3 py-2">
                      Month Totals
                    </td>
                    {days.map((day) => {
                      let p = 0
                      let a = 0
                      for (const emp of employees) {
                        const s = records[emp.id]?.[day.date]
                        if (s === 'present') p++
                        else if (s === 'absent') a++
                      }
                      return (
                        <td
                          key={day.date}
                          className={cn(
                            'border-t px-0.5 py-1 text-center text-[10px]',
                            day.isWeekend && 'bg-muted/20'
                          )}
                          title={`Day ${day.day}: ${p} present, ${a} absent`}
                        >
                          {p > 0 || a > 0 ? (
                            <span>
                              <span className="text-green-700">{p}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-red-700">{a}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )
                    })}
                    <td className="sticky right-[72px] z-10 border-l border-t bg-green-100 px-2 py-2 text-center text-green-800">
                      {monthSummary.totalPresent}
                    </td>
                    <td className="sticky right-[36px] z-10 border-t bg-red-100 px-2 py-2 text-center text-red-800">
                      {monthSummary.totalAbsent}
                    </td>
                    <td className="sticky right-0 z-10 border-l border-t bg-muted/70 px-2 py-2 text-center">
                      {daysInMonth}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
