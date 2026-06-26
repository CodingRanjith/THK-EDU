import dotenv from 'dotenv'

dotenv.config()

const required = ['DATABASE_URL', 'JWT_SECRET']

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not set in environment variables`)
  }
}

const defaultClientUrl = 'http://localhost:5173'

function parseClientUrls(value) {
  const urls = (value || defaultClientUrl)
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean)

  return [...new Set(urls)]
}

function isAllowedOrigin(origin, allowedUrls) {
  if (!origin) return true

  const normalized = origin.replace(/\/$/, '')
  if (allowedUrls.includes(normalized)) return true

  // Allow any Netlify site when explicitly enabled (e.g. preview deploys)
  if (process.env.CORS_ALLOW_NETLIFY === 'true' && /\.netlify\.app$/.test(normalized)) {
    return true
  }

  return false
}

const clientUrls = parseClientUrls(process.env.CLIENT_URL)

export function corsOriginCheck(origin, callback) {
  if (isAllowedOrigin(origin, clientUrls)) {
    callback(null, true)
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`CORS blocked origin: ${origin}`)
  }

  callback(null, false)
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: clientUrls[0],
  clientUrls,
  supabase: {
    url: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    jwksUrl: process.env.SUPABASE_JWKS_URL,
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@techackode.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    name: process.env.ADMIN_NAME || 'Techackode Admin',
  },
}
