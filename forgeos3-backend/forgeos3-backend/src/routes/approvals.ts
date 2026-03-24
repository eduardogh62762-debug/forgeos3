import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { logAuditEvent } from '../engine/auditLayer'

export const approvalsRouter = Router()

// ── GET /api/approvals — paginated ────────────────────────────
approvalsRouter.get('/', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  as string) || 20, 100)
  const offset = parseInt(req.query.offset as string) || 0
  const status = req.query.status as string | undefined
  const domain = req.query.domain as string | undefined

  let query = supabase
    .from('approval_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)
  if (domain) query = query.eq('domain', domain)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch approvals' })
  res.json({ data, total: count, limit, offset })
})

// ── GET /api/approvals/:id ────────────────────────────────────
approvalsRouter.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('id', req.params.id)
    .single()
  if (error) return res.status(404).json({ error: 'Approval not found' })
  res.json(data)
})

// ── POST /api/approvals/request ───────────────────────────────
const RequestSchema = z.object({
  runId:     z.string().uuid(),
  agentId:   z.string(),
  agentName: z.string(),
  domain:    z.enum(['healthtech', 'agrotech', 'fintech', 'custom']),
  toolName:  z.string(),
  payload:   z.record(z.unknown()).default({}),
  reason:    z.string(),
})

approvalsRouter.post('/request', async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { runId, agentId, agentName, domain, toolName, payload, reason } = parsed.data

  // Validate run exists and belongs to the agent
  const { data: run } = await supabase
    .from('agent_runs')
    .select('id, agent_id')
    .eq('id', runId)
    .single()

  if (!run) return res.status(404).json({ error: 'Run not found' })
  if (run.agent_id !== agentId) return res.status(403).json({ error: 'Run does not belong to this agent' })

  // Update run status to waiting_approval
  await supabase
    .from('agent_runs')
    .update({ status: 'waiting_approval' })
    .eq('id', runId)

  const { data, error } = await supabase
    .from('approval_requests')
    .insert({
      run_id:     runId,
      agent_id:   agentId,
      agent_name: agentName,
      domain,
      tool_name:  toolName,
      payload,
      reason,
      status:     'pending',
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to create approval request' })

  await logAuditEvent({
    type:    'approval_requested',
    runId,
    agentId,
    domain,
    data:    { toolName, reason },
  })

  res.status(201).json(data)
})

// ── POST /api/approvals/:id/resolve ───────────────────────────
const ResolveSchema = z.object({
  // Accept both 'status' (agent) and 'decision' (UI) for the same field
  status:     z.enum(['approved', 'rejected']).optional(),
  decision:   z.enum(['approved', 'rejected']).optional(),
  reviewedBy: z.string().optional(),
}).refine(d => d.status || d.decision, { message: 'Either status or decision is required' })

approvalsRouter.post('/:id/resolve', async (req, res) => {
  const parsed = ResolveSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const resolvedStatus = (parsed.data.status ?? parsed.data.decision) as 'approved' | 'rejected'
  const reviewedBy = parsed.data.reviewedBy ?? 'system'

  // Validate approval exists and is still pending
  const { data: existing } = await supabase
    .from('approval_requests')
    .select('id, status, run_id')
    .eq('id', req.params.id)
    .single()

  if (!existing) return res.status(404).json({ error: 'Approval not found' })
  if (existing.status !== 'pending') return res.status(400).json({ error: `Approval is already ${existing.status}` })

  const { data, error } = await supabase
    .from('approval_requests')
    .update({
      status:      resolvedStatus,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to resolve approval' })

  // Update run status back to running if approved, blocked if rejected
  await supabase
    .from('agent_runs')
    .update({ status: resolvedStatus === 'approved' ? 'running' : 'blocked' })
    .eq('id', existing.run_id)

  await logAuditEvent({
    type:  'approval_resolved',
    runId: existing.run_id,
    data:  { approvalId: req.params.id, status: resolvedStatus, reviewedBy },
  })

  res.json(data)
})