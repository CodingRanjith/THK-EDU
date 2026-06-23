import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, FolderKanban, Search, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards, StatusBadge } from '@/components/it/ItShared'
import { itApi } from '@/lib/api'
import { formatDate, formatLabel } from '@/lib/itUtils'

export function TeamManagementPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = useCallback(() => {
    setLoading(true)
    itApi
      .listTeamProjects({ search: search || undefined, status: statusFilter || undefined })
      .then((res) => {
        setProjects(res.data.projects)
        setTotal(res.data.total)
      })
      .catch(() => {
        setProjects([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [search, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalMembers = projects.reduce((sum, p) => sum + (p.team_count || 0), 0)
  const totalHours = projects.reduce((sum, p) => sum + Number(p.total_working_hours || 0), 0)
  const activeProjects = projects.filter((p) => p.status === 'active').length

  const statCards = [
    { label: 'Projects', value: total, icon: FolderKanban },
    { label: 'Active Projects', value: activeProjects, icon: FolderKanban },
    { label: 'Allocated Members', value: totalMembers, icon: Users },
    { label: 'Total Working Hours', value: `${totalHours}h`, icon: Clock },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Select a project to allocate team members and assign work areas
        </p>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects</CardTitle>
          <CardDescription>Click a project to manage team allocations</CardDescription>
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
                placeholder="Search by project number, name, client..."
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
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button type="submit" variant="secondary">Filter</Button>
          </form>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects found. Create projects first under IT Solution → Projects.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/it/team-management/${project.id}`)}
                  className="rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-medium text-primary">
                        {project.project_number}
                      </p>
                      <p className="mt-1 font-semibold">{project.project_name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.client_name || 'No client'}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {project.team_count || 0} member{project.team_count === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Number(project.total_working_hours || 0)}h working
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-muted px-2 py-0.5">{formatLabel(project.project_type)}</span>
                    <span className="rounded bg-muted px-2 py-0.5">{formatLabel(project.project_source)}</span>
                    {project.start_date && (
                      <span className="rounded bg-muted px-2 py-0.5">
                        {formatDate(project.start_date)} – {formatDate(project.end_date)}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                    <UserPlus className="h-4 w-4" />
                    Allocate Team
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
