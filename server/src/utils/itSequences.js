import { query } from '../config/database.js'

export async function getNextItNumber(prefix) {
  const result = await query(
    `INSERT INTO it_sequences (prefix, last_number)
     VALUES ($1, 1)
     ON CONFLICT (prefix) DO UPDATE SET last_number = it_sequences.last_number + 1
     RETURNING last_number`,
    [prefix]
  )

  const num = result.rows[0].last_number
  return `${prefix}-${String(num).padStart(3, '0')}`
}
