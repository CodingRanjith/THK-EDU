import bcrypt from 'bcryptjs'
import {
  listUsers,
  createUser,
  findUserByEmail,
  updateUserStatus,
  deleteUser,
  findUserById,
} from '../models/userModel.js'

export async function getAllUsers(_req, res) {
  const users = await listUsers()
  return res.json({ users })
}

export async function createNewUser(req, res) {
  const { name, email, password, role = 'user' } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' })
  }

  const allowedRoles = ['admin', 'user', 'teacher', 'student']
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' })
  }

  const existing = await findUserByEmail(email.trim().toLowerCase())
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await createUser({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role,
  })

  return res.status(201).json({ message: 'User created', user })
}

export async function toggleUserStatus(req, res) {
  const { id } = req.params
  const { is_active } = req.body

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active must be a boolean' })
  }

  const target = await findUserById(id)
  if (!target) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (target.id === req.user.id && !is_active) {
    return res.status(400).json({ message: 'You cannot deactivate your own account' })
  }

  const user = await updateUserStatus(id, is_active)
  return res.json({ message: 'User status updated', user })
}

export async function removeUser(req, res) {
  const { id } = req.params

  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' })
  }

  const deleted = await deleteUser(id)
  if (!deleted) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ message: 'User deleted' })
}

export async function getDashboardStats(_req, res) {
  return res.json({
    stats: {
      students: 1248,
      teachers: 86,
      courses: 42,
      batches: 18,
      revenue: '₹12.4L',
      attendance: '94%',
      pendingFees: 23,
      activeExams: 5,
    },
  })
}
