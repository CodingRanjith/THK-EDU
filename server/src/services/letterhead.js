import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
let letterheadDataUri = null

export function getLetterheadDataUri() {
  if (!letterheadDataUri) {
    const buffer = readFileSync(join(__dirname, '../../../client/src/assets/head.png'))
    letterheadDataUri = `data:image/png;base64,${buffer.toString('base64')}`
  }
  return letterheadDataUri
}
