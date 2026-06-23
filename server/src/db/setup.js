import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setup() {
  const schemaFiles = ['schema.sql', 'documents-schema.sql', 'it-schema.sql']

  for (const file of schemaFiles) {
    const schemaPath = path.join(__dirname, file)
    const schema = fs.readFileSync(schemaPath, 'utf8')
    console.log(`Running ${file}...`)
    await pool.query(schema)
  }

  console.log('Database schema applied successfully.')
  await pool.end()
}

setup().catch((err) => {
  console.error('Database setup failed:', err.message)
  process.exit(1)
})
