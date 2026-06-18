import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DOCUMENT_TYPE_LIST } from '@/config/documents'

export function GenerateDocumentsPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate Documents</h1>
        <p className="text-muted-foreground">
          Select a document type to create letters and certificates with live preview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCUMENT_TYPE_LIST.map((doc) => (
          <Card
            key={doc.key}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => navigate(`/dashboard/documents/generate/${doc.key}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-white', doc.color)}>
                  <doc.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{doc.label}</CardTitle>
                  <CardDescription className="text-xs">{doc.prefix}-XXX</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create single or bulk {doc.label.toLowerCase()} with unique ID
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
