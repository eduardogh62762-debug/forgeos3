import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { logAuditEvent } from '../engine/auditLayer'

export const runsRouter = Router()

// ── GET /api/runs — paginated ─────────────────────────────────
runsRouter.get('/', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const domain = req.query.domain as string | undefined
  const status = req.query.status as string | undefined

  let query = supabase
    .from('agent_runs')
    .select('*, tool_events(*)', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (domain) query = query.eq('domain', domain)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query

  if (error) return res.status(500).json({ error: 'Failed to fetch runs' })
  res.json({ data, total: count, limit, offset })
})

// ── GET /api/runs/:id ─────────────────────────────────────────
runsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*, tool_events(*), approval_requests(*)')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Run not found' })
  res.json(data)
})

// ── GET /api/runs/:id/tools ───────────────────────────────────
runsRouter.get('/:id/tools', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  as string) || 50, 200)
  const offset = parseInt(req.query.offset as string) || 0

  const { data, error, count } = await supabase
    .from('tool_events')
    .select('*', { count: 'exact' })
    .eq('run_id', req.params.id)
    .order('timestamp', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return res.status(500).json({ error: 'Failed to fetch tool events' })
  res.json({ data, total: count, limit, offset })
})

// ── POST /api/runs/start ──────────────────────────────────────
const StartRunSchema = z.object({
  agentId:   z.string(),
  agentName: z.string(),
  domain:    z.enum(['healthtech', 'agrotech', 'fintech', 'custom']),
  input:     z.string(),
})

runsRouter.post('/start', async (req, res) => {
  const parsed = StartRunSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { agentId, agentName, domain, input } = parsed.data

  // Validate agent exists
  const { data: agent } = await supabase
    .from('created_agents')
    .select('id')
    .eq('id', agentId)
    .single()

  if (!agent) return res.status(404).json({ error: 'Agent not found' })

  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      agent_id:        agentId,
      agent_name:      agentName,
      domain,
      input,
      status:          'running',
      loop_risk_score: 0,
      started_at:      new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to start run' })

  await logAuditEvent({
    type:    'run_started',
    runId:   data.id,
    agentId,
    domain,
    data:    { agentName, input },
  })

  res.status(201).json(data)
})

// ── POST /api/runs/finish ─────────────────────────────────────
const FinishRunSchema = z.object({
  runId:  z.string().uuid(),
  status: z.enum(['finished', 'blocked', 'safe_mode']),
  output: z.string().optional(),
})

runsRouter.post('/finish', async (req, res) => {
  const parsed = FinishRunSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { runId, status, output } = parsed.data

  // Validate run exists
  const { data: existing } = await supabase
    .from('agent_runs')
    .select('id')
    .eq('id', runId)
    .single()

  if (!existing) return res.status(404).json({ error: 'Run not found' })

  const { data, error } = await supabase
    .from('agent_runs')
    .update({ status, output: output ?? null, finished_at: new Date().toISOString() })
    .eq('id', runId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to finish run' })

  await logAuditEvent({
    type:  'run_finished',
    runId,
    data:  { status, output },
  })

  res.json(data)
})