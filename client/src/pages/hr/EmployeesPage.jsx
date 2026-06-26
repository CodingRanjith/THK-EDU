import { useCallback, useEffect, useState } from 'react'
import { Edit, Plus, Search, Trash2, UserCheck, UserPlus, Users, UserX } from 'lucide-react'
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
import { hrApi } from '@/lib/api'
import { useAlert } from '@/context/AlertContext'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  department: '',
  designation: '',
  joinDate: '',
  status: 'active',
  createAccount: false,
  password: '',
  role: 'user',
}

const STATUSES = ['active', 'inactive']
const ROLES = ['user', 'teacher', 'admin']

function mapEmployeeToForm(emp) {
  return {
    name: emp.name || '',
    email: emp.email || '',
    phone: emp.phone || '',
    department: emp.department || '',
    designation: emp.designation || '',
    joinDate: emp.join_date ? emp.join_date.slice(0, 10) : '',
    status: emp.status || 'active',
    createAccount: false,
    password: '',
    role: 'user',
  }
}

export function EmployeesPage() {
  const { showSuccess, showError } = useAlert()
  const [employees, setEmployees] = useState([])
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
      hrApi.listEmployees({ search: search || undefined, status: statusFilter || undefined }),
      hrApi.getEmployeeStats(),
    ])
      .then(([listRes, statsRes]) => {
        setEmployees(listRes.data.employees)
        setTotal(listRes.data.total)
        setStats(statsRes.data.stats)
      })
      .catch(() => {
        setEmployees([])
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

  const openEdit = (item) => {
    setForm(mapEmployeeToForm(item))
    setModal({ open: true, mode: 'edit', item })
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showError('Employee name is required')
      return
    }

    setSubmitting(true)
    try {
      if (modal.mode === 'create') {
        await hrApi.createEmployee({
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          designation: form.designation,
          joinDate: form.joinDate || null,
          status: form.status,
          createAccount: form.createAccount,
          password: form.password,
          role: form.role,
        })
        showSuccess('Employee created successfully')
      } else {
        await hrApi.updateEmployee(modal.item.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          designation: form.designation,
          joinDate: form.joinDate || null,
          status: form.status,
        })
        showSuccess('Employee updated successfully')
      }
      setModal({ open: false, mode: 'create', item: null })
      fetchData()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save employee')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete employee "${item.name}"?`)) return
    try {
      await hrApi.deleteEmployee(item.id)
      showSuccess('Employee deleted')
      fetchData()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete employee')
    }
  }

  const statCards = stats
    ? [
        { label: 'Total Employees', value: stats.total, icon: Users },
        { label: 'Active', value: stats.active, icon: UserCheck },
        { label: 'Inactive', value: stats.inactive, icon: UserX },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Create and manage employee records</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <StatsCards stats={statCards} />

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>{total} employee{total !== 1 ? 's' : ''} found</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, email, department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading employees...</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Code</th>
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Department</th>
                    <th className="pb-3 pr-4 font-medium">Designation</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Phone</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs">{emp.employee_code}</td>
                      <td className="py-3 pr-4 font-medium">{emp.name}</td>
                      <td className="py-3 pr-4">{emp.department || '—'}</td>
                      <td className="py-3 pr-4">{emp.designation || '—'}</td>
                      <td className="py-3 pr-4">{emp.email || '—'}</td>
                      <td className="py-3 pr-4">{emp.phone || '—'}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(emp)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(emp)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
        title={modal.mode === 'create' ? 'Add Employee' : 'Edit Employee'}
        mode={modal.mode}
        onClose={() => setModal({ open: false, mode: 'create', item: null })}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" required className="sm:col-span-2">
            <FormInput
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Employee name"
            />
          </FormField>
          <FormField label="Email">
            <FormInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@company.com"
            />
          </FormField>
          <FormField label="Phone">
            <FormInput
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 ..."
            />
          </FormField>
          <FormField label="Department">
            <FormInput
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. HR, IT"
            />
          </FormField>
          <FormField label="Designation">
            <FormInput
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              placeholder="e.g. Manager"
            />
          </FormField>
          <FormField label="Join Date">
            <FormInput
              type="date"
              value={form.joinDate}
              onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
            />
          </FormField>
          <FormField label="Status">
            <FormSelect
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {modal.mode === 'create' && (
            <>
              <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  checked={form.createAccount}
                  onChange={(e) => setForm({ ...form, createAccount: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="createAccount" className="text-sm font-medium">
                  <UserPlus className="mr-1 inline h-4 w-4" />
                  Also create login account
                </label>
              </div>
              {form.createAccount && (
                <>
                  <FormField label="Password" required>
                    <FormInput
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Login password"
                    />
                  </FormField>
                  <FormField label="User Role">
                    <FormSelect
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>
                </>
              )}
            </>
          )}
        </div>
      </FormModal>
    </div>
  )
}
