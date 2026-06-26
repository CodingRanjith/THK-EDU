import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  IndianRupee,
  ClipboardCheck,
  PenLine,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  FileText,
  Briefcase,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { BRAND } from '@/config/brand'

const statConfig = [
  { key: 'students', label: 'Total Students', icon: Users, color: 'bg-sky-500/10 text-sky-600' },
  { key: 'teachers', label: 'Teachers', icon: GraduationCap, color: 'bg-violet-500/10 text-violet-600' },
  { key: 'courses', label: 'Active Courses', icon: BookOpen, color: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'batches', label: 'Batches', icon: Layers, color: 'bg-amber-500/10 text-amber-600' },
  { key: 'revenue', label: 'Monthly Revenue', icon: IndianRupee, color: 'bg-primary/10 text-primary' },
  { key: 'attendance', label: 'Avg. Attendance', icon: ClipboardCheck, color: 'bg-teal-500/10 text-teal-600' },
  { key: 'pendingFees', label: 'Pending Fees', icon: AlertCircle, color: 'bg-orange-500/10 text-orange-600' },
  { key: 'activeExams', label: 'Active Exams', icon: PenLine, color: 'bg-rose-500/10 text-rose-600' },
]

const quickLinks = [
  { label: 'IT Clients', href: '/dashboard/it/clients', icon: Briefcase },
  { label: 'Documents', href: '/dashboard/documents/generate', icon: FileText },
  { label: 'Finance Report', href: '/dashboard/finance/report', icon: Wallet },
  { label: 'HR Employees', href: '/dashboard/hr/employees', icon: Users },
]

export function DashboardHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      adminApi.getStats().then((res) => setStats(res.data.stats)).catch(() => {})
    }
  }, [user])

  const displayStats = stats || Object.fromEntries(statConfig.map((s) => [s.key, '—']))

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${BRAND.name} — Welcome, ${user?.name?.split(' ')[0] || 'Admin'}`}
        description="Your unified command center for education, IT, HR, finance, and operations."
      >
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/settings">
            <Sparkles className="h-4 w-4" />
            Workspace
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statConfig.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="stat-card group">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold tracking-tight">{displayStats[key]}</p>
              </div>
              <div className={cn('stat-card-icon group-hover:scale-110', color)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your institution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              { text: 'New batch "Web Dev 2026" created', time: '2h ago' },
              { text: '45 students marked present in Batch A', time: '4h ago' },
              { text: 'Mid-term exam scheduled for Mathematics', time: 'Yesterday' },
              { text: 'Fee payment received from 12 students', time: 'Yesterday' },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{activity.text}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Jump to key modules</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="group flex items-center justify-between rounded-xl border bg-background px-4 py-3.5 text-sm font-medium transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                    <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </span>
                  {link.label}
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
