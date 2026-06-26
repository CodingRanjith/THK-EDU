import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ClipboardCheck,
  FileText,
  PenLine,
  BarChart3,
  CreditCard,
  PieChart,
  Bell,
  Settings,
  UserCog,
  FolderOpen,
  Briefcase,
  Monitor,
  Wallet,
} from 'lucide-react'

export const sidebarNavItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    title: 'IT Solution',
    icon: Briefcase,
    children: [
      { title: 'Clients', href: '/dashboard/it/clients' },
      { title: 'Proposal', href: '/dashboard/it/proposals' },
      { title: 'Projects', href: '/dashboard/it/projects' },
      { title: 'Team Management', href: '/dashboard/it/team-management' },
    ],
  },
  {
    title: 'Edutech',
    icon: GraduationCap,
    children: [
      { title: 'Students', href: '/dashboard/students' },
      { title: 'Teachers', href: '/dashboard/teachers' },
      { title: 'Courses', href: '/dashboard/courses' },
      { title: 'Batches', href: '/dashboard/batches' },
      { title: 'Attendance', href: '/dashboard/attendance' },
      { title: 'Assignments', href: '/dashboard/assignments' },
      { title: 'Exams', href: '/dashboard/exams' },
      { title: 'Results', href: '/dashboard/results' },
      { title: 'Fees & Payments', href: '/dashboard/fees' },
      { title: 'Reports', href: '/dashboard/reports' },
      { title: 'Notifications', href: '/dashboard/notifications' },
    ],
  },
  {
    title: 'HR & Admin',
    icon: UserCog,
    children: [
      { title: 'User Management', href: '/dashboard/users', adminOnly: true },
      { title: 'Employee Management', href: '/dashboard/hr/employees', adminOnly: true },
      { title: 'Attendance Management', href: '/dashboard/hr/attendance', adminOnly: true },
      { title: 'Settings', href: '/dashboard/settings' },
    ],
  },
  {
    title: 'Document Management',
    href: '/dashboard/documents',
    icon: FolderOpen,
    children: [
      { title: 'Generate Documents', href: '/dashboard/documents/generate' },
      { title: 'Document Management', href: '/dashboard/documents/management' },
    ],
  },
  {
    title: 'IT & Assets',
    href: '/dashboard/it-assets',
    icon: Monitor,
    children: [
      { title: 'Assets and Hardware Management', href: '/dashboard/it-assets/hardware' },
      { title: 'Software Management', href: '/dashboard/it-assets/software' },
    ],
  },
  {
    title: 'Finance',
    href: '/dashboard/finance',
    icon: Wallet,
    children: [
      { title: 'Account Receivable', href: '/dashboard/finance/receivable' },
      { title: 'Account Payable', href: '/dashboard/finance/payable' },
      { title: 'Overall Account Report', href: '/dashboard/finance/report' },
    ],
  },
]

const RESERVED_PATHS = new Set([
  '/dashboard',
  '/dashboard/users',
  '/dashboard/documents',
])

export function getVisibleChildren(item, user) {
  return (item.children ?? []).filter(
    (child) => !child.adminOnly || user?.role === 'admin'
  )
}

export function getExpandedGroupForPath(pathname) {
  for (const item of sidebarNavItems) {
    if (!item.children?.length) continue

    const matchesGroup =
      (item.href && pathname.startsWith(item.href)) ||
      item.children.some((child) => pathname.startsWith(child.href))

    if (matchesGroup) return item.title
  }

  return null
}

export function findNavItemByPath(pathname) {
  for (const item of sidebarNavItems) {
    if (item.href === pathname) return item

    const child = item.children?.find(
      (c) => pathname === c.href || pathname.startsWith(`${c.href}/`)
    )
    if (child) return child
  }

  return null
}

export function getPlaceholderRoutes() {
  const routes = []

  for (const item of sidebarNavItems) {
    if (item.children?.length) {
      for (const child of item.children) {
        if (
          child.adminOnly ||
          RESERVED_PATHS.has(child.href) ||
          child.href.startsWith('/dashboard/documents') ||
          child.href.startsWith('/dashboard/it') ||
          child.href.startsWith('/dashboard/hr') ||
          child.href.startsWith('/dashboard/it-assets') ||
          child.href.startsWith('/dashboard/finance')
        ) {
          continue
        }
        routes.push(child)
      }
      continue
    }

    if (item.href && !RESERVED_PATHS.has(item.href)) {
      routes.push(item)
    }
  }

  return routes
}
