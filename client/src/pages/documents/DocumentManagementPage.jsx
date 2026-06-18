import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Edit, Eye, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DOCUMENT_TYPE_LIST } from '@/config/documents'
import { documentsApi } from '@/lib/api'
import { downloadDocumentPdf } from '@/lib/pdfDownload'
import { useAlert } from '@/context/AlertContext'

export function DocumentManagementPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()
  const [documents, setDocuments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchDocuments = () => {
    setLoading(true)
    documentsApi
      .list({ search: search || undefined, type: typeFilter || undefined })
      .then((res) => {
        setDocuments(res.data.documents)
        setTotal(res.data.total)
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDocuments()
  }, [typeFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDocuments()
  }

  const handleDelete = async (id, docNumber) => {
    if (!window.confirm(`Delete ${docNumber} permanently?`)) return

    try {
      await documentsApi.remove(id)
      showSuccess('Deleted', `${docNumber} has been removed.`)
      fetchDocuments()
    } catch (err) {
      showError('Delete Failed', err.response?.data?.message || 'Could not delete document.')
    }
  }

  const handleDownload = async (id, docNumber) => {
    try {
      await downloadDocumentPdf(documentsApi, id, docNumber)
    } catch {
      showError('Download Failed', 'Could not generate PDF. Please try again.')
    }
  }

  const getTypeLabel = (key) =>
    DOCUMENT_TYPE_LIST.find((t) => t.key === key)?.label || key

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
        <p className="text-muted-foreground">
          View, edit, and download all generated documents ({total} total)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Documents</CardTitle>
          <CardDescription>Unique IDs like THK-OL-001, THK-IOL-002, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or title..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {DOCUMENT_TYPE_LIST.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <Button type="submit" variant="secondary">Search</Button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No documents found. Generate your first document to see it here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Document ID</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Recipient</th>
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Created</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono font-medium text-primary">
                        {doc.document_number}
                      </td>
                      <td className="py-3 pr-4">{getTypeLabel(doc.document_type)}</td>
                      <td className="py-3 pr-4">{doc.recipient_name}</td>
                      <td className="py-3 pr-4 max-w-[200px] truncate">{doc.title}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 capitalize">
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View"
                            onClick={() => navigate(`/dashboard/documents/management/${doc.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => navigate(`/dashboard/documents/management/${doc.id}?edit=1`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Download PDF"
                            onClick={() => handleDownload(doc.id, doc.document_number)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Delete"
                            onClick={() => handleDelete(doc.id, doc.document_number)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
