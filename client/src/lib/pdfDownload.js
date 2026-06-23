export function sanitizePdfName(value = '') {
  return String(value)
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'Document'
}

export function buildPdfFilename(documentNumber, recipientName) {
  const name = sanitizePdfName(recipientName)
  return `${name}_${documentNumber}.pdf`
}

export function downloadPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadDocumentPdf(documentsApi, id, documentNumber, recipientName) {
  const res = await documentsApi.download(id)
  const blob = new Blob([res.data], { type: 'application/pdf' })
  downloadPdfBlob(blob, buildPdfFilename(documentNumber, recipientName))
}

export async function downloadDocumentsBulk(documentsApi, documents) {
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i]
    await downloadDocumentPdf(
      documentsApi,
      doc.id,
      doc.document_number,
      doc.recipient_name
    )
    if (i < documents.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 400))
    }
  }
}
