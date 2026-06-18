import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultFormData, formFields, getDocumentType } from '@/config/documents'
import { renderDocumentPreview } from '@/lib/documentPreview'
import { documentsApi } from '@/lib/api'
import { downloadExcelTemplate, getExcelColumns, parseExcelFile } from '@/lib/excelBulk'
import { useAlert } from '@/context/AlertContext'

function buildBulkAlert(results, summary) {
  const details = results.map((r) =>
    r.success
      ? `✓ Row ${r.row}: ${r.name} — ${r.document_number}`
      : `✗ Row ${r.row}: ${r.error}`
  )

  if (summary.failed === 0) {
    return { type: 'success', title: 'All Documents Created', message: `${summary.success} document(s) generated successfully.`, details }
  }
  if (summary.success === 0) {
    return { type: 'error', title: 'Bulk Upload Failed', message: `All ${summary.failed} row(s) failed. Please check your Excel data.`, details }
  }
  return {
    type: 'warning',
    title: 'Partially Completed',
    message: `${summary.success} succeeded, ${summary.failed} failed out of ${summary.total} row(s).`,
    details,
  }
}

export function DocumentGeneratorPage() {
  const { type } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError, showWarning, showAlert } = useAlert()
  const fileInputRef = useRef(null)

  const docType = getDocumentType(type)
  const fields = formFields[type] || []
  const excelColumns = getExcelColumns(type)

  const [mode, setMode] = useState('single')
  const [formData, setFormData] = useState({ ...defaultFormData[type] })
  const [recipientEmail, setRecipientEmail] = useState('')
  const [excelRows, setExcelRows] = useState([])
  const [excelFileName, setExcelFileName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!docType) navigate('/dashboard/documents/generate')
  }, [docType, navigate])

  useEffect(() => {
    setFormData({ ...defaultFormData[type] })
    setExcelRows([])
    setExcelFileName('')
  }, [type])

  if (!docType) return null

  const previewHtml = renderDocumentPreview(type, formData)

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveSingle = async () => {
    const missing = fields.filter((f) => f.required && !String(formData[f.name] || '').trim())
    if (missing.length > 0) {
      showWarning('Missing Fields', `Please fill: ${missing.map((f) => f.label).join(', ')}`)
      return
    }

    setSaving(true)
    try {
      const res = await documentsApi.create({
        documentType: type,
        formData,
        recipientEmail: recipientEmail || undefined,
      })
      showSuccess(
        'Document Created',
        `Letter generated successfully with ID ${res.data.document.document_number}`
      )
    } catch (err) {
      showError('Creation Failed', err.response?.data?.message || 'Failed to save document')
    } finally {
      setSaving(false)
    }
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const { rows, errors, totalRows } = await parseExcelFile(file, type)

      if (rows.length === 0 && errors.length === 0) {
        showWarning('Empty File', 'No valid data rows found in the Excel sheet.')
        return
      }

      setExcelRows(rows)
      setExcelFileName(file.name)

      if (errors.length > 0) {
        const details = errors.map(
          (err) => `✗ Row ${err.row}: Missing ${err.missing.join(', ')}`
        )
        showWarning(
          'Some Rows Skipped',
          `${rows.length} valid row(s) loaded. ${errors.length} row(s) skipped due to missing required fields.`,
          details
        )
      } else {
        showSuccess('Excel Loaded', `${rows.length} of ${totalRows} row(s) ready for bulk generation.`)
      }
    } catch (err) {
      showError('Upload Failed', err.message)
    }

    e.target.value = ''
  }

  const handleBulkGenerate = async () => {
    if (excelRows.length === 0) {
      showWarning('No Data', 'Please upload an Excel file first.')
      return
    }

    setSaving(true)
    try {
      const res = await documentsApi.createBulk({
        documentType: type,
        items: excelRows.map((r) => ({ row: r.row, formData: r.formData })),
      })

      const alert = buildBulkAlert(res.data.results, res.data.summary)
      showAlert(alert)

      if (res.data.summary.success > 0) {
        setExcelRows([])
        setExcelFileName('')
      }
    } catch (err) {
      showError('Bulk Upload Failed', err.response?.data?.message || 'Failed to process bulk upload')
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field, value, onChange) => {
    const common = {
      id: field.name,
      value: value || '',
      onChange: (e) => onChange(field.name, e.target.value),
      required: field.required,
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/documents/generate')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{docType.label}</h1>
            <p className="text-sm text-muted-foreground">ID format: {docType.prefix}-001</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant={mode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setMode('single')}>
            Single
          </Button>
          <Button variant={mode === 'excel' ? 'default' : 'outline'} size="sm" onClick={() => setMode('excel')}>
            Excel Bulk
          </Button>
        </div>
      </div>

      {mode === 'single' ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    {renderField(field, formData[field.name], updateField)}
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email (optional)</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <Button onClick={handleSaveSingle} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Generate &amp; Save
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Live Preview</CardTitle>
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Excel Bulk Upload</CardTitle>
            <CardDescription>
              Upload .xlsx file with columns: {excelColumns.map((c) => c.header).join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await downloadExcelTemplate(type, docType.label)
                    showSuccess('Template Downloaded', 'Excel template saved to your downloads folder.')
                  } catch {
                    showError('Download Failed', 'Could not download Excel template.')
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload Excel
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </div>

            {excelFileName && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span>
                  <strong>{excelFileName}</strong> — {excelRows.length} row(s) ready
                </span>
              </div>
            )}

            {excelRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                      <th className="p-3 font-medium">Row</th>
                      {excelColumns.map((c) => (
                        <th key={c.key} className="p-3 font-medium">{c.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelRows.slice(0, 10).map((row) => (
                      <tr key={row.row} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground">{row.row}</td>
                        {excelColumns.map((c) => (
                          <td key={c.key} className="p-3">{row.formData[c.key] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelRows.length > 10 && (
                  <p className="p-3 text-xs text-muted-foreground">
                    Showing first 10 of {excelRows.length} rows
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleBulkGenerate} disabled={saving || excelRows.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Generate {excelRows.length || 0} Document{excelRows.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
