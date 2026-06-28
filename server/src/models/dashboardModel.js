import { query } from '../config/database.js'

function currentMonthRange() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

function formatIndianCompact(amount) {
  const n = Number(amount) || 0
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export async function getDashboardStats() {
  const { startDate, endDate } = currentMonthRange()

  const [usersResult, revenueResult, attendanceResult, pendingFeesResult] =
    await Promise.all([
      query(
        `SELECT
          COUNT(*) FILTER (WHERE role = 'student' AND is_active = true)::int AS students,
          COUNT(*) FILTER (WHERE role = 'teacher' AND is_active = true)::int AS teachers
         FROM users`
      ),
      query(
        `SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'received'), 0)::float AS revenue
         FROM finance_receivables
         WHERE transaction_date >= $1 AND transaction_date <= $2`,
        [startDate, endDate]
      ),
      query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'present')::int AS present,
          COUNT(*)::int AS total
         FROM hr_attendance
         WHERE attendance_date >= $1 AND attendance_date <= $2`,
        [startDate, endDate]
      ),
      query(
        `SELECT COUNT(*)::int AS pending_fees
         FROM finance_receivables
         WHERE status IN ('pending', 'overdue')`
      ),
    ])

  const users = usersResult.rows[0]
  const revenue = revenueResult.rows[0].revenue
  const attendance = attendanceResult.rows[0]
  const pendingFees = pendingFeesResult.rows[0].pending_fees

  const attendancePct =
    attendance.total > 0 ? `${Math.round((attendance.present / attendance.total) * 100)}%` : '—'

  return {
    students: users.students,
    teachers: users.teachers,
    courses: 0,
    batches: 0,
    revenue: formatIndianCompact(revenue),
    attendance: attendancePct,
    pendingFees,
    activeExams: 0,
  }
}

export async function getRecentActivity(limit = 8) {
  const result = await query(
    `SELECT text, created_at, module FROM (
      SELECT CONCAT('New client "', client_name, '" added') AS text, created_at, 'client' AS module
      FROM it_clients
      UNION ALL
      SELECT CONCAT('Project "', project_name, '" created'), created_at, 'project'
      FROM it_projects
      UNION ALL
      SELECT CONCAT('Proposal "', proposal_name, '" added'), created_at, 'proposal'
      FROM it_proposals
      UNION ALL
      SELECT CONCAT('Employee "', name, '" added to HR'), created_at, 'employee'
      FROM hr_employees
      UNION ALL
      SELECT CONCAT('Document "', COALESCE(title, document_number), '" generated'), created_at, 'document'
      FROM documents
      UNION ALL
      SELECT CONCAT('Receivable from ', party_name, ' — ₹', TRIM(TO_CHAR(amount, '999,999,999'))) AS text, created_at, 'finance'
      FROM finance_receivables
      WHERE status = 'received'
      UNION ALL
      SELECT CONCAT('Payable to ', party_name, ' recorded'), created_at, 'finance'
      FROM finance_payables
      WHERE status = 'paid'
      UNION ALL
      SELECT CONCAT(INITCAP(role), ' account created: ', name), created_at, 'user'
      FROM users
    ) activity
    ORDER BY created_at DESC
    LIMIT $1`,
    [limit]
  )

  return result.rows
}
