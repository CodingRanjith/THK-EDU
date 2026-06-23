import { useCallback, useEffect, useState } from 'react'
import { Edit, Eye, FileSpreadsheet, FileText, Plus, Search, Trash2, IndianRupee, Send, FilePen } from 'lucide-react'
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
import { itApi } from '@/lib/api'
import { exportToExcel, formatCurrency, formatDate, formatLabel } from '@/lib/itUtils'
import { useAlert } from '@/context/AlertContext'

const EMPTY_FORM = {
  proposalName: '',
  organization: '',
  receivedDate: '',
  offerSubmissionDate: '',
  proposalValue: '',
  remarks: '',
  notes: '',
  status: 'draft',
}

const STATUSES = ['draft', 'submitted', 'won', 'lost', 'on_hold']

const EXPORT_COLUMNS = [
  { key: 'proposal_number', label: 'Proposal Number' },
  { key: 'proposal_name', label: 'Proposal Name' },
  { key: 'organization', label: 'Organization' },
  { key: 'received_date', label: 'Received Date', getValue: (r) => formatDate(r.received_date) },
  { key: 'offer_submission_date', label: 'Offer Submission Date', getValue: (r) => formatDate(r.offer_submission_date) },
  { key: 'proposal_value', label: 'Proposal Value', getValue: (r) => formatCurrency(r.proposal_value) },
  { key: 'remarks', label: 'Remarks' },
  { key: 'notes', label: 'Notes' },
  { key: 'status', label: 'Status', getValue: (r) => formatLabel(r.status) },
]

export function ProposalsPage() {
  const { showSuccess, showError } = useAlert()
  const [proposals, setProposals] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      itApi.listProposals({ search: search || undefined, status: statusFilter || undefined }),
      itApi.getProposalStats(),
    ])
      .then(([listRes, statsRes]) => {
        setProposals(listRes.data.proposals)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
      })
      .catch(() => {
        setProposals([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModal({ open: true, mode: 'create', item: null })
  }

  const openView = (item) => {
    setForm(mapProposalToForm(item))
    setModal({ open: true, mode: 'view', item })
  }

  const openEdit = (item) => {
    setForm(mapProposalToForm(item))
    setModal({ open: true, mode: 'edit', item })
  }

  const closeModal = () => setModal({ open: false, mode: 'create', item: null })

  const handleSubmit = async () => {
    if (!form.proposalName.trim()) {
      showError('Validation', 'Proposal name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        proposalName: form.proposalName.trim(),
        organization: form.organization || null,
        receivedDate: form.receivedDate || null,
        offerSubmissionDate: form.offerSubmissionDate || null,
        proposalValue: form.proposalValue ? Number(form.proposalValue) : null,
        remarks: form.remarks || null,
        notes: form.notes || null,
        status: form.status,
      }

      if (modal.mode === 'edit') {
        await itApi.updateProposal(modal.item.id, payload)
        showSuccess('Updated', 'Proposal updated successfully.')
      } else {
        await itApi.createProposal(payload)
        showSuccess('Created', 'Proposal created successfully.')
      }

      closeModal()
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save proposal.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete proposal ${item.proposal_number}?`)) return

    try {
      await itApi.deleteProposal(item.id)
      showSuccess('Deleted', `${item.proposal_number} has been removed.`)
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete proposal.')
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `it-proposals-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Proposals',
      columns: EXPORT_COLUMNS,
      rows: proposals,
    })
  }

  const isView = modal.mode === 'view'

  const statCards = stats
    ? [
        { label: 'Total Proposals', value: stats.total, icon: FileText },
        { label: 'Draft', value: stats.draft, icon: FilePen },
        { label: 'Submitted', value: stats.submitted, icon: Send },
        { label: 'Won Value', value: formatCurrency(stats.won_value), icon: IndianRupee },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Proposals</h1>
          <p className="text-muted-foreground">Manage proposal records ({total} total)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Proposal
        </Button>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Proposals</CardTitle>
          <CardDescription>Proposal numbers like PR-001, PR-002, etc.</CardDescription>
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
                placeholder="Search by number, name, organization..."
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
            <Button type="submit" variant="secondary">Filter</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={proposals.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading proposals...</p>
          ) : proposals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No proposals found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Proposal Number</th>
                    <th className="px-3 py-3 font-medium">Proposal Name</th>
                    <th className="px-3 py-3 font-medium">Organization</th>
                    <th className="px-3 py-3 font-medium">Received Date</th>
                    <th className="px-3 py-3 font-medium">Offer Submission Date</th>
                    <th className="px-3 py-3 font-medium">Proposal Value</th>
                    <th className="px-3 py-3 font-medium">Remarks</th>
                    <th className="px-3 py-3 font-medium">Notes</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal, index) => (
                    <tr key={proposal.id} className="border-b last:border-0 align-middle">
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-primary whitespace-nowrap">
                        {proposal.proposal_number}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{proposal.proposal_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{proposal.organization || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(proposal.received_date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(proposal.offer_submission_date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(proposal.proposal_value)}</td>
                      <td className="px-3 py-3 max-w-[160px] truncate" title={proposal.remarks}>{proposal.remarks || '—'}</td>
                      <td className="px-3 py-3 max-w-[160px] truncate" title={proposal.notes}>{proposal.notes || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusBadge status={proposal.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => openView(proposal)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(proposal)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => handleDelete(proposal)}>
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
        title={modal.mode === 'create' ? 'Add Proposal' : modal.mode === 'edit' ? 'Edit Proposal' : 'View Proposal'}
        mode={modal.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {modal.mode !== 'create' && (
            <FormField label="Proposal Number">
              <FormInput value={modal.item?.proposal_number || ''} disabled />
            </FormField>
          )}
          <FormField label="Proposal Name" required className={modal.mode === 'create' ? 'sm:col-span-2' : ''}>
            <FormInput
              value={form.proposalName}
              onChange={(e) => setForm({ ...form, proposalName: e.target.value })}
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
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isView}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Received Date">
            <FormInput
              type="date"
              value={form.receivedDate}
              onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Offer Submission Date">
            <FormInput
              type="date"
              value={form.offerSubmissionDate}
              onChange={(e) => setForm({ ...form, offerSubmissionDate: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Proposal Value">
            <FormInput
              type="number"
              value={form.proposalValue}
              onChange={(e) => setForm({ ...form, proposalValue: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Remarks" className="sm:col-span-2">
            <FormTextarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              disabled={isView}
            />
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

function mapProposalToForm(proposal) {
  return {
    proposalName: proposal.proposal_name || '',
    organization: proposal.organization || '',
    receivedDate: proposal.received_date ? proposal.received_date.slice(0, 10) : '',
    offerSubmissionDate: proposal.offer_submission_date ? proposal.offer_submission_date.slice(0, 10) : '',
    proposalValue: proposal.proposal_value ?? '',
    remarks: proposal.remarks || '',
    notes: proposal.notes || '',
    status: proposal.status || 'draft',
  }
}
