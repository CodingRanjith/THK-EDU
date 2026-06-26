import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sidebarNavItems,
  getVisibleChildren,
  getExpandedGroupForPath,
} from '@/config/navigation'
import { useAuth } from '@/context/AuthContext'
import { BRAND } from '@/config/brand'

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
        'relative flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent',
        collapsed ? 'w-[76px]' : 'w-[272px]'
      )}
    >
      <div className="relative flex h-[4.25rem] items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
          <GraduationCap className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">{BRAND.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-sidebar-foreground/60">
              <Sparkles className="h-3 w-3" />
              {BRAND.tagline}
            </p>
          </div>
        )}
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-4">
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
                      'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      active
                        ? 'sidebar-nav-active'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 opacity-60 transition-transform duration-200', isOpen && 'rotate-180')}
                    />
                  </button>
                  {isOpen && (
                    <ul className="ml-5 mt-1 space-y-0.5 border-l border-sidebar-border/80 pl-3">
                      {children.map((child) => (
                        <li key={child.href}>
                          <NavLink
                            to={child.href}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-lg px-3 py-2 text-sm transition-all duration-200',
                                isActive
                                  ? 'bg-sidebar-accent font-medium text-white shadow-sm'
                                  : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-white'
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
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      (isActive || active)
                        ? 'sidebar-nav-active'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-white'
                    )
                  }
                  title={collapsed ? item.title : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0 opacity-90" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {!collapsed && user && (
        <div className="relative border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-sidebar-accent/40 p-3">
            <p className="truncate text-xs font-medium text-white">{user.name}</p>
            <p className="truncate text-xs capitalize text-sidebar-foreground/60">{user.role}</p>
          </div>
          <p className="mt-3 text-center text-[10px] text-sidebar-foreground/40">
            © {new Date().getFullYear()} {BRAND.copyright}
          </p>
        </div>
      )}
    </aside>
  )
}
