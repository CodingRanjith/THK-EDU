import { useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { findNavItemByPath } from '@/config/navigation'

export function PlaceholderPage() {
  const location = useLocation()
  const navItem = findNavItemByPath(location.pathname)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{navItem?.title || 'Page'}</h1>
        <p className="text-muted-foreground">
          This module is ready for development. Connect your business logic here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{navItem?.title} Module</CardTitle>
          <CardDescription>
            Part of the Techackode Edutech management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Route: <code className="rounded bg-muted px-1.5 py-0.5">{location.pathname}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
