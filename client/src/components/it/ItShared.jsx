import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fieldClassName } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const STAT_ICON_COLORS = [
  'bg-primary/10 text-primary',
  'bg-emerald-500/10 text-emerald-600',
  'bg-amber-500/10 text-amber-600',
  'bg-violet-500/10 text-violet-600',
  'bg-sky-500/10 text-sky-600',
  'bg-rose-500/10 text-rose-600',
  'bg-orange-500/10 text-orange-600',
  'bg-teal-500/10 text-teal-600',
]

export function FormModal({
  open,
  title,
  mode = 'create',
  onClose,
  onSubmit,
  submitting = false,
  children,
  size = 'lg',
}) {
  if (!open) return null

  const isView = mode === 'view'
  const maxWidth = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full max-h-[90vh] overflow-hidden rounded-2xl border bg-card shadow-2xl',
          maxWidth
        )}
      >
        <div className="flex items-center justify-between border-b bg-muted/20 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-xs text-muted-foreground capitalize">{mode} record</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!isView) onSubmit?.()
          }}
          className="flex max-h-[calc(90vh-8rem)] flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          <div className="flex justify-end gap-2 border-t bg-muted/10 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {isView ? 'Close' : 'Cancel'}
            </Button>
            {!isView && (
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export function FormField({ label, required, children, className = '' }) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground/90">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
    </div>
  )
}

export function FormInput({ className = '', ...props }) {
  return <input className={cn(fieldClassName, className)} {...props} />
}

export function FormSelect({ className = '', children, ...props }) {
  return (
    <select className={cn(fieldClassName, className)} {...props}>
      {children}
    </select>
  )
}

export function FormTextarea({ className = '', ...props }) {
  return (
    <textarea
      className={cn(fieldClassName, 'min-h-[88px] py-2.5', className)}
      {...props}
    />
  )
}

export function StatsCards({ stats }) {
  if (!stats?.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        const colorClass = STAT_ICON_COLORS[index % STAT_ICON_COLORS.length]

        return (
          <div key={stat.label} className="stat-card group">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
              </div>
              {Icon && (
                <div className={cn('stat-card-icon transition-transform duration-200 group-hover:scale-110', colorClass)}>
                  <Icon className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function DataTable({ children, className, minWidth = '1000px' }) {
  return (
    <div className="data-surface overflow-x-auto">
      <table className={cn('data-table w-full border-collapse', className)} style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function StatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    inactive: 'bg-slate-100 text-slate-600 ring-slate-500/15',
    prospect: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    on_hold: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    draft: 'bg-slate-100 text-slate-600 ring-slate-500/15',
    submitted: 'bg-blue-50 text-blue-700 ring-blue-600/15',
    won: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    lost: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    planning: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    available: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    assigned: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    in_repair: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    retired: 'bg-slate-100 text-slate-600 ring-slate-500/15',
    expired: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    trial: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    received: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    overdue: 'bg-orange-50 text-orange-700 ring-orange-600/15',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  }

  const label = String(status || '').replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset',
        colors[status] || 'bg-muted text-muted-foreground ring-border'
      )}
    >
      {label}
    </span>
  )
}
