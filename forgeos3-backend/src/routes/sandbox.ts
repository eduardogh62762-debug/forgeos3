import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { logAuditEvent } from '../engine/auditLayer'

export const sandboxRouter = Router()

// GET /api/sandbox/config — get current sandbox config
sandboxRouter.get('/config', async (_req, res) => {
  const { data, error } = await supabase
    .from('sandbox_config')
    .select('*')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

const UpdateConfigSchema = z.object({
  timeout_ms:       z.number().min(1000).max(30000).optional(),
  max_memory_mb:    z.number().min(64).max(1024).optional(),
  max_cpu_pct:      z.number().min(10).max(100).optional(),
  network_mode:     z.enum(['none', 'allowlist']).optional(),
  allowed_hosts:    z.array(z.string()).optional(),
  secret_scoping:   z.boolean().optional(),
  kill_on_timeout:  z.boolean().optional(),
})

// POST /api/sandbox/config — update sandbox config
sandboxRouter.post('/config', async (req, res) => {
  const parsed = UpdateConfigSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase
    .from('sandbox_config')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .not('id', 'is', null)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  await logAuditEvent({
    type: 'tool_evaluated',
    data: { action: 'sandbox_config_updated', changes: parsed.data },
  })

  res.json(data)
})

// POST /api/sandbox/kill — kill switch
sandboxRouter.post('/kill', async (req, res) => {
  const { runId } = req.body

  // Update sandbox status to killed
  const { data, error } = await supabase
    .from('sandbox_config')
    .update({ status: 'killed', updated_at: new Date().toISOString() })
    .not('id', 'is', null)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // If runId provided, also mark the run as blocked
  if (runId) {
    await supabase
      .from('agent_runs')
      .update({ status: 'blocked', finished_at: new Date().toISOString() })
      .eq('id', runId)

    await logAuditEvent({
      type:  'run_finished',
      runId,
      data:  { status: 'blocked', reason: 'Sandbox killed by operator' },
    })
  }

  await logAuditEvent({
    type: 'tool_blocked',
    data: { action: 'sandbox_killed', runId: runId ?? null },
  })

  res.json({ message: 'Sandbox killed', config: data })
})

// POST /api/sandbox/reset — reset sandbox to idle
sandboxRouter.post('/reset', async (_req, res) => {
  const { data, error } = await supabase
    .from('sandbox_config')
    .update({ status: 'idle', updated_at: new Date().toISOString() })
    .not('id', 'is', null)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/sandbox/start — activate sandbox
sandboxRouter.post('/start', async (_req, res) => {
  const { data, error } = await supabase
    .from('sandbox_config')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .not('id', 'is', null)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  await logAuditEvent({
    type: 'run_started',
    data: { action: 'sandbox_started' },
  })

  res.json(data)
})