import { useEffect, useState } from 'react'
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  IndianRupee,
  ClipboardCheck,
  PenLine,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const statIcons = {
  students: Users,
  teachers: GraduationCap,
  courses: BookOpen,
  batches: Layers,
  revenue: IndianRupee,
  attendance: ClipboardCheck,
  pendingFees: AlertCircle,
  activeExams: PenLine,
}

const statLabels = {
  students: 'Total Students',
  teachers: 'Teachers',
  courses: 'Active Courses',
  batches: 'Batches',
  revenue: 'Monthly Revenue',
  attendance: 'Avg. Attendance',
  pendingFees: 'Pending Fees',
  activeExams: 'Active Exams',
}

export function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      adminApi.getStats().then((res) => setStats(res.data.stats)).catch(() => {})
    }
  }, [user])

  const displayStats = stats || {
    students: '—',
    teachers: '—',
    courses: '—',
    batches: '—',
    revenue: '—',
    attendance: '—',
    pendingFees: '—',
    activeExams: '—',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening across Techackode today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(displayStats).map(([key, value]) => {
          const Icon = statIcons[key]
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {statLabels[key]}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your institution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              'New batch "Web Dev 2026" created',
              '45 students marked present in Batch A',
              'Mid-term exam scheduled for Mathematics',
              'Fee payment received from 12 students',
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p>{activity}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your edutech workflow</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {['Add Student', 'Create Course', 'Mark Attendance', 'Schedule Exam'].map((action) => (
              <button
                key={action}
                className="rounded-lg border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent"
              >
                {action}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
