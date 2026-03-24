import { Router } from 'express'
import { supabase } from '../db/supabase'

export const dashboardRouter = Router()

dashboardRouter.get('/stats', async (_req, res) => {
  try {
    // Run all queries in parallel
    const [
      runsResult,
      toolEventsResult,
      approvalsResult,
      agentsResult,
      recentRunsResult,
      recentApprovalsResult,
    ] = await Promise.all([
      // Total runs + by status
      supabase.from('agent_runs').select('status, loop_risk_score, domain'),

      // Tool events decisions
      supabase.from('tool_events').select('decision, risk_score, tool_name'),

      // Approvals by status
      supabase.from('approval_requests').select('status, domain, created_at'),

      // Active agents count
      supabase.from('created_agents').select('id, status'),

      // 5 most recent runs
      supabase
        .from('agent_runs')
        .select('id, agent_name, domain, status, loop_risk_score, started_at')
        .order('started_at', { ascending: false })
        .limit(5),

      // Pending approvals
      supabase
        .from('approval_requests')
        .select('id, agent_name, domain, tool_name, reason, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    const runs        = runsResult.data        ?? []
    const toolEvents  = toolEventsResult.data  ?? []
    const approvals   = approvalsResult.data   ?? []
    const agents      = agentsResult.data      ?? []

    // Compute stats
    const totalRuns       = runs.length
    const runsByStatus    = runs.reduce((acc: Record<string, number>, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {})

    const totalAllowed    = toolEvents.filter(e => e.decision === 'allowed').length
    const totalBlocked    = toolEvents.filter(e => e.decision === 'blocked').length
    const totalApproval   = toolEvents.filter(e => e.decision === 'approval_required').length
    const avgRiskScore    = runs.length
      ? Math.round(runs.reduce((s, r) => s + (r.loop_risk_score ?? 0), 0) / runs.length)
      : 0
    const highRiskRuns    = runs.filter(r => (r.loop_risk_score ?? 0) > 30).length

    const pendingApprovals = approvals.filter(a => a.status === 'pending').length
    const activeAgents     = agents.filter(a => a.status === 'active').length

    const runsByDomain = runs.reduce((acc: Record<string, number>, r) => {
      acc[r.domain] = (acc[r.domain] || 0) + 1
      return acc
    }, {})

      // Security Pulse (Pro)
      const totalValueProtected = toolEvents
        .filter(e => e.decision === 'blocked')
        .reduce((sum, e) => {
          // If fintech transfer, use the amount from the input payload
          const input = (e as any).input || {}
          if (input.amount) return sum + Number(input.amount)
          // Default savings for other blocked malicious actions
          return sum + 250 
        }, 0)

      res.json({
        // Core metrics
        totalRuns,
        activeAgents,
        pendingApprovals,
        totalBlocked,
        totalAllowed,
        totalApprovalRequired: totalApproval,
        avgRiskScore,
        highRiskRuns,

        // Breakdowns
        runsByStatus,
        runsByDomain,

        // Recent data for dashboard widgets
        recentRuns:      recentRunsResult.data      ?? [],
        pendingList:     recentApprovalsResult.data  ?? [],

        // Security Pulse (Pro)
        securityPulse: {
          totalValueProtected,
          safetyScore: Math.round((totalAllowed / (totalAllowed + totalBlocked + 1)) * 100),
          shieldStatus: totalBlocked > 5 ? 'Elite' : 'Active',
          lastAttackBlocked: toolEvents.find(e => e.decision === 'blocked')?.tool_name || 'None'
        }
      })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})


// GET /api/dashboard/tokens — token efficiency metrics
dashboardRouter.get('/tokens', async (_req, res) => {
  try {
    const [runsResult, eventsResult] = await Promise.all([
      supabase
        .from('agent_runs')
        .select('id, agent_name, domain, total_tokens, status'),
      supabase
        .from('tool_events')
        .select('decision, token_usage, tool_name, run_id'),
    ])

    const runs   = runsResult.data  ?? []
    const events = eventsResult.data ?? []

    // Total tokens used across all runs
    const totalTokensUsed = runs.reduce((s, r) => s + (r.total_tokens ?? 0), 0)

    // Tokens saved by policy blocking tools
    const tokensSavedByPolicy = events
      .filter(e => e.decision === 'blocked')
      .reduce((s, e) => s + ((e.token_usage as Record<string,number>)?.saved ?? 500), 0)

    // Avg tokens per run
    const runsWithTokens = runs.filter(r => (r.total_tokens ?? 0) > 0)
    const avgTokensPerRun = runsWithTokens.length
      ? Math.round(totalTokensUsed / runsWithTokens.length)
      : 0

    // Tokens by domain
    const tokensByDomain: Record<string, number> = {}
    for (const run of runs) {
      if (run.domain && run.total_tokens) {
        tokensByDomain[run.domain] = (tokensByDomain[run.domain] || 0) + run.total_tokens
      }
    }

    // Most expensive tools
    const toolCosts: Record<string, { total: number; count: number }> = {}
    for (const e of events) {
      if (e.decision !== 'blocked') {
        const cost = (e.token_usage as Record<string,number>)?.total ?? 0
        if (!toolCosts[e.tool_name]) toolCosts[e.tool_name] = { total: 0, count: 0 }
        toolCosts[e.tool_name].total += cost
        toolCosts[e.tool_name].count += 1
      }
    }

    const topTools = Object.entries(toolCosts)
      .map(([name, { total, count }]) => ({
        toolName: name,
        totalTokens: total,
        avgTokens: Math.round(total / count),
        calls: count,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, 5)

    // Efficiency ratio — tokens saved / total potential
    const totalPotential = totalTokensUsed + tokensSavedByPolicy
    const efficiencyPct  = totalPotential > 0
      ? Math.round((tokensSavedByPolicy / totalPotential) * 100)
      : 0

    res.json({
      totalTokensUsed,
      tokensSavedByPolicy,
      avgTokensPerRun,
      efficiencyPct,
      tokensByDomain,
      topTools,
      message: `Policy Engine saved ${tokensSavedByPolicy} tokens by blocking ${events.filter(e => e.decision === 'blocked').length} tool calls`,
    })
  } catch {
    res.status(500).json({ error: 'Failed to fetch token metrics' })
  }
})