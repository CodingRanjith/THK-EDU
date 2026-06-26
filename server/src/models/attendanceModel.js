import { query } from '../config/database.js'

export async function getAttendanceForMonth(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  const result = await query(
    `SELECT employee_id, attendance_date, status
     FROM hr_attendance
     WHERE attendance_date >= $1 AND attendance_date <= $2`,
    [startDate, endDateStr]
  )

  return result.rows
}

export async function upsertAttendance(employeeId, attendanceDate, status) {
  if (!status) {
    const deleted = await query(
      `DELETE FROM hr_attendance
       WHERE employee_id = $1 AND attendance_date = $2
       RETURNING id`,
      [employeeId, attendanceDate]
    )
    return deleted.rows[0] || null
  }

  const result = await query(
    `INSERT INTO hr_attendance (employee_id, attendance_date, status)
     VALUES ($1, $2, $3)
     ON CONFLICT (employee_id, attendance_date)
     DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
     RETURNING *`,
    [employeeId, attendanceDate, status]
  )

  return result.rows[0]
}

export async function bulkUpsertAttendance(records) {
  const saved = []

  for (const record of records) {
    const row = await upsertAttendance(record.employeeId, record.date, record.status)
    if (row) saved.push(row)
  }

  return saved
}
