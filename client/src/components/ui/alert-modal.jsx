import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const config = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-green-600 bg-green-100',
    titleClass: 'text-green-800',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600 bg-red-100',
    titleClass: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 bg-amber-100',
    titleClass: 'text-amber-800',
  },
}

export function AlertModal({ open, type = 'success', title, message, details, onClose }) {
  if (!open) return null

  const { icon: Icon, iconClass, titleClass } = config[type] || config.success

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-full', iconClass)}>
            <Icon className="h-7 w-7" />
          </div>
          <h2 className={cn('text-lg font-semibold', titleClass)}>{title}</h2>
          {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}

          {details?.length > 0 && (
            <div className="mt-4 max-h-48 w-full overflow-y-auto rounded-lg border bg-muted/30 p-3 text-left text-xs">
              {details.map((line, i) => (
                <p key={i} className={cn('py-0.5', line.startsWith('✗') && 'text-red-600', line.startsWith('✓') && 'text-green-600')}>
                  {line}
                </p>
              ))}
            </div>
          )}

          <Button onClick={onClose} className="mt-6 min-w-[120px]">
            OK
          </Button>
        </div>
      </div>
    </div>
  )
}
