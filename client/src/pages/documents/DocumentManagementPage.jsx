import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Edit, Eye, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DOCUMENT_TYPE_LIST } from '@/config/documents'
import { documentsApi } from '@/lib/api'
import { downloadDocumentPdf, downloadDocumentsBulk } from '@/lib/pdfDownload'
import { useAlert } from '@/context/AlertContext'

export function DocumentManagementPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()
  const [documents, setDocuments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fetchDocuments = () => {
    setLoading(true)
    documentsApi
      .list({ search: search || undefined, type: typeFilter || undefined })
      .then((res) => {
        setDocuments(res.data.documents)
        setTotal(res.data.total)
        setSelectedIds(new Set())
      })
      .catch(() => {
        setDocuments([])
        setSelectedIds(new Set())
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchDocuments()
  }, [typeFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDocuments()
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(documents.map((doc) => doc.id)))
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

  const handleBulkDelete = async () => {
    const selected = documents.filter((doc) => selectedIds.has(doc.id))
    if (selected.length === 0) return

    const label = selected.length === 1
      ? selected[0].document_number
      : `${selected.length} documents`

    if (!window.confirm(`Delete ${label} permanently?`)) return

    setDeleting(true)
    const results = await Promise.allSettled(
      selected.map((doc) => documentsApi.remove(doc.id))
    )

    const failed = results.filter((r) => r.status === 'rejected').length
    const deleted = results.length - failed

    if (deleted > 0) {
      showSuccess('Deleted', `${deleted} document${deleted === 1 ? '' : 's'} removed.`)
    }
    if (failed > 0) {
      showError('Delete Failed', `Could not delete ${failed} document${failed === 1 ? '' : 's'}.`)
    }

    setDeleting(false)
    fetchDocuments()
  }

  const handleDownload = async (doc) => {
    try {
      await downloadDocumentPdf(
        documentsApi,
        doc.id,
        doc.document_number,
        doc.recipient_name
      )
    } catch {
      showError('Download Failed', 'Could not generate PDF. Please try again.')
    }
  }

  const handleBulkDownload = async () => {
    const selected = documents.filter((doc) => selectedIds.has(doc.id))
    if (selected.length === 0) return

    setDownloading(true)
    try {
      await downloadDocumentsBulk(documentsApi, selected)
      showSuccess(
        'Download Started',
        `${selected.length} PDF${selected.length === 1 ? '' : 's'} downloading with intern names in the filename.`
      )
    } catch {
      showError('Download Failed', 'Could not download one or more PDFs. Please try again.')
    } finally {
      setDownloading(false)
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
            {selectedIds.size > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={downloading || deleting}
                  onClick={handleBulkDownload}
                >
                  <Download className="h-4 w-4" />
                  Download Selected ({selectedIds.size})
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting || downloading}
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedIds.size})
                </Button>
              </>
            )}
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading documents...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No documents found. Generate your first document to see it here.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[960px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-14" />
                  <col className="w-28" />
                  <col className="w-36" />
                  <col className="w-32" />
                  <col className="w-44" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="w-36" />
                </colgroup>
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input accent-primary"
                        checked={documents.length > 0 && selectedIds.size === documents.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all documents"
                      />
                    </th>
                    <th className="px-3 py-3 font-medium text-center">S.No</th>
                    <th className="px-3 py-3 font-medium">Document ID</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Recipient</th>
                    <th className="px-3 py-3 font-medium">Title</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Created</th>
                    <th className="px-3 py-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={doc.id} className="border-b last:border-0 align-middle">
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input accent-primary"
                          checked={selectedIds.has(doc.id)}
                          onChange={() => toggleSelect(doc.id)}
                          aria-label={`Select ${doc.document_number}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-center text-muted-foreground font-medium">
                        {String(index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-3 font-mono font-medium text-primary whitespace-nowrap">
                        {doc.document_number}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{getTypeLabel(doc.document_type)}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{doc.recipient_name}</td>
                      <td className="px-3 py-3 truncate" title={doc.title}>{doc.title}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 capitalize">
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
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
                            onClick={() => handleDownload(doc)}
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
