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
    .map((url) => url.trim())
    .filter(Boolean)

  return [...new Set(urls)]
}

const clientUrls = parseClientUrls(process.env.CLIENT_URL)

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
