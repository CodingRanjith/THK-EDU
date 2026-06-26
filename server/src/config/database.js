import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

function getPoolConfig() {
  const config = { connectionString: env.databaseUrl }

  if (env.databaseUrl?.includes('supabase')) {
    config.ssl = { rejectUnauthorized: false }
  }

  return config
}

export const pool = new Pool(getPoolConfig())

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err)
})

function getDatabaseLabel() {
  if (!env.databaseUrl) return 'not configured'

  try {
    const url = new URL(env.databaseUrl)
    const database = url.pathname.replace(/^\//, '') || 'postgres'
    return `${database}@${url.hostname}${url.port ? `:${url.port}` : ''}`
  } catch {
    return 'PostgreSQL'
  }
}

export async function connectDatabase() {
  const label = getDatabaseLabel()

  try {
    await pool.query('SELECT 1')
    console.log(`Database connected: ${label}`)
    return true
  } catch (err) {
    console.error(`Database connection failed (${label}):`, err.message)
    throw err
  }
}

export async function query(text, params) {
  const start = Date.now()
  const result = await pool.query(text, params)
  const duration = Date.now() - start
  if (env.nodeEnv === 'development') {
    console.log('query', { text: text.slice(0, 80), duration, rows: result.rowCount })
  }
  return result
}
