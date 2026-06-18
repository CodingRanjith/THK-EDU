import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { pool, query } from '../config/database.js'

async function seed() {
  const { email, password, name } = env.admin
  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await query('SELECT id FROM users WHERE email = $1', [email])

  if (existing.rows.length > 0) {
    console.log(`Admin user already exists: ${email}`)
  } else {
    await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')`,
      [name, email, passwordHash]
    )
    console.log(`Admin user created: ${email}`)
  }

  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
