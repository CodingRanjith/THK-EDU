import * as XLSX from 'xlsx'

export function exportToExcel({ filename, sheetName, columns, rows }) {
  const header = columns.map((col) => col.label)
  const data = rows.map((row) =>
    columns.map((col) => {
      const value = col.getValue ? col.getValue(row) : row[col.key]
      return value ?? ''
    })
  )

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...data])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

export function formatCurrency(value) {
  if (value == null || value === '') return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export function formatLabel(value) {
  if (!value) return '—'
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
