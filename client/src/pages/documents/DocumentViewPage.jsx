import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formFields, getDocumentType } from '@/config/documents'
import { renderDocumentPreview } from '@/lib/documentPreview'
import { documentsApi } from '@/lib/api'
import { downloadDocumentPdf } from '@/lib/pdfDownload'
import { useAlert } from '@/context/AlertContext'

export function DocumentViewPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useAlert()
  const isEdit = searchParams.get('edit') === '1'

  const [document, setDocument] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    documentsApi
      .get(id)
      .then((res) => {
        setDocument(res.data.document)
        setFormData(res.data.document.form_data || {})
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <p className="text-muted-foreground">Loading document...</p>
  }

  if (!document) {
    return <p className="text-destructive">Document not found</p>
  }

  const docType = getDocumentType(document.document_type)
  const fields = formFields[document.document_type] || []
  const previewHtml = isEdit
    ? renderDocumentPreview(document.document_type, formData, document.document_number)
    : document.html_content

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await documentsApi.update(id, { formData })
      setDocument(res.data.document)
      setFormData(res.data.document.form_data)
      showSuccess('Updated', `${document.document_number} saved successfully.`)
      navigate(`/dashboard/documents/management/${id}`)
    } catch (err) {
      showError('Update Failed', err.response?.data?.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async () => {
    try {
      await downloadDocumentPdf(
        documentsApi,
        id,
        document.document_number,
        document.recipient_name
      )
    } catch {
      showError('Download Failed', 'Could not generate PDF. Please try again.')
    }
  }

  const renderField = (field) => {
    const common = {
      id: field.name,
      value: formData[field.name] || '',
      onChange: (e) => updateField(field.name, e.target.value),
      disabled: !isEdit,
    }

    if (field.type === 'textarea') {
      return <Textarea {...common} rows={field.rows || 3} />
    }
    if (field.type === 'date') {
      return <Input {...common} type="date" />
    }
    return <Input {...common} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/documents/management')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold font-mono">{document.document_number}</h1>
            <p className="text-sm text-muted-foreground">{docType?.label} — {document.recipient_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          {!isEdit && (
            <Button size="sm" onClick={() => navigate(`/dashboard/documents/management/${id}?edit=1`)}>
              Edit
            </Button>
          )}
          {isEdit && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          )}
        </div>
      </div>


      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isEdit ? 'Edit Details' : 'Document Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {renderField(field)}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-lg border bg-white overflow-auto max-h-[calc(100vh-14rem)]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
