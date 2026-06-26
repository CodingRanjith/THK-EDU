import { useCallback, useEffect, useState } from 'react'
import {
  AppWindow,
  Edit,
  Eye,
  FileSpreadsheet,
  Key,
  Plus,
  Search,
  Trash2,
  CheckCircle,
  Clock,
  IndianRupee,
  Banknote,
} from 'lucide-react'
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
import { assetsApi } from '@/lib/api'
import { exportToExcel, formatCurrency, formatDate, formatLabel } from '@/lib/itUtils'
import { useAlert } from '@/context/AlertContext'

const EMPTY_FORM = {
  softwareName: '',
  vendor: '',
  version: '',
  licenseType: 'subscription',
  licenseKey: '',
  totalLicenses: '1',
  usedLicenses: '0',
  purchaseDate: '',
  expiryDate: '',
  cost: '',
  assignedTo: '',
  department: '',
  status: 'active',
  notes: '',
}

const LICENSE_TYPES = ['perpetual', 'subscription', 'open_source', 'trial']
const STATUSES = ['active', 'expired', 'trial', 'cancelled']

const EXPORT_COLUMNS = [
  { key: 'software_number', label: 'Software No' },
  { key: 'software_name', label: 'Software Name' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'version', label: 'Version' },
  { key: 'license_type', label: 'License Type', getValue: (r) => formatLabel(r.license_type) },
  { key: 'total_licenses', label: 'Total Licenses' },
  { key: 'used_licenses', label: 'Used Licenses' },
  { key: 'purchase_date', label: 'Purchase Date', getValue: (r) => formatDate(r.purchase_date) },
  { key: 'expiry_date', label: 'Expiry Date', getValue: (r) => formatDate(r.expiry_date) },
  { key: 'cost', label: 'Cost', getValue: (r) => formatCurrency(r.cost) },
  { key: 'assigned_to', label: 'Assigned To' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status', getValue: (r) => formatLabel(r.status) },
]

function mapToForm(item) {
  return {
    softwareName: item.software_name || '',
    vendor: item.vendor || '',
    version: item.version || '',
    licenseType: item.license_type || 'subscription',
    licenseKey: item.license_key || '',
    totalLicenses: String(item.total_licenses ?? 1),
    usedLicenses: String(item.used_licenses ?? 0),
    purchaseDate: item.purchase_date ? item.purchase_date.slice(0, 10) : '',
    expiryDate: item.expiry_date ? item.expiry_date.slice(0, 10) : '',
    cost: item.cost ?? '',
    assignedTo: item.assigned_to || '',
    department: item.department || '',
    status: item.status || 'active',
    notes: item.notes || '',
  }
}

export function SoftwareAssetsPage() {
  const { showSuccess, showError } = useAlert()
  const [software, setSoftware] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [licenseFilter, setLicenseFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      assetsApi.listSoftware({
        search: search || undefined,
        status: statusFilter || undefined,
        licenseType: licenseFilter || undefined,
      }),
      assetsApi.getSoftwareStats(),
    ])
      .then(([listRes, statsRes]) => {
        setSoftware(listRes.data.software)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
      })
      .catch(() => {
        setSoftware([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search, statusFilter, licenseFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setForm(EMPTY_FORM)
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
    if (!form.softwareName.trim()) {
      showError('Validation', 'Software name is required.')
      return
    }

    const totalLicenses = Number(form.totalLicenses) || 1
    const usedLicenses = Number(form.usedLicenses) || 0

    if (usedLicenses > totalLicenses) {
      showError('Validation', 'Used licenses cannot exceed total licenses.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        softwareName: form.softwareName.trim(),
        vendor: form.vendor || null,
        version: form.version || null,
        licenseType: form.licenseType,
        licenseKey: form.licenseKey || null,
        totalLicenses,
        usedLicenses,
        purchaseDate: form.purchaseDate || null,
        expiryDate: form.expiryDate || null,
        cost: form.cost ? Number(form.cost) : null,
        assignedTo: form.assignedTo || null,
        department: form.department || null,
        status: form.status,
        notes: form.notes || null,
      }

      if (modal.mode === 'edit') {
        await assetsApi.updateSoftware(modal.item.id, payload)
        showSuccess('Updated', 'Software record updated successfully.')
      } else {
        await assetsApi.createSoftware(payload)
        showSuccess('Created', 'Software record created successfully.')
      }

      closeModal()
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save software.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete software ${item.software_number}?`)) return
    try {
      await assetsApi.deleteSoftware(item.id)
      showSuccess('Deleted', `${item.software_number} has been removed.`)
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete software.')
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `software-assets-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Software',
      columns: EXPORT_COLUMNS,
      rows: software,
    })
  }

  const isView = modal.mode === 'view'

  const statCards = stats
    ? [
        { label: 'Total Software', value: stats.total, icon: AppWindow },
        { label: 'Total Software Cost', value: formatCurrency(stats.total_cost), icon: IndianRupee },
        { label: 'Active', value: stats.active, icon: CheckCircle },
        { label: 'Active Cost', value: formatCurrency(stats.active_cost), icon: Banknote },
        { label: 'Expired', value: stats.expired, icon: Clock },
        { label: 'Expired Cost', value: formatCurrency(stats.expired_cost), icon: IndianRupee },
        {
          label: 'Licenses Used',
          value: `${stats.used_licenses} / ${stats.total_licenses}`,
          icon: Key,
        },
        { label: 'Trial Cost', value: formatCurrency(stats.trial_cost), icon: Banknote },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Software Management</h1>
          <p className="text-muted-foreground">Manage licenses, subscriptions, and software inventory ({total} total)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Software
        </Button>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Software Assets</CardTitle>
          <CardDescription>Software numbers like SW-001, SW-002, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchData()
            }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, vendor, license key..."
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
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value)}
            >
              <option value="">All License Types</option>
              {LICENSE_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={software.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading software assets...</p>
          ) : software.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No software assets found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Software No</th>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Vendor</th>
                    <th className="px-3 py-3 font-medium">Version</th>
                    <th className="px-3 py-3 font-medium">License Type</th>
                    <th className="px-3 py-3 font-medium">Licenses</th>
                    <th className="px-3 py-3 font-medium">Expiry</th>
                    <th className="px-3 py-3 font-medium">Department</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {software.map((item, index) => (
                    <tr key={item.id} className="border-b align-middle last:border-0">
                      <td className="px-3 py-3 text-center font-medium text-muted-foreground">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono font-medium text-primary">
                        {item.software_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{item.software_name}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.vendor || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.version || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatLabel(item.license_type)}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {item.used_licenses} / {item.total_licenses}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDate(item.expiry_date)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.department || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => openView(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => handleDelete(item)}>
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
        title={
          modal.mode === 'create'
            ? 'Add Software'
            : modal.mode === 'edit'
              ? 'Edit Software'
              : 'View Software'
        }
        mode={modal.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {modal.mode !== 'create' && (
            <FormField label="Software Number">
              <FormInput value={modal.item?.software_number || ''} disabled />
            </FormField>
          )}
          <FormField label="Software Name" required>
            <FormInput
              value={form.softwareName}
              onChange={(e) => setForm({ ...form, softwareName: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Vendor">
            <FormInput value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Version">
            <FormInput value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="License Type">
            <FormSelect
              value={form.licenseType}
              onChange={(e) => setForm({ ...form, licenseType: e.target.value })}
              disabled={isView}
            >
              {LICENSE_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="License Key">
            <FormInput
              value={form.licenseKey}
              onChange={(e) => setForm({ ...form, licenseKey: e.target.value })}
              disabled={isView}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Total Licenses">
            <FormInput
              type="number"
              min="1"
              value={form.totalLicenses}
              onChange={(e) => setForm({ ...form, totalLicenses: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Used Licenses">
            <FormInput
              type="number"
              min="0"
              value={form.usedLicenses}
              onChange={(e) => setForm({ ...form, usedLicenses: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Purchase Date">
            <FormInput
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Expiry Date">
            <FormInput
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Cost">
            <FormInput
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Assigned To">
            <FormInput
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Department">
            <FormInput
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isView}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Notes" className="sm:col-span-2">
            <FormTextarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={isView}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  )
}
