import { useCallback, useEffect, useState } from 'react'
import {
  Edit,
  Eye,
  FileSpreadsheet,
  HardDrive,
  Monitor,
  Plus,
  Search,
  Trash2,
  Wrench,
  Package,
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
  assetName: '',
  category: 'laptop',
  brand: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  purchaseCost: '',
  warrantyExpiry: '',
  assignedTo: '',
  location: '',
  status: 'available',
  condition: 'good',
  notes: '',
}

const CATEGORIES = ['laptop', 'desktop', 'monitor', 'printer', 'server', 'network', 'mobile', 'other']
const STATUSES = ['available', 'assigned', 'in_repair', 'retired', 'lost']
const CONDITIONS = ['new', 'good', 'fair', 'poor']

const EXPORT_COLUMNS = [
  { key: 'asset_number', label: 'Asset Number' },
  { key: 'asset_name', label: 'Asset Name' },
  { key: 'category', label: 'Category', getValue: (r) => formatLabel(r.category) },
  { key: 'brand', label: 'Brand' },
  { key: 'model', label: 'Model' },
  { key: 'serial_number', label: 'Serial Number' },
  { key: 'purchase_date', label: 'Purchase Date', getValue: (r) => formatDate(r.purchase_date) },
  { key: 'purchase_cost', label: 'Cost', getValue: (r) => formatCurrency(r.purchase_cost) },
  { key: 'warranty_expiry', label: 'Warranty Expiry', getValue: (r) => formatDate(r.warranty_expiry) },
  { key: 'assigned_to', label: 'Assigned To' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status', getValue: (r) => formatLabel(r.status) },
  { key: 'condition', label: 'Condition', getValue: (r) => formatLabel(r.condition) },
]

function mapToForm(asset) {
  return {
    assetName: asset.asset_name || '',
    category: asset.category || 'other',
    brand: asset.brand || '',
    model: asset.model || '',
    serialNumber: asset.serial_number || '',
    purchaseDate: asset.purchase_date ? asset.purchase_date.slice(0, 10) : '',
    purchaseCost: asset.purchase_cost ?? '',
    warrantyExpiry: asset.warranty_expiry ? asset.warranty_expiry.slice(0, 10) : '',
    assignedTo: asset.assigned_to || '',
    location: asset.location || '',
    status: asset.status || 'available',
    condition: asset.condition || 'good',
    notes: asset.notes || '',
  }
}

export function HardwareAssetsPage() {
  const { showSuccess, showError } = useAlert()
  const [assets, setAssets] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      assetsApi.listHardware({
        search: search || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      }),
      assetsApi.getHardwareStats(),
    ])
      .then(([listRes, statsRes]) => {
        setAssets(listRes.data.assets)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
      })
      .catch(() => {
        setAssets([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search, statusFilter, categoryFilter])

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
    if (!form.assetName.trim()) {
      showError('Validation', 'Asset name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        assetName: form.assetName.trim(),
        category: form.category,
        brand: form.brand || null,
        model: form.model || null,
        serialNumber: form.serialNumber || null,
        purchaseDate: form.purchaseDate || null,
        purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : null,
        warrantyExpiry: form.warrantyExpiry || null,
        assignedTo: form.assignedTo || null,
        location: form.location || null,
        status: form.status,
        condition: form.condition,
        notes: form.notes || null,
      }

      if (modal.mode === 'edit') {
        await assetsApi.updateHardware(modal.item.id, payload)
        showSuccess('Updated', 'Hardware asset updated successfully.')
      } else {
        await assetsApi.createHardware(payload)
        showSuccess('Created', 'Hardware asset created successfully.')
      }

      closeModal()
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save asset.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete asset ${item.asset_number}?`)) return
    try {
      await assetsApi.deleteHardware(item.id)
      showSuccess('Deleted', `${item.asset_number} has been removed.`)
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete asset.')
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `hardware-assets-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Hardware',
      columns: EXPORT_COLUMNS,
      rows: assets,
    })
  }

  const isView = modal.mode === 'view'

  const statCards = stats
    ? [
        { label: 'Total Assets', value: stats.total, icon: HardDrive },
        { label: 'Available', value: stats.available, icon: Package },
        { label: 'Assigned', value: stats.assigned, icon: Monitor },
        { label: 'In Repair', value: stats.in_repair, icon: Wrench },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets & Hardware Management</h1>
          <p className="text-muted-foreground">Track laptops, devices, and physical IT assets ({total} total)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Hardware
        </Button>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Hardware Assets</CardTitle>
          <CardDescription>Asset numbers like HW-001, HW-002, etc.</CardDescription>
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
                placeholder="Search name, number, serial, assigned to..."
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{formatLabel(c)}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={assets.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading hardware assets...</p>
          ) : assets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No hardware assets found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Asset No</th>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Brand / Model</th>
                    <th className="px-3 py-3 font-medium">Serial</th>
                    <th className="px-3 py-3 font-medium">Assigned To</th>
                    <th className="px-3 py-3 font-medium">Location</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Condition</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, index) => (
                    <tr key={asset.id} className="border-b align-middle last:border-0">
                      <td className="px-3 py-3 text-center font-medium text-muted-foreground">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono font-medium text-primary">
                        {asset.asset_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{asset.asset_name}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatLabel(asset.category)}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {[asset.brand, asset.model].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{asset.serial_number || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{asset.assigned_to || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">{asset.location || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 capitalize">{asset.condition}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => openView(asset)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(asset)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => handleDelete(asset)}>
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
            ? 'Add Hardware Asset'
            : modal.mode === 'edit'
              ? 'Edit Hardware Asset'
              : 'View Hardware Asset'
        }
        mode={modal.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {modal.mode !== 'create' && (
            <FormField label="Asset Number">
              <FormInput value={modal.item?.asset_number || ''} disabled />
            </FormField>
          )}
          <FormField label="Asset Name" required>
            <FormInput
              value={form.assetName}
              onChange={(e) => setForm({ ...form, assetName: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Category">
            <FormSelect
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              disabled={isView}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{formatLabel(c)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Brand">
            <FormInput value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Model">
            <FormInput value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} disabled={isView} />
          </FormField>
          <FormField label="Serial Number">
            <FormInput
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
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
          <FormField label="Purchase Cost">
            <FormInput
              type="number"
              value={form.purchaseCost}
              onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Warranty Expiry">
            <FormInput
              type="date"
              value={form.warrantyExpiry}
              onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Assigned To">
            <FormInput
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              disabled={isView}
              placeholder="Employee name"
            />
          </FormField>
          <FormField label="Location">
            <FormInput
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              disabled={isView}
              placeholder="Office / floor / room"
            />
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isView}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Condition">
            <FormSelect
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              disabled={isView}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{formatLabel(c)}</option>
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
