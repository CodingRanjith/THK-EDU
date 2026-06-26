import bcrypt from 'bcryptjs'
import {
  createEmployee,
  listEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  listActiveEmployees,
} from '../models/employeeModel.js'
import {
  getAttendanceForMonth,
  upsertAttendance,
  bulkUpsertAttendance,
} from '../models/attendanceModel.js'
import { createUser, findUserByEmail } from '../models/userModel.js'

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function formatDateKey(value) {
  if (typeof value === 'string') return value.slice(0, 10)
  const y = value.getUTCFullYear()
  const m = String(value.getUTCMonth() + 1).padStart(2, '0')
  const d = String(value.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function getEmployees(req, res) {
  const { search, status } = req.query
  const data = await listEmployees({ search, status })
  return res.json(data)
}

export async function getEmployeeStatsHandler(_req, res) {
  const stats = await getEmployeeStats()
  return res.json({ stats })
}

export async function getEmployee(req, res) {
  const employee = await getEmployeeById(req.params.id)
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' })
  }
  return res.json({ employee })
}

export async function createEmployeeHandler(req, res) {
  const {
    name,
    email,
    phone,
    department,
    designation,
    joinDate,
    status = 'active',
    createAccount = false,
    password,
    role = 'user',
  } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Employee name is required' })
  }

  let userId = null

  if (createAccount) {
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required to create a login account' })
    }

    const existing = await findUserByEmail(email.trim().toLowerCase())
    if (existing) {
      return res.status(409).json({ message: 'Email already registered as a user' })
    }

    const allowedRoles = ['admin', 'user', 'teacher', 'student']
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    })
    userId = user.id
  }

  const employee = await createEmployee({
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    department: department?.trim() || null,
    designation: designation?.trim() || null,
    joinDate: joinDate || null,
    status,
    userId,
  })

  return res.status(201).json({ message: 'Employee created', employee })
}

export async function updateEmployeeHandler(req, res) {
  const { name, email, phone, department, designation, joinDate, status } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Employee name is required' })
  }

  const employee = await updateEmployee(req.params.id, {
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    department: department?.trim() || null,
    designation: designation?.trim() || null,
    joinDate: joinDate || null,
    status: status || 'active',
  })

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' })
  }

  return res.json({ message: 'Employee updated', employee })
}

export async function removeEmployee(req, res) {
  const deleted = await deleteEmployee(req.params.id)
  if (!deleted) {
    return res.status(404).json({ message: 'Employee not found' })
  }
  return res.json({ message: 'Employee deleted' })
}

export async function getMonthlyAttendance(req, res) {
  const year = parseInt(req.query.year, 10)
  const month = parseInt(req.query.month, 10)

  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Valid year and month are required' })
  }

  const employees = await listActiveEmployees()
  const rows = await getAttendanceForMonth(year, month)
  const daysInMonth = getDaysInMonth(year, month)

  const records = {}
  for (const row of rows) {
    const empId = row.employee_id
    const dateKey = formatDateKey(row.attendance_date)
    if (!records[empId]) records[empId] = {}
    records[empId][dateKey] = row.status
  }

  const days = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      day: d,
      date: dateKey,
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    })
  }

  return res.json({ employees, records, days, year, month, daysInMonth })
}

export async function setAttendance(req, res) {
  const { employeeId, date, status } = req.body

  if (!employeeId || !date) {
    return res.status(400).json({ message: 'employeeId and date are required' })
  }

  if (status && !['present', 'absent'].includes(status)) {
    return res.status(400).json({ message: 'status must be present, absent, or null' })
  }

  const employee = await getEmployeeById(employeeId)
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' })
  }

  const record = await upsertAttendance(employeeId, date, status || null)
  return res.json({ message: 'Attendance saved', record })
}

export async function bulkSetAttendance(req, res) {
  const { records } = req.body

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'records array is required' })
  }

  for (const r of records) {
    if (!r.employeeId || !r.date) {
      return res.status(400).json({ message: 'Each record needs employeeId and date' })
    }
    if (r.status && !['present', 'absent'].includes(r.status)) {
      return res.status(400).json({ message: 'Invalid status in records' })
    }
  }

  const saved = await bulkUpsertAttendance(records)
  return res.json({ message: 'Attendance saved', count: saved.length })
}
