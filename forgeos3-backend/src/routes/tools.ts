import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../db/supabase'
import { evaluatePolicy } from '../engine/policyEngine'
import { evaluateLoop }   from '../engine/loopGuard'
import { logAuditEvent }  from '../engine/auditLayer'

export const toolsRouter = Router()

// Token cost estimates per sensitivity (when blocked, these are SAVED tokens)
const TOKEN_COST: Record<string, number> = {
  low:      150,
  medium:   350,
  high:     600,
  critical: 1200,
}

const EvaluateSchema = z.object({
  runId:       z.string().uuid(),
  toolName:    z.string(),
  domain:      z.enum(['healthtech', 'agrotech', 'fintech', 'custom']),
  input:       z.record(z.unknown()).default({}),
  tokenUsage:  z.object({
    prompt:     z.number().optional(),
    completion: z.number().optional(),
    total:      z.number().optional(),
  }).optional(),
})

toolsRouter.post('/evaluate', async (req, res) => {
  const parsed = EvaluateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { runId, toolName, domain, input, tokenUsage } = parsed.data

  // 1. Get run + validate
  const { data: run, error: runError } = await supabase
    .from('agent_runs')
    .select('*, created_agents(id, policy_preset_id, risk_mode, tool_pack_id)')
    .eq('id', runId)
    .single()

  if (runError || !run) return res.status(404).json({ error: 'Run not found' })
  if (run.domain !== domain) return res.status(400).json({ error: `Run domain "${run.domain}" does not match "${domain}"` })
  if (run.status === 'finished' || run.status === 'blocked') {
    return res.status(400).json({ error: `Run is already ${run.status}` })
  }

  // 2. Get tool sensitivity
  let sensitivity: string  = 'low'
  let requiresApproval      = false
  let policyLevel: string   = 'medium'

  if (run.created_agents?.tool_pack_id) {
    const { data: toolItem } = await supabase
      .from('tool_pack_items')
      .select('sensitivity, requires_approval')
      .eq('tool_pack_id', run.created_agents.tool_pack_id)
      .eq('name', toolName)
      .single()

    if (toolItem) {
      sensitivity      = toolItem.sensitivity
      requiresApproval = toolItem.requires_approval
    }
  }

  if (run.created_agents?.policy_preset_id) {
    const { data: preset } = await supabase
      .from('policy_presets')
      .select('level')
      .eq('id', run.created_agents.policy_preset_id)
      .single()
    if (preset) policyLevel = preset.level
  }

  // 3. Evaluate policy
  const result = evaluatePolicy({
    toolName,
    domain,
    policyLevel:      policyLevel as 'low' | 'medium' | 'strict',
    sensitivity:      sensitivity as 'low' | 'medium' | 'high' | 'critical',
    riskMode:         (run.created_agents?.risk_mode ?? 'normal') as 'safe' | 'normal',
    requiresApproval,
  })

  // 4. Risk score
  const scoreMap: Record<string, number> = { low: 5, medium: 10, high: 20, critical: 35 }
  const riskScore = scoreMap[sensitivity] ?? 5

  // 5. Token usage tracking
  // If blocked → tokens SAVED (tool never ran, no LLM call needed)
  // If allowed → tokens USED (from tokenUsage param or estimated)
  const estimatedCost = TOKEN_COST[sensitivity] ?? 150
  const tokenData = result.decision === 'blocked'
    ? { prompt: 0, completion: 0, total: 0, saved: estimatedCost, estimated: true }
    : tokenUsage
      ? { ...tokenUsage, saved: 0, estimated: false }
      : { prompt: Math.round(estimatedCost * 0.7), completion: Math.round(estimatedCost * 0.3), total: estimatedCost, saved: 0, estimated: true }

  // 6. Log tool event with token data
  const { data: toolEvent } = await supabase
    .from('tool_events')
    .insert({
      run_id:      runId,
      tool_name:   toolName,
      decision:    result.decision,
      input,
      risk_score:  riskScore,
      reason:      result.reason,
      token_usage: tokenData,
      timestamp:   new Date().toISOString(),
    })
    .select()
    .single()

  // 7. Update run loop_risk_score + total_tokens
  const tokensToAdd = result.decision === 'blocked' ? 0 : (tokenData.total ?? 0)
  await supabase
    .from('agent_runs')
    .update({
      loop_risk_score: run.loop_risk_score + riskScore,
      total_tokens:    (run.total_tokens ?? 0) + tokensToAdd,
    })
    .eq('id', runId)

  // 8. Audit
  await logAuditEvent({
    type:   result.decision === 'blocked' ? 'tool_blocked' : 'tool_evaluated',
    runId,
    domain,
    data:   { toolName, decision: result.decision, reason: result.reason, riskScore, tokenData },
  })

  res.json({
    decision:    result.decision,
    reason:      result.reason,
    riskScore,
    tokenUsage:  tokenData,
    toolEventId: toolEvent?.id ?? null,
  })
})

