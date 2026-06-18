import { query } from '../config/database.js'

export async function findUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] || null
}

export async function findUserById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function updateLastLogin(id) {
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id])
}

export async function listUsers() {
  const result = await query(
    `SELECT id, name, email, role, is_active, avatar_url, last_login_at, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  )
  return result.rows
}

export async function createUser({ name, email, passwordHash, role = 'user' }) {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  )
  return result.rows[0]
}

export async function updateUserStatus(id, isActive) {
  const result = await query(
    `UPDATE users SET is_active = $1 WHERE id = $2
     RETURNING id, name, email, role, is_active`,
    [isActive, id]
  )
  return result.rows[0] || null
}

export async function deleteUser(id) {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id])
  return result.rows[0] || null
}
