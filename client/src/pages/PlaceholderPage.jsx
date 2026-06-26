import { useLocation, Link } from 'react-router-dom'
import { Construction, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader, EmptyState } from '@/components/ui/page'
import { findNavItemByPath } from '@/config/navigation'

export function PlaceholderPage() {
  const location = useLocation()
  const navItem = findNavItemByPath(location.pathname)

  return (
    <div className="space-y-8">
      <PageHeader
        title={navItem?.title || 'Module'}
        description="This module is scaffolded and ready for business logic integration."
      />

      <EmptyState
        icon={Construction}
        title={`${navItem?.title || 'Module'} coming soon`}
        description="The navigation, routing, and layout shell are in place. Connect APIs and UI workflows when you're ready to activate this section."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Developer note</CardTitle>
          <CardDescription>Route registered in the application shell</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="rounded-lg bg-muted px-3 py-2 text-sm font-mono">{location.pathname}</code>
        </CardContent>
      </Card>
    </div>
  )
}
