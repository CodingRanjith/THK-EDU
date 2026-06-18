export function downloadPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadDocumentPdf(documentsApi, id, documentNumber) {
  const res = await documentsApi.download(id)
  const blob = new Blob([res.data], { type: 'application/pdf' })
  downloadPdfBlob(blob, `${documentNumber}.pdf`)
}
