import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import {
  findUserByEmail,
  findUserById,
  updateLastLogin,
} from '../models/userModel.js'
import { sanitizeUser } from '../utils/user.js'

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  )
}

export async function loginUser(email, password) {
  const user = await findUserByEmail(email)

  if (!user) {
    return { error: 'Invalid email or password', status: 401 }
  }

  if (!user.is_active) {
    return { error: 'Account is deactivated. Contact administrator.', status: 403 }
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return { error: 'Invalid email or password', status: 401 }
  }

  await updateLastLogin(user.id)
  const token = signToken(user)

  return {
    token,
    user: sanitizeUser(user),
  }
}

export async function getProfile(userId) {
  const user = await findUserById(userId)
  if (!user || !user.is_active) return null
  return sanitizeUser(user)
}
