import { loginUser, getProfile } from '../services/authService.js'

export async function login(req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const result = await loginUser(email.trim().toLowerCase(), password)

  if (result.error) {
    return res.status(result.status).json({ message: result.error })
  }

  return res.json({
    message: 'Login successful',
    token: result.token,
    user: result.user,
  })
}

export async function me(req, res) {
  const profile = await getProfile(req.user.id)

  if (!profile) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ user: profile })
}

export async function logout(_req, res) {
  return res.json({ message: 'Logged out successfully' })
}
