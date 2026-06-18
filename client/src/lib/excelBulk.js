import { defaultFormData, formFields } from '@/config/documents'

let xlsxPromise = null

async function getXlsx() {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx').then((mod) => mod.default || mod)
  }
  return xlsxPromise
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function buildHeaderMap(columns) {
  const map = {}
  for (const col of columns) {
    map[normalizeHeader(col.header)] = col.key
    map[normalizeHeader(col.key)] = col.key
  }
  return map
}

function parseExcelDate(value, XLSX) {
  if (!value && value !== 0) return ''
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      const mm = String(parsed.m).padStart(2, '0')
      const dd = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${mm}-${dd}`
    }
  }
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return str
}

export function getExcelColumns(documentType) {
  const fields = formFields[documentType] || []
  return fields.map((f) => ({
    key: f.name,
    header: f.label,
    required: !!f.required,
    type: f.type,
  }))
}

export async function downloadExcelTemplate(documentType, docLabel) {
  const XLSX = await getXlsx()
  const columns = getExcelColumns(documentType)
  const headers = columns.map((c) => c.header)
  const sampleRow = columns.map((c) => {
    if (c.type === 'date') return '2026-06-01'
    if (c.key === 'issueDate') return new Date().toISOString().split('T')[0]
    return ''
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `${docLabel.replace(/\s+/g, '_')}_Template.xlsx`)
}

export async function parseExcelFile(file, documentType) {
  const XLSX = await getXlsx()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (rows.length < 2) {
          reject(new Error('Excel file is empty or has no data rows'))
          return
        }

        const columns = getExcelColumns(documentType)
        const headerMap = buildHeaderMap(columns)
        const headers = rows[0].map((h) => headerMap[normalizeHeader(h)] || null)

        const defaults = { ...defaultFormData[documentType] }
        const parsed = []
        const errors = []

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const isEmpty = row.every((cell) => !String(cell || '').trim())
          if (isEmpty) continue

          const formData = { ...defaults }
          let hasData = false

          headers.forEach((key, colIndex) => {
            if (!key) return
            const raw = row[colIndex]
            if (raw === '' || raw === undefined || raw === null) return
            hasData = true
            const field = columns.find((c) => c.key === key)
            formData[key] = field?.type === 'date' ? parseExcelDate(raw, XLSX) : String(raw).trim()
          })

          if (!hasData) continue

          const missing = columns
            .filter((c) => c.required && !String(formData[c.key] || '').trim())
            .map((c) => c.header)

          if (missing.length > 0) {
            errors.push({ row: i + 1, missing, formData })
          } else {
            parsed.push({ row: i + 1, formData })
          }
        }

        resolve({ rows: parsed, errors, totalRows: rows.length - 1 })
      } catch {
        reject(new Error('Failed to read Excel file. Please use the correct template.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
