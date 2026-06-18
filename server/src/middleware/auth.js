import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { findUserById } from '../models/userModel.js'
import { sanitizeUser } from '../utils/user.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const user = await findUserById(payload.sub)

    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid or expired session' })
    }

    req.user = sanitizeUser(user)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}
