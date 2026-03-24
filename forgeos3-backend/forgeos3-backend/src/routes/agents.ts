import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase'

export const agentsRouter = Router()

const CreateAgentSchema = z.object({
  name:             z.string().min(1).max(100),
  description:      z.string().max(500).optional(),
  runtime:          z.string().default('openclaw_v1'),
  domain_profile:   z.enum(['healthtech', 'agrotech', 'fintech', 'custom']),
  tool_pack_id:     z.string().uuid().optional(),
  policy_preset_id: z.string().uuid().optional(),
  risk_mode:        z.enum(['safe', 'normal']).default('normal'),
})

// GET /api/agents — paginated + filters
agentsRouter.get('/', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const domain = req.query.domain as string | undefined
  const status = req.query.status as string | undefined

  let query = supabase
    .from('created_agents')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (domain) query = query.eq('domain_profile', domain)
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch agents' })
  res.json({ data, total: count, limit, offset })
})

// GET /api/agents/:id
agentsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('created_agents')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Agent not found' })
  res.json(data)
})

// GET /api/agents/:id/stats
agentsRouter.get('/:id/stats', async (req, res) => {
  const agentId = req.params.id

  const { data: agent } = await supabase
    .from('created_agents')
    .select('id')
    .eq('id', agentId)
    .single()

  if (!agent) return res.status(404).json({ error: 'Agent not found' })

  const [runsResult, eventsResult] = await Promise.all([
    supabase.from('agent_runs').select('status, loop_risk_score, started_at, finished_at').eq('agent_id', agentId),
    supabase.from('tool_events').select('decision, duration_ms').eq('run_id', agentId),
  ])

  const runs   = runsResult.data  ?? []
  const events = eventsResult.data ?? []

  const totalRuns    = runs.length
  const blockedRuns  = runs.filter(r => r.status === 'blocked').length
  const finishedRuns = runs.filter(r => r.status === 'finished').length
  const avgRisk      = totalRuns ? Math.round(runs.reduce((s, r) => s + (r.loop_risk_score || 0), 0) / totalRuns) : 0
  const blockedTools = events.filter(e => e.decision === 'blocked').length
  const allowedTools = events.filter(e => e.decision === 'allowed').length
  const avgDuration  = events.filter(e => e.duration_ms).length
    ? Math.round(events.filter(e => e.duration_ms).reduce((s, e) => s + (e.duration_ms || 0), 0) / events.filter(e => e.duration_ms).length)
    : 0

  res.json({
    agentId,
    totalRuns,
    blockedRuns,
    finishedRuns,
    avgRiskScore: avgRisk,
    blockedTools,
    allowedTools,
    avgToolDurationMs: avgDuration,
  })
})

// POST /api/agents
agentsRouter.post('/', async (req, res) => {
  const parsed = CreateAgentSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  // Validate tool_pack_id if provided
  if (parsed.data.tool_pack_id) {
    const { data: pack } = await supabase.from('tool_packs').select('id').eq('id', parsed.data.tool_pack_id).single()
    if (!pack) return res.status(400).json({ error: 'Tool pack not found' })
  }

  // Validate policy_preset_id if provided
  if (parsed.data.policy_preset_id) {
    const { data: preset } = await supabase.from('policy_presets').select('id').eq('id', parsed.data.policy_preset_id).single()
    if (!preset) return res.status(400).json({ error: 'Policy preset not found' })
  }

  const { data, error } = await supabase
    .from('created_agents')
    .insert({ ...parsed.data, status: 'active' })
    .select()
    .single()
  if (error) return res.status(500).json({ error: 'Failed to create agent' })
  res.status(201).json(data)
})

// POST /api/agents/:id/deploy
agentsRouter.post('/:id/deploy', async (req, res) => {
  const { data: existing } = await supabase.from('created_agents').select('id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ error: 'Agent not found' })

  const { data, error } = await supabase
    .from('created_agents')
    .update({ status: 'active' })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: 'Failed to deploy agent' })
  res.json(data)
})

// DELETE /api/agents/:id — soft delete
agentsRouter.delete('/:id', async (req, res) => {
  const { data: existing } = await supabase.from('created_agents').select('id').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ error: 'Agent not found' })

  const { error } = await supabase
    .from('created_agents')
    .update({ status: 'inactive' })
    .eq('id', req.params.id)
  if (error) return res.status(500).json({ error: 'Failed to deactivate agent' })
  res.status(204).send()
})