import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { BRAND } from '@/config/brand'

export function NotFoundPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion className="h-8 w-8" />
        </div>

        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to={isAuthenticated ? '/dashboard' : '/login'}>
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Link>
          </Button>
          {isAuthenticated && (
            <Button asChild>
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}
        </div>

        <p className="mt-12 text-xs text-muted-foreground">{BRAND.name}</p>
      </div>
    </div>
  )
}
