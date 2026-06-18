export function sanitizeUser(user) {
  if (!user) return null
  const { password_hash, ...safe } = user
  return safe
}
