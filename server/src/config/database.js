import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err)
})

export async function query(text, params) {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start
  if (env.nodeEnv === 'development') {
    console.log('query', { text: text.slice(0, 80), duration, rows: result.rowCount })
  }
  return result
}
