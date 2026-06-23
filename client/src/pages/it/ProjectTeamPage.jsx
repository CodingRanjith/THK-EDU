import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Edit,
  Eye,
  Layers,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
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
import { WORK_AREAS, getWorkAreaLabel } from '@/config/itTeam'
import { itApi } from '@/lib/api'
import { exportToExcel, formatDate, formatLabel } from '@/lib/itUtils'
import { useAlert } from '@/context/AlertContext'

const EMPTY_ALLOCATION = {
  teamMemberId: '',
  workArea: 'frontend',
  workingHours: '',
  availableHours: '',
  notes: '',
}

const EMPTY_MEMBER = {
  memberName: '',
  email: '',
  designation: '',
  defaultAvailableHours: '40',
  status: 'active',
}

const EXPORT_COLUMNS = [
  { key: 'member_name', label: 'Member Name' },
  { key: 'designation', label: 'Designation' },
  { key: 'work_area', label: 'Work Area', getValue: (r) => getWorkAreaLabel(r.work_area) },
  { key: 'working_hours', label: 'Working Hours (h/week)' },
  { key: 'available_hours', label: 'Available Hours (h/week)' },
  { key: 'notes', label: 'Notes' },
]

export function ProjectTeamPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()

  const [project, setProject] = useState(null)
  const [allocations, setAllocations] = useState([])
  const [stats, setStats] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [workAreaFilter, setWorkAreaFilter] = useState('')
  const [search, setSearch] = useState('')

  const [allocModal, setAllocModal] = useState({ open: false, mode: 'create', item: null })
  const [allocForm, setAllocForm] = useState(EMPTY_ALLOCATION)
  const [memberModal, setMemberModal] = useState({ open: false, mode: 'create', item: null })
  const [memberForm, setMemberForm] = useState(EMPTY_MEMBER)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      itApi.getProjectTeam(projectId, { workArea: workAreaFilter || undefined }),
      itApi.listTeamMembers({ status: 'active' }),
    ])
      .then(([teamRes, membersRes]) => {
        setProject(teamRes.data.project)
        setAllocations(teamRes.data.allocations)
        setStats(teamRes.data.stats)
        setMembers(membersRes.data.members)
      })
      .catch(() => {
        setProject(null)
        setAllocations([])
      })
      .finally(() => setLoading(false))
  }, [projectId, workAreaFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredAllocations = allocations.filter((row) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      row.member_name?.toLowerCase().includes(q) ||
      getWorkAreaLabel(row.work_area).toLowerCase().includes(q) ||
      row.designation?.toLowerCase().includes(q)
    )
  })

  const openAddAllocation = () => {
    setAllocForm(EMPTY_ALLOCATION)
    setAllocModal({ open: true, mode: 'create', item: null })
  }

  const openEditAllocation = (item) => {
    setAllocForm({
      teamMemberId: item.team_member_id,
      workArea: item.work_area,
      workingHours: item.working_hours ?? '',
      availableHours: item.available_hours ?? '',
      notes: item.notes || '',
    })
    setAllocModal({ open: true, mode: 'edit', item })
  }

  const openViewAllocation = (item) => {
    setAllocForm({
      teamMemberId: item.team_member_id,
      workArea: item.work_area,
      workingHours: item.working_hours ?? '',
      availableHours: item.available_hours ?? '',
      notes: item.notes || '',
    })
    setAllocModal({ open: true, mode: 'view', item })
  }

  const handleAllocationSubmit = async () => {
    if (!allocForm.teamMemberId) {
      showError('Validation', 'Please select a team member.')
      return
    }
    if (!allocForm.workArea) {
      showError('Validation', 'Please select a work area.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        teamMemberId: allocForm.teamMemberId,
        workArea: allocForm.workArea,
        workingHours: allocForm.workingHours ? Number(allocForm.workingHours) : 0,
        availableHours: allocForm.availableHours ? Number(allocForm.availableHours) : 40,
        notes: allocForm.notes || null,
      }

      if (allocModal.mode === 'edit') {
        await itApi.updateAllocation(allocModal.item.id, payload)
        showSuccess('Updated', 'Team allocation updated.')
      } else {
        await itApi.createAllocation(projectId, payload)
        showSuccess('Allocated', 'Team member allocated to project.')
      }

      setAllocModal({ open: false, mode: 'create', item: null })
      fetchData()
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not save allocation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAllocation = async (item) => {
    if (!window.confirm(`Remove ${item.member_name} from ${getWorkAreaLabel(item.work_area)}?`)) return

    try {
      await itApi.deleteAllocation(item.id)
      showSuccess('Removed', 'Team allocation removed.')
      fetchData()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not remove allocation.')
    }
  }

  const openAddMember = () => {
    setMemberForm(EMPTY_MEMBER)
    setMemberModal({ open: true, mode: 'create', item: null })
  }

  const handleMemberSubmit = async () => {
    if (!memberForm.memberName.trim()) {
      showError('Validation', 'Member name is required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        memberName: memberForm.memberName.trim(),
        email: memberForm.email || null,
        designation: memberForm.designation || null,
        defaultAvailableHours: memberForm.defaultAvailableHours
          ? Number(memberForm.defaultAvailableHours)
          : 40,
        status: memberForm.status,
      }

      await itApi.createTeamMember(payload)
      showSuccess('Created', 'Team member added.')
      setMemberModal({ open: false, mode: 'create', item: null })

      const membersRes = await itApi.listTeamMembers({ status: 'active' })
      setMembers(membersRes.data.members)
    } catch (err) {
      showError('Save Failed', err.response?.data?.message || 'Could not add team member.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = () => {
    exportToExcel({
      filename: `team-${project?.project_number || 'project'}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Team Allocations',
      columns: EXPORT_COLUMNS,
      rows: filteredAllocations,
    })
  }

  const handleMemberSelect = (memberId) => {
    const member = members.find((m) => m.id === memberId)
    setAllocForm((prev) => ({
      ...prev,
      teamMemberId: memberId,
      availableHours: member?.default_available_hours ?? prev.availableHours ?? '40',
    }))
  }

  if (loading && !project) {
    return <p className="py-12 text-center text-muted-foreground">Loading project team...</p>
  }

  if (!project) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/it/team-management')}>
          Back to Team Management
        </Button>
      </div>
    )
  }

  const summary = stats?.summary
  const statCards = summary
    ? [
        { label: 'Team Members', value: summary.members, icon: Users },
        { label: 'Work Assignments', value: summary.allocations, icon: Layers },
        { label: 'Working Hours', value: `${Number(summary.total_working_hours)}h`, icon: Clock },
        {
          label: 'Available Hours',
          value: `${Number(summary.total_available_hours)}h`,
          icon: Clock,
        },
      ]
    : []

  const isAllocView = allocModal.mode === 'view'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8"
            onClick={() => navigate('/dashboard/it/team-management')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <p className="font-mono text-sm text-primary">{project.project_number}</p>
            <h1 className="text-2xl font-bold tracking-tight">{project.project_name}</h1>
            <p className="text-muted-foreground">
              {project.client_name || 'No client'} · {formatLabel(project.project_type)} ·{' '}
              {formatDate(project.start_date)} – {formatDate(project.end_date)}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openAddMember}>
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </Button>
          <Button onClick={openAddAllocation}>
            <Plus className="h-4 w-4" />
            Allocate Member
          </Button>
        </div>
      </div>

      <StatsCards stats={statCards} />

      {stats?.byWorkArea?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Work Area Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.byWorkArea.map((area) => (
                <span
                  key={area.work_area}
                  className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <span className="font-medium">{getWorkAreaLabel(area.work_area)}</span>
                  <span className="ml-2 text-muted-foreground">
                    {area.count} · {Number(area.working_hours)}h
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Allocations</CardTitle>
          <CardDescription>
            Assign members to work areas — Frontend, Backend, Database, API Integration, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
            }}
            className="flex flex-wrap gap-3"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search member or work area..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={workAreaFilter}
              onChange={(e) => setWorkAreaFilter(e.target.value)}
            >
              <option value="">All Work Areas</option>
              {WORK_AREAS.map((area) => (
                <option key={area.value} value={area.value}>{area.label}</option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={handleExport} disabled={filteredAllocations.length === 0}>
              Export Excel
            </Button>
          </form>

          {filteredAllocations.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No team members allocated yet. Click &quot;Allocate Member&quot; to assign work.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Member</th>
                    <th className="px-3 py-3 font-medium">Designation</th>
                    <th className="px-3 py-3 font-medium">Work Area</th>
                    <th className="px-3 py-3 font-medium">Working Time (h/week)</th>
                    <th className="px-3 py-3 font-medium">Available Time (h/week)</th>
                    <th className="px-3 py-3 font-medium">Notes</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllocations.map((row, index) => (
                    <tr key={row.id} className="border-b last:border-0 align-middle">
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="font-medium">{row.member_name}</p>
                        {row.email && <p className="text-xs text-muted-foreground">{row.email}</p>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{row.designation || '—'}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {getWorkAreaLabel(row.work_area)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-medium">
                        {Number(row.working_hours)}h
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {Number(row.available_hours)}h
                      </td>
                      <td className="px-3 py-3 max-w-[180px] truncate" title={row.notes}>
                        {row.notes || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View"
                            onClick={() => openViewAllocation(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => openEditAllocation(row)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Remove"
                            onClick={() => handleDeleteAllocation(row)}
                          >
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
        open={allocModal.open}
        title={
          allocModal.mode === 'create'
            ? 'Allocate Team Member'
            : allocModal.mode === 'edit'
              ? 'Edit Allocation'
              : 'View Allocation'
        }
        mode={allocModal.mode}
        onClose={() => setAllocModal({ open: false, mode: 'create', item: null })}
        onSubmit={handleAllocationSubmit}
        submitting={submitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Team Member" required className="sm:col-span-2">
            <FormSelect
              value={allocForm.teamMemberId}
              onChange={(e) => handleMemberSelect(e.target.value)}
              disabled={isAllocView}
            >
              <option value="">Select team member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.member_name}{m.designation ? ` — ${m.designation}` : ''}
                </option>
              ))}
            </FormSelect>
            {members.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No team members yet.{' '}
                <button type="button" className="text-primary underline" onClick={openAddMember}>
                  Add one first
                </button>
              </p>
            )}
          </FormField>

          <FormField label="Work Area" required className="sm:col-span-2">
            <FormSelect
              value={allocForm.workArea}
              onChange={(e) => setAllocForm({ ...allocForm, workArea: e.target.value })}
              disabled={isAllocView}
            >
              {WORK_AREAS.map((area) => (
                <option key={area.value} value={area.value}>{area.label}</option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label="Working Time (hours/week)" required>
            <FormInput
              type="number"
              min="0"
              step="0.5"
              value={allocForm.workingHours}
              onChange={(e) => setAllocForm({ ...allocForm, workingHours: e.target.value })}
              disabled={isAllocView}
              placeholder="e.g. 30"
            />
          </FormField>

          <FormField label="Available Time (hours/week)" required>
            <FormInput
              type="number"
              min="0"
              step="0.5"
              value={allocForm.availableHours}
              onChange={(e) => setAllocForm({ ...allocForm, availableHours: e.target.value })}
              disabled={isAllocView}
              placeholder="e.g. 40"
            />
          </FormField>

          <FormField label="Notes" className="sm:col-span-2">
            <FormTextarea
              value={allocForm.notes}
              onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })}
              disabled={isAllocView}
              placeholder="Tasks, responsibilities, sprint notes..."
            />
          </FormField>
        </div>
      </FormModal>

      <FormModal
        open={memberModal.open}
        title="Add Team Member"
        mode="create"
        onClose={() => setMemberModal({ open: false, mode: 'create', item: null })}
        onSubmit={handleMemberSubmit}
        submitting={submitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Member Name" required className="sm:col-span-2">
            <FormInput
              value={memberForm.memberName}
              onChange={(e) => setMemberForm({ ...memberForm, memberName: e.target.value })}
            />
          </FormField>
          <FormField label="Email">
            <FormInput
              type="email"
              value={memberForm.email}
              onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
            />
          </FormField>
          <FormField label="Designation">
            <FormInput
              value={memberForm.designation}
              onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
              placeholder="e.g. Senior Developer"
            />
          </FormField>
          <FormField label="Default Available Hours (per week)">
            <FormInput
              type="number"
              min="0"
              value={memberForm.defaultAvailableHours}
              onChange={(e) => setMemberForm({ ...memberForm, defaultAvailableHours: e.target.value })}
            />
          </FormField>
        </div>
      </FormModal>
    </div>
  )
}