const LogToolSchema = z.object({
  toolEventId: z.string().uuid(),
  output:      z.record(z.unknown()).optional(),
  durationMs:  z.number().optional(),
  tokenUsage:  z.object({
    prompt:     z.number().optional(),
    completion: z.number().optional(),
    total:      z.number().optional(),
  }).optional(),
})

toolsRouter.post('/log', async (req, res) => {
  const parsed = LogToolSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { toolEventId, output, durationMs, tokenUsage } = parsed.data

  const { data: existing } = await supabase
    .from('tool_events')
    .select('id, run_id, token_usage')
    .eq('id', toolEventId)
    .single()

  if (!existing) return res.status(404).json({ error: 'Tool event not found' })

  // Merge token usage if provided (real > estimated)
  const mergedTokens = tokenUsage
    ? { ...existing.token_usage, ...tokenUsage, saved: existing.token_usage?.saved ?? 0, estimated: false }
    : existing.token_usage

  const { data, error } = await supabase
    .from('tool_events')
    .update({
      output:      output ?? null,
      duration_ms: durationMs ?? null,
      token_usage: mergedTokens,
    })
    .eq('id', toolEventId)
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Failed to log tool result' })

  // Update run total_tokens if real usage provided
  if (tokenUsage?.total && existing.run_id) {
    const { data: run } = await supabase
      .from('agent_runs')
      .select('total_tokens')
      .eq('id', existing.run_id)
      .single()

    if (run) {
      await supabase
        .from('agent_runs')
        .update({ total_tokens: (run.total_tokens ?? 0) + tokenUsage.total })
        .eq('id', existing.run_id)
    }
  }

  await logAuditEvent({
    type: 'tool_executed',
    data: { toolEventId, durationMs, tokenUsage },
  })

  res.json(data)
})

const LoopSchema = z.object({
  runId: z.string().uuid(),
})

toolsRouter.post('/evaluate-loop', async (req, res) => {
  const parsed = LoopSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { runId } = parsed.data

  const { data: run } = await supabase
    .from('agent_runs')
    .select('id')
    .eq('id', runId)
    .single()

  if (!run) return res.status(404).json({ error: 'Run not found' })

  const { data: events, error } = await supabase
    .from('tool_events')
    .select('tool_name, decision, risk_score, timestamp')
    .eq('run_id', runId)
    .order('timestamp', { ascending: true })

  if (error) return res.status(500).json({ error: 'Failed to fetch tool events' })

  const result = evaluateLoop(
    (events ?? []).map(e => ({
      toolName:  e.tool_name,
      decision:  e.decision,
      riskScore: e.risk_score,
      timestamp: e.timestamp,
    }))
  )

  await supabase
    .from('agent_runs')
    .update({ loop_risk_score: result.score })
    .eq('id', runId)

  if (result.recommendation !== 'normal') {
    await logAuditEvent({
      type:  'loop_risk_escalated',
      runId,
      data:  { score: result.score, recommendation: result.recommendation, reason: result.reason },
    })
  }

  res.json(result)
})