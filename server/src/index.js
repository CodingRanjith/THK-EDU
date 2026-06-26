import express from 'express'
import cors from 'cors'
import { env, corsOriginCheck } from './config/env.js'
import { connectDatabase } from './config/database.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import itRoutes from './routes/itRoutes.js'
import hrRoutes from './routes/hrRoutes.js'
import assetsRoutes from './routes/assetsRoutes.js'
import financeRoutes from './routes/financeRoutes.js'

const app = express()

app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
  })
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Techackode Edutech API',
    environment: env.nodeEnv,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/it', itRoutes)
app.use('/api/hr', hrRoutes)
app.use('/api/assets', assetsRoutes)
app.use('/api/finance', financeRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})
async function startServer() {
  try {
    await connectDatabase()
  } catch {
    process.exit(1)
  }

  app.listen(env.port, () => {
    console.log(`Techackode API running on http://localhost:${env.port}`)
  })
}

startServer()
