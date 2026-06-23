import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sidebarNavItems,
  getVisibleChildren,
  getExpandedGroupForPath,
} from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'

export function Sidebar({ collapsed = false }) {
  const { user } = useAuth()
  const location = useLocation()
  const [expanded, setExpanded] = useState(() =>
    getExpandedGroupForPath(location.pathname)
  )

  useEffect(() => {
    const group = getExpandedGroupForPath(location.pathname)
    if (group) setExpanded(group)
  }, [location.pathname])

  const items = sidebarNavItems.filter(
    (item) =>
      !item.adminOnly ||
      user?.role === 'admin' ||
      getVisibleChildren(item, user).length > 0
  )

  const isChildActive = (children) =>
    children?.some((c) => location.pathname.startsWith(c.href))

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">Techackode</p>
            <p className="truncate text-xs text-sidebar-foreground/70">Edutech Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const children = getVisibleChildren(item, user)
            const hasChildren = children.length > 0
            const isOpen = expanded === item.title
            const active = item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : (item.href && location.pathname.startsWith(item.href)) ||
                isChildActive(children)

            if (hasChildren && !collapsed) {
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : item.title)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
                    />
                  </button>
                  {isOpen && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
                      {children.map((child) => (
                        <li key={child.href}>
                          <NavLink
                            to={child.href}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-lg px-3 py-2 text-sm transition-colors',
                                isActive
                                  ? 'bg-sidebar-accent text-white font-medium'
                                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white'
                              )
                            }
                          >
                            {child.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            }

            return (
              <li key={item.href || item.title}>
                <NavLink
                  to={hasChildren ? children[0].href : item.href}
                  end={item.href === '/dashboard'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      (isActive || active)
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white'
                    )
                  }
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-sidebar-foreground/60">
            © {new Date().getFullYear()} Techackode
          </p>
        </div>
      )}
    </aside>
  )
}
