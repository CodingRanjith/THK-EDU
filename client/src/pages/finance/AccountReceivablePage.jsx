import { useCallback, useEffect, useState } from 'react'
import { Edit, Eye, FileSpreadsheet, Plus, Search, Trash2, ArrowDownLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormModal,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  StatsCards,
  StatusBadge,
} from '@/components/it/ItShared'
import { FinancePeriodFilter, getDefaultPeriod, periodToQuery, formatPeriodLabel } from '@/components/finance/FinancePeriodFilter'
import { financeApi } from '@/lib/api'
import { exportToExcel, formatCurrency, formatDate, formatLabel } from '@/lib/itUtils'
import { useAlert } from '@/context/AlertContext'

const EMPTY_FORM = {
  partyName: '',
  invoiceNumber: '',
  description: '',
  amount: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  settledDate: '',
  status: 'pending',
  category: '',
  paymentMethod: '',
  notes: '',
}

const STATUSES = ['pending', 'received', 'overdue', 'cancelled']
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'cheque', 'upi', 'card', 'other']

const EXPORT_COLUMNS = [
  { key: 'entry_number', label: 'Entry No' },
  { key: 'party_name', label: 'Party / Client' },
  { key: 'invoice_number', label: 'Invoice No' },
  { key: 'amount', label: 'Amount', getValue: (r) => formatCurrency(r.amount) },
  { key: 'transaction_date', label: 'Date', getValue: (r) => formatDate(r.transaction_date) },
  { key: 'due_date', label: 'Due Date', getValue: (r) => formatDate(r.due_date) },
  { key: 'settled_date', label: 'Received Date', getValue: (r) => formatDate(r.settled_date) },
  { key: 'status', label: 'Status', getValue: (r) => formatLabel(r.status) },
  { key: 'category', label: 'Category' },
]

function mapToForm(entry) {
  return {
    partyName: entry.party_name || '',
    invoiceNumber: entry.invoice_number || '',
    description: entry.description || '',
    amount: entry.amount ?? '',
    transactionDate: entry.transaction_date ? entry.transaction_date.slice(0, 10) : '',
    dueDate: entry.due_date ? entry.due_date.slice(0, 10) : '',
    settledDate: entry.settled_date ? entry.settled_date.slice(0, 10) : '',
    status: entry.status || 'pending',
    category: entry.category || '',
    paymentMethod: entry.payment_method || '',
    notes: entry.notes || '',
  }
}

