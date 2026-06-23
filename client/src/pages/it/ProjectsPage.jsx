import { useCallback, useEffect, useMemo, useState } from 'react'
import { Briefcase, CheckCircle2, Clock, Edit, Eye, FileSpreadsheet, FolderKanban, Plus, Search, Trash2 } from 'lucide-react'
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
import { exportToExcel, formatDate, formatLabel } from '@/lib/itUtils'
import { useAlert } from '@/context/AlertContext'

const EMPTY_FORM = {
  projectName: '',
  clientId: '',
  projectType: 'billable',
  projectSource: 'external',
  startDate: '',
  endDate: '',
  status: 'planning',
}

const PROJECT_TYPES = ['billable', 'non_billable']
const PROJECT_SOURCES = ['internal', 'external']
const STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled']

const EXPORT_COLUMNS = [
  { key: 'project_number', label: 'Project Number' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'client_name', label: 'Client' },
  { key: 'project_type', label: 'Project Type', getValue: (r) => formatLabel(r.project_type) },
  { key: 'project_source', label: 'Project Source', getValue: (r) => formatLabel(r.project_source) },
  { key: 'start_date', label: 'Start Date', getValue: (r) => formatDate(r.start_date) },
  { key: 'end_date', label: 'End Date', getValue: (r) => formatDate(r.end_date) },
  { key: 'duration_days', label: 'Duration (Days)', getValue: (r) => r.duration_days ?? '—' },
  { key: 'status', label: 'Status', getValue: (r) => formatLabel(r.status) },
]

function calcDuration(startDate, endDate) {
  if (!startDate || !endDate) return null
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return days >= 0 ? days : null
}

export function ProjectsPage() {
  const { showSuccess, showError } = useAlert()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const durationPreview = useMemo(
    () => calcDuration(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  )

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      itApi.listProjects({
        search: search || undefined,
        status: statusFilter || undefined,
        projectType: typeFilter || undefined,
        projectSource: sourceFilter || undefined,
      }),
      itApi.getProjectStats(),
      itApi.listClientsBrief(),
    ])
      .then(([listRes, statsRes, clientsRes]) => {
        setProjects(listRes.data.projects)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
        setClients(clientsRes.data.clients)
      })
      .catch(() => {
        setProjects([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search, statusFilter, typeFilter, sourceFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModal({ open: true, mode: 'create', item: null })
  }

  const openView = (item) => {
    setForm(mapProjectToForm(item))
    setModal({ open: true, mode: 'view', item })
  }

  const openEdit = (item) => {
    setForm(mapProjectToForm(item))
    setModal({ open: true, mode: 'edit', item })
  }

  const closeModal = () => setModal({ open: false, mode: 'create', item: null })

  const handleSubmit = async () => {
    if (!form.projectName.trim()) {
      showError('Validation', 'Project name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        projectName: form.projectName.trim(),
        clientId: form.clientId || null,
        projectType: form.projectType,
        projectSource: form.projectSource,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
      }

      if (modal.mode === 'edit') {
        await itApi.updateProject(modal.item.id, payload)
        showSuccess('Updated', 'Project updated successfully.')
      } else {
        await itApi.createProject(payload)
        showSuccess('Created', 'Project created successfully.')
      }

      closeModal()
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save project.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete project ${item.project_number}?`)) return

    try {
      await itApi.deleteProject(item.id)
      showSuccess('Deleted', `${item.project_number} has been removed.`)
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete project.')
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `it-projects-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Projects',
      columns: EXPORT_COLUMNS,
      rows: projects,
    })
  }

  const isView = modal.mode === 'view'

  const statCards = stats
    ? [
        { label: 'Total Projects', value: stats.total, icon: FolderKanban },
        { label: 'Active', value: stats.active, icon: Briefcase },
        { label: 'Planning', value: stats.planning, icon: Clock },
        { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IT Projects</h1>
          <p className="text-muted-foreground">Manage project records ({total} total)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Projects</CardTitle>
          <CardDescription>Project numbers like PJ-001, PJ-002, etc.</CardDescription>
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
                placeholder="Search by number, name, client..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">All Sources</option>
              {PROJECT_SOURCES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
            <Button type="button" variant="outline" onClick={handleExport} disabled={projects.length === 0}>
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No projects found.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Project Number</th>
                    <th className="px-3 py-3 font-medium">Project Name</th>
                    <th className="px-3 py-3 font-medium">Client</th>
                    <th className="px-3 py-3 font-medium">Project Type</th>
                    <th className="px-3 py-3 font-medium">Project Source</th>
                    <th className="px-3 py-3 font-medium">Start Date</th>
                    <th className="px-3 py-3 font-medium">End Date</th>
                    <th className="px-3 py-3 font-medium">Duration</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, index) => (
                    <tr key={project.id} className="border-b last:border-0 align-middle">
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-primary whitespace-nowrap">
                        {project.project_number}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{project.project_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {project.client_name || '—'}
                        {project.client_number && (
                          <span className="ml-1 text-xs text-muted-foreground">({project.client_number})</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatLabel(project.project_type)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatLabel(project.project_source)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(project.start_date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDate(project.end_date)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {project.duration_days != null ? `${project.duration_days} days` : '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View" onClick={() => openView(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => handleDelete(project)}>
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
        title={modal.mode === 'create' ? 'Add Project' : modal.mode === 'edit' ? 'Edit Project' : 'View Project'}
        mode={modal.mode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
        size="xl"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {modal.mode !== 'create' && (
            <FormField label="Project Number">
              <FormInput value={modal.item?.project_number || ''} disabled />
            </FormField>
          )}
          <FormField label="Project Name" required>
            <FormInput
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Client">
            <FormSelect
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              disabled={isView}
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.client_name} ({client.client_number})
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Project Type">
            <FormSelect
              value={form.projectType}
              onChange={(e) => setForm({ ...form, projectType: e.target.value })}
              disabled={isView}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Project Source">
            <FormSelect
              value={form.projectSource}
              onChange={(e) => setForm({ ...form, projectSource: e.target.value })}
              disabled={isView}
            >
              {PROJECT_SOURCES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Status">
            <FormSelect value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={isView}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Start Date">
            <FormInput
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="End Date">
            <FormInput
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              disabled={isView}
            />
          </FormField>
          <FormField label="Duration (auto-calculated)">
            <FormInput
              value={durationPreview != null ? `${durationPreview} days` : '—'}
              disabled
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  )
}

function mapProjectToForm(project) {
  return {
    projectName: project.project_name || '',
    clientId: project.client_id || '',
    projectType: project.project_type || 'billable',
    projectSource: project.project_source || 'external',
    startDate: project.start_date ? project.start_date.slice(0, 10) : '',
    endDate: project.end_date ? project.end_date.slice(0, 10) : '',
    status: project.status || 'planning',
  }
}
