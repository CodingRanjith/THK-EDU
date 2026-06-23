import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

const RESETS = [
  { type: 'intern_offer_letter', prefix: 'THK-IOL', label: 'Intern Offer Letters' },
  { type: 'internship_certificate', prefix: 'THK-IC', label: 'Internship Certificates' },
]

async function main() {
  const before = await pool.query(
    `SELECT document_type, COUNT(*)::int AS count FROM documents GROUP BY document_type ORDER BY document_type`
  )
  const seqBefore = await pool.query('SELECT prefix, last_number FROM document_sequences ORDER BY prefix')
  console.log('Before — documents:', before.rows)
  console.log('Before — sequences:', seqBefore.rows)

  for (const { type, prefix, label } of RESETS) {
    const deleted = await pool.query(
      'DELETE FROM documents WHERE document_type = $1 RETURNING document_number',
      [type]
    )
    await pool.query(
      `INSERT INTO document_sequences (prefix, last_number) VALUES ($1, 0)
       ON CONFLICT (prefix) DO UPDATE SET last_number = 0`,
      [prefix]
    )
    console.log(`Cleared ${deleted.rowCount} ${label}; ${prefix} sequence reset to 0 (next: ${prefix}-001)`)
  }

  const after = await pool.query(
    `SELECT document_type, COUNT(*)::int AS count FROM documents GROUP BY document_type ORDER BY document_type`
  )
  const seqAfter = await pool.query('SELECT prefix, last_number FROM document_sequences ORDER BY prefix')
  console.log('After — documents:', after.rows)
  console.log('After — sequences:', seqAfter.rows)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
