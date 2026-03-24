import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
dotenv.config()

import { registryRouter  } from './routes/registry'
import { agentsRouter    } from './routes/agents'
import { runsRouter      } from './routes/runs'
import { toolsRouter     } from './routes/tools'
import { approvalsRouter } from './routes/approvals'
import { authRouter      } from './routes/auth'
import { sandboxRouter   } from './routes/sandbox'
import { dashboardRouter } from './routes/dashboard'
import { auditRouter     } from './routes/audit'
import { workspaceRouter } from './routes/workspace'
import { errorHandler    } from './middleware/errorHandler'
import { authMiddleware  } from './middleware/auth'
import { sanitizeInput   } from './middleware/sanitize'
import { logger          } from './lib/logger'

const app = express()

// ── Security ─────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL ?? '',
  ].filter(Boolean),
  credentials: true,
}))

// ── Rate limiting ────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later' },
})

const agentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Agent rate limit exceeded' },
})

app.use(globalLimiter)

// ── Request logging ──────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}))

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(sanitizeInput)

// ── Health check (detailed) ──────────────────────────────────
app.get('/health', async (_req, res) => {
  const start = Date.now()
  try {
    const { supabase } = await import('./db/supabase')
    await supabase.from('domain_profiles').select('id').limit(1)
    const latency = Date.now() - start
    res.json({
      status:    'ok',
      service:   'forgeos3-backend',
      timestamp: new Date().toISOString(),
      database:  { status: 'connected', latency_ms: latency },
      uptime:    Math.round(process.uptime()),
    })
  } catch {
    res.status(503).json({
      status:    'degraded',
      service:   'forgeos3-backend',
      timestamp: new Date().toISOString(),
      database:  { status: 'unreachable' },
    })
  }
})

// ── Routes — Public ──────────────────────────────────────────
app.use('/api/auth', authLimiter, authRouter)
app.use('/api',      registryRouter)

// ── Routes — Protected (JWT required) ────────────────────────
app.use('/api/agents',    authMiddleware, agentsRouter)
app.use('/api/runs',      authMiddleware, agentLimiter, runsRouter)
app.use('/api/tools',     authMiddleware, agentLimiter, toolsRouter)
app.use('/api/approvals', authMiddleware, approvalsRouter)
app.use('/api/sandbox',   authMiddleware, sandboxRouter)
app.use('/api/dashboard', authMiddleware, dashboardRouter)
app.use('/api/audit',     authMiddleware, auditRouter)
app.use('/api/workspace', authMiddleware, workspaceRouter)

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Error handler ────────────────────────────────────────────
app.use(errorHandler)

// ── Graceful shutdown ────────────────────────────────────────
const server = app.listen(process.env.PORT || 3001, () => {
  logger.info(`🔥 ForgeOS3 Backend running on port ${process.env.PORT || 3001}`)
})

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received — shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})