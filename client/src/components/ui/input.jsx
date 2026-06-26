import { cn } from '@/lib/utils'

const inputClassName =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-all duration-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'

export function Input({ className, type = 'text', ...props }) {
  return <input type={type} className={cn(inputClassName, className)} {...props} />
}

export const fieldClassName = inputClassName
