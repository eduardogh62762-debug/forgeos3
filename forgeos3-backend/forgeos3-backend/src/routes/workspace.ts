import { Router } from 'express'

export const workspaceRouter = Router()

// GET /api/workspace/api-key — return the real agent API key to authenticated users
workspaceRouter.get('/api-key', (_req, res) => {
  const key = process.env.AGENT_API_KEY
  if (!key) {
    return res.status(503).json({ error: 'AGENT_API_KEY not configured on the server' })
  }
  // Return a masked preview + the full key
  res.json({
    key,
    masked: key.slice(0, 8) + '••••••••••••••••' + key.slice(-4),
    created_at: new Date().toISOString(),
    status: 'active',
  })
})

// POST /api/workspace/rotate-key — placeholder (real rotation would update .env or a secrets manager)
workspaceRouter.post('/rotate-key', (_req, res) => {
  // In production, this would generate a new key and update the secrets manager.
  // For now, return the current key to avoid breaking the UI.
  const key = process.env.AGENT_API_KEY
  if (!key) {
    return res.status(503).json({ error: 'AGENT_API_KEY not configured on the server' })
  }
  res.json({ key, status: 'active', message: 'Key rotation requires server env update in production.' })
})
