import { useCallback, useEffect, useState } from 'react'
import { Edit, Eye, FileSpreadsheet, Plus, Search, Trash2, Users, UserCheck, UserX, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormModal,
  FormField,
  FormInput,
  FormSelect,
  StatsCards,
  StatusBadge,
} from '@/components/it/ItShared'
import { itApi } from '@/lib/api'
import { exportToExcel, formatCurrency, formatDate, formatLabel } from '@/lib/itUtils'
import { useAlert } from '@/context/AlertContext'

const EMPTY_FORM = {
  clientName: '',
  organization: '',
  paymentType: '',
  payment: '',
  city: '',
  country: '',
  gstNo: '',
  status: 'active',
  industry: '',
  category: '',
  leadSource: '',
}

const PAYMENT_TYPES = ['monthly', 'quarterly', 'yearly', 'one_time', 'milestone']
const STATUSES = ['active', 'inactive', 'prospect', 'on_hold']

const EXPORT_COLUMNS = [
  { key: 'client_number', label: 'Client Number' },
  { key: 'client_name', label: 'Client Name' },
  { key: 'organization', label: 'Organization' },
  { key: 'payment_type', label: 'Payment Type', getValue: (r) => formatLabel(r.payment_type) },
  { key: 'payment', label: 'Payment', getValue: (r) => formatCurrency(r.payment) },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'gst_no', label: 'GST No' },
  { key: 'status', label: 'Status', getValue: (r) => formatLabel(r.status) },
  { key: 'industry', label: 'Industry' },
  { key: 'category', label: 'Category' },
  { key: 'lead_source', label: 'Lead Source' },
]

export function ClientsPage() {
  const { showSuccess, showError } = useAlert()
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      itApi.listClients({
        search: search || undefined,
        status: statusFilter || undefined,
        paymentType: paymentTypeFilter || undefined,
      }),
      itApi.getClientStats(),
    ])
      .then(([listRes, statsRes]) => {
        setClients(listRes.data.clients)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
      })
      .catch(() => {
        setClients([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search, statusFilter, paymentTypeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModal({ open: true, mode: 'create', item: null })
  }

  const openView = (item) => {
    setForm(mapClientToForm(item))
    setModal({ open: true, mode: 'view', item })
  }

  const openEdit = (item) => {
    setForm(mapClientToForm(item))
    setModal({ open: true, mode: 'edit', item })
  }

  const closeModal = () => setModal({ open: false, mode: 'create', item: null })

  const handleSubmit = async () => {
    if (!form.clientName.trim()) {
      showError('Validation', 'Client name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        clientName: form.clientName.trim(),
        organization: form.organization || null,
        paymentType: form.paymentType || null,
        payment: form.payment ? Number(form.payment) : null,
        city: form.city || null,
        country: form.country || null,
        gstNo: form.gstNo || null,
        status: form.status,
        industry: form.industry || null,
        category: form.category || null,
        leadSource: form.leadSource || null,
      }

      if (modal.mode === 'edit') {
        await itApi.updateClient(modal.item.id, payload)
        showSuccess('Updated', 'Client updated successfully.')
      } else {
        await itApi.createClient(payload)
        showSuccess('Created', 'Client created successfully.')
      }

      closeModal()
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save client.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete client ${item.client_number}?`)) return

    try {
      await itApi.deleteClient(item.id)
      showSuccess('Deleted', `${item.client_number} has been removed.`)
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete client.')
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `it-clients-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Clients',
      columns: EXPORT_COLUMNS,
      rows: clients,
    })
  }

  const isView = modal.mode === 'view'

  const statCards = stats
    ? [
        { label: 'Total Clients', value: stats.total, icon: Users },
        { label: 'Active', value: stats.active, icon: UserCheck },
        { label: 'Prospects', value: stats.prospect, icon: UserPlus },
        { label: 'Inactive', value: stats.inactive, icon: UserX },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Clients</h1>
          <p className="text-muted-foreground">Manage client records ({total} total)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Clients</CardTitle>
          <CardDescription>Client numbers like CL-001, CL-002, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchData()
            }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, number, organization..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
            >
              <option value="">All Payment Types</option>
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={clients.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading clients...</p>
          ) : clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No clients found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Client Number</th>
                    <th className="px-3 py-3 font-medium">Client Name</th>
                    <th className="px-3 py-3 font-medium">Organization</th>
                    <th className="px-3 py-3 font-medium">Payment Type</th>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 font-medium">City</th>
                    <th className="px-3 py-3 font-medium">Country</th>
                    <th className="px-3 py-3 font-medium">GST No</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Industry</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Lead Source</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, index) => (
                    <tr key={client.id} className="border-b last:border-0 align-middle">
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-primary whitespace-nowrap">
                        {client.client_number}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.client_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.organization || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatLabel(client.payment_type)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(client.payment)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.city || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.country || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.gst_no || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.industry || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.category || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{client.lead_source || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => openView(client)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => handleDelete(client)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      <FormModal
        open={modal.open}
        title={modal.mode === 'create' ? 'Add Client' : modal.mode === 'edit' ? 'Edit Client' : 'View Client'}
        mode={modal.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {modal.mode !== 'create' && (
            <FormField label="Client Number">
              <FormInput value={modal.item?.client_number || ''} disabled />
            </FormField>
          )}
          <FormField label="Client Name" required>
            <FormInput
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Organization">
            <FormInput
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Payment Type">
            <FormSelect
              value={form.paymentType}
              onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              disabled={isView}
            >
              <option value="">Select type</option>
              {PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Payment">
            <FormInput
              type="number"
              value={form.payment}
              onChange={(e) => setForm({ ...form, payment: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="City">
            <FormInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Country">
            <FormInput value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="GST No">
            <FormInput value={form.gstNo} onChange={(e) => setForm({ ...form, gstNo: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isView}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Industry">
            <FormInput value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Category">
            <FormInput value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Lead Source">
            <FormInput value={form.leadSource} onChange={(e) => setForm({ ...form, leadSource: e.target.value })} disabled={isView} />
          </FormField>
        </div>
      </FormModal>
    </div>
  )
}

function mapClientToForm(client) {
  return {
    clientName: client.client_name || '',
    organization: client.organization || '',
    paymentType: client.payment_type || '',
    payment: client.payment ?? '',
    city: client.city || '',
    country: client.country || '',
    gstNo: client.gst_no || '',
    status: client.status || 'active',
    industry: client.industry || '',
    category: client.category || '',
    leadSource: client.lead_source || '',
  }
}
