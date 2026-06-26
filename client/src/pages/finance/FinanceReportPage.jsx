import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  FileSpreadsheet,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from '@/components/it/ItShared'
import { FinancePeriodFilter, getDefaultPeriod, periodToQuery, formatPeriodLabel } from '@/components/finance/FinancePeriodFilter'
import { financeApi } from '@/lib/api'
import { exportToExcel, formatCurrency, formatDate, formatLabel } from '@/lib/itUtils'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMonthPeriod(period) {
  if (!period) return period
  const [year, month] = period.split('-')
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
}

export function FinanceReportPage() {
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = useCallback(() => {
    if (period.periodType === 'range' && (!period.startDate || !period.endDate)) return

    setLoading(true)
    financeApi
      .getReport(periodToQuery(period))
      .then((res) => setReport(res.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false))
  }, [period])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const summary = report?.summary

  const statCards = summary
    ? [
        { label: 'Total Receivable', value: formatCurrency(summary.receivableTotal), icon: ArrowDownLeft },
        { label: 'Total Payable', value: formatCurrency(summary.payableTotal), icon: ArrowUpRight },
        { label: 'Net Cash Flow', value: formatCurrency(summary.netCashFlow), icon: summary.netCashFlow >= 0 ? TrendingUp : TrendingDown },
        { label: 'Net Outstanding', value: formatCurrency(summary.netOutstanding), icon: Scale },
      ]
    : []

  const handleExportBreakdown = () => {
    if (!report?.monthlyBreakdown?.length) return
    exportToExcel({
      filename: `finance-report-${formatPeriodLabel(period).replace(/\s+/g, '-')}.xlsx`,
      sheetName: 'Monthly Breakdown',
      columns: [
        { key: 'period', label: 'Period', getValue: (r) => formatMonthPeriod(r.period) },
        { key: 'receivableTotal', label: 'Receivable Total', getValue: (r) => formatCurrency(r.receivableTotal) },
        { key: 'receivableReceived', label: 'Received', getValue: (r) => formatCurrency(r.receivableReceived) },
        { key: 'receivablePending', label: 'Receivable Pending', getValue: (r) => formatCurrency(r.receivablePending) },
        { key: 'payableTotal', label: 'Payable Total', getValue: (r) => formatCurrency(r.payableTotal) },
        { key: 'payablePaid', label: 'Paid', getValue: (r) => formatCurrency(r.payablePaid) },
        { key: 'payablePending', label: 'Payable Pending', getValue: (r) => formatCurrency(r.payablePending) },
        { key: 'netReceived', label: 'Net Cash Flow', getValue: (r) => formatCurrency(r.netReceived) },
        { key: 'netOutstanding', label: 'Net Outstanding', getValue: (r) => formatCurrency(r.netOutstanding) },
      ],
      rows: report.monthlyBreakdown,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overall Account Report</h1>
          <p className="text-muted-foreground">
            Combined receivable & payable summary — {formatPeriodLabel(period)}
          </p>
        </div>
        <Button variant="outline" onClick={handleExportBreakdown} disabled={!report?.monthlyBreakdown?.length}>
          <FileSpreadsheet className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FinancePeriodFilter period={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading report...</p>
      ) : !report ? (
        <p className="text-sm text-muted-foreground">No report data available.</p>
      ) : (
        <>
          <StatsCards stats={statCards} />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  Receivable Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{formatCurrency(summary.receivableTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span className="font-medium text-green-700">{formatCurrency(summary.receivableReceived)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium text-amber-700">{formatCurrency(summary.receivablePending)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className="font-medium text-red-700">{formatCurrency(summary.receivableOverdue)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                  Payable Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{formatCurrency(summary.payableTotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-green-700">{formatCurrency(summary.payablePaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium text-amber-700">{formatCurrency(summary.payablePending)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Overdue</span><span className="font-medium text-red-700">{formatCurrency(summary.payableOverdue)}</span></div>
              </CardContent>
            </Card>
          </div>

          {report.monthlyBreakdown?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {period.periodType === 'year' ? 'Month-wise Breakdown' : 'Period Breakdown'}
                </CardTitle>
                <CardDescription>Receivable vs payable by month within selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[900px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-3 py-3 font-medium">Period</th>
                        <th className="px-3 py-3 font-medium">Receivable</th>
                        <th className="px-3 py-3 font-medium">Received</th>
                        <th className="px-3 py-3 font-medium">Recv. Pending</th>
                        <th className="px-3 py-3 font-medium">Payable</th>
                        <th className="px-3 py-3 font-medium">Paid</th>
                        <th className="px-3 py-3 font-medium">Pay. Pending</th>
                        <th className="px-3 py-3 font-medium">Net Cash Flow</th>
                        <th className="px-3 py-3 font-medium">Net Outstanding</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.monthlyBreakdown.map((row) => (
                        <tr key={row.period} className="border-b last:border-0">
                          <td className="px-3 py-3 font-medium">{formatMonthPeriod(row.period)}</td>
                          <td className="px-3 py-3">{formatCurrency(row.receivableTotal)}</td>
                          <td className="px-3 py-3 text-green-700">{formatCurrency(row.receivableReceived)}</td>
                          <td className="px-3 py-3 text-amber-700">{formatCurrency(row.receivablePending)}</td>
                          <td className="px-3 py-3">{formatCurrency(row.payableTotal)}</td>
                          <td className="px-3 py-3 text-green-700">{formatCurrency(row.payablePaid)}</td>
                          <td className="px-3 py-3 text-amber-700">{formatCurrency(row.payablePending)}</td>
                          <td className={`px-3 py-3 font-medium ${row.netReceived >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(row.netReceived)}
                          </td>
                          <td className={`px-3 py-3 font-medium ${row.netOutstanding >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(row.netOutstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="px-3 py-3">Total</td>
                        <td className="px-3 py-3">{formatCurrency(summary.receivableTotal)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.receivableReceived)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.receivablePending)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.payableTotal)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.payablePaid)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.payablePending)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.netCashFlow)}</td>
                        <td className="px-3 py-3">{formatCurrency(summary.netOutstanding)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receivable Entries</CardTitle>
                <CardDescription>{report.receivables?.length || 0} entries in period</CardDescription>
              </CardHeader>
              <CardContent>
                {report.receivables?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No receivables in this period.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80">
                        <tr className="text-left text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Party</th>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium">Amount</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.receivables.map((r) => (
                          <tr key={r.id} className="border-t">
                            <td className="px-3 py-2">{r.party_name}</td>
                            <td className="px-3 py-2">{formatDate(r.transaction_date)}</td>
                            <td className="px-3 py-2">{formatCurrency(r.amount)}</td>
                            <td className="px-3 py-2 capitalize">{formatLabel(r.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payable Entries</CardTitle>
                <CardDescription>{report.payables?.length || 0} entries in period</CardDescription>
              </CardHeader>
              <CardContent>
                {report.payables?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payables in this period.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80">
                        <tr className="text-left text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Party</th>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium">Amount</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.payables.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-3 py-2">{p.party_name}</td>
                            <td className="px-3 py-2">{formatDate(p.transaction_date)}</td>
                            <td className="px-3 py-2">{formatCurrency(p.amount)}</td>
                            <td className="px-3 py-2 capitalize">{formatLabel(p.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