export function AccountReceivablePage() {
  const { showSuccess, showError } = useAlert()
  const [period, setPeriod] = useState(getDefaultPeriod)
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    if (period.periodType === 'range' && (!period.startDate || !period.endDate)) return

    setLoading(true)
    const query = { ...periodToQuery(period), search: search || undefined, status: statusFilter || undefined }

    Promise.all([financeApi.listReceivables(query), financeApi.getReceivableStats(query)])
      .then(([listRes, statsRes]) => {
        setEntries(listRes.data.entries)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
      })
      .catch(() => {
        setEntries([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [period, search, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, transactionDate: new Date().toISOString().slice(0, 10) })
    setModal({ open: true, mode: 'create', item: null })
  }

  const openView = (item) => {
    setForm(mapToForm(item))
    setModal({ open: true, mode: 'view', item })
  }

  const openEdit = (item) => {
    setForm(mapToForm(item))
    setModal({ open: true, mode: 'edit', item })
  }

  const closeModal = () => setModal({ open: false, mode: 'create', item: null })

  const handleSubmit = async () => {
    if (!form.partyName.trim()) {
      showError('Validation', 'Party name is required.')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      showError('Validation', 'Valid amount is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        partyName: form.partyName.trim(),
        invoiceNumber: form.invoiceNumber || null,
        description: form.description || null,
        amount: Number(form.amount),
        transactionDate: form.transactionDate,
        dueDate: form.dueDate || null,
        settledDate: form.settledDate || null,
        status: form.status,
        category: form.category || null,
        paymentMethod: form.paymentMethod || null,
        notes: form.notes || null,
      }

      if (modal.mode === 'edit') {
        await financeApi.updateReceivable(modal.item.id, payload)
        showSuccess('Updated', 'Receivable entry updated.')
      } else {
        await financeApi.createReceivable(payload)
        showSuccess('Created', 'Receivable entry created.')
      }
      closeModal()
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save entry.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete entry ${item.entry_number}?`)) return
    try {
      await financeApi.deleteReceivable(item.id)
      showSuccess('Deleted', 'Entry removed.')
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete entry.')
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `receivables-${formatPeriodLabel(period).replace(/\s+/g, '-')}.xlsx`,
      sheetName: 'Receivables',
      columns: EXPORT_COLUMNS,
      rows: entries,
    })
  }

  const isView = modal.mode === 'view'

  const statCards = stats
    ? [
        { label: 'Total Receivable', value: formatCurrency(stats.total_amount), icon: ArrowDownLeft },
        { label: 'Received', value: formatCurrency(stats.received_amount), icon: CheckCircle },
        { label: 'Pending', value: formatCurrency(stats.pending_amount), icon: Clock },
        { label: 'Overdue', value: formatCurrency(stats.overdue_amount), icon: AlertCircle },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Receivable</h1>
          <p className="text-muted-foreground">Track money owed to your organization — {formatPeriodLabel(period)}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Receivable
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FinancePeriodFilter period={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receivable Entries</CardTitle>
          <CardDescription>{total} entries · AR-001, AR-002, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchData() }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search party, invoice..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={entries.length === 0}>
              <FileSpreadsheet className="h-4 w-4" /> Export
            </Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No receivable entries for this period.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Entry No</th>
                    <th className="px-3 py-3 font-medium">Party / Client</th>
                    <th className="px-3 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Due</th>
                    <th className="px-3 py-3 font-medium">Received</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="px-3 py-3 font-mono text-primary">{entry.entry_number}</td>
                      <td className="px-3 py-3 font-medium">{entry.party_name}</td>
                      <td className="px-3 py-3">{entry.invoice_number || '—'}</td>
                      <td className="px-3 py-3 font-medium">{formatCurrency(entry.amount)}</td>
                      <td className="px-3 py-3">{formatDate(entry.transaction_date)}</td>
                      <td className="px-3 py-3">{formatDate(entry.due_date)}</td>
                      <td className="px-3 py-3">{formatDate(entry.settled_date)}</td>
                      <td className="px-3 py-3"><StatusBadge status={entry.status} /></td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openView(entry)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(entry)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormModal open={modal.open} title={modal.mode === 'create' ? 'Add Receivable' : modal.mode === 'edit' ? 'Edit Receivable' : 'View Receivable'} mode={modal.mode} onClose={closeModal} onSubmit={handleSubmit} submitting={submitting} size="xl">
        <div className="grid gap-4 sm:grid-cols-2">
          {modal.mode !== 'create' && (
            <FormField label="Entry Number"><FormInput value={modal.item?.entry_number || ''} disabled /></FormField>
          )}
          <FormField label="Party / Client Name" required>
            <FormInput value={form.partyName} onChange={(e) => setForm({ ...form, partyName: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Invoice Number">
            <FormInput value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Amount" required>
            <FormInput type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Transaction Date" required>
            <FormInput type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Due Date">
            <FormInput type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Received Date">
            <FormInput type="date" value={form.settledDate} onChange={(e) => setForm({ ...form, settledDate: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isView}>
              {STATUSES.map((s) => <option key={s} value={s}>{formatLabel(s)}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Category">
            <FormInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={isView} placeholder="e.g. Services, Product" />
          </FormField>
          <FormField label="Payment Method">
            <FormSelect value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} disabled={isView}>
              <option value="">Select</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{formatLabel(m)}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <FormTextarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <FormTextarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} disabled={isView} />
          </FormField>
        </div>
      </FormModal>
    </div>
  )
}
