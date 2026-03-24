export interface ToolEventSnapshot {
  toolName:   string
  decision:   string
  riskScore:  number
  timestamp:  string
}

export type LoopRecommendation = 'normal' | 'safe_mode' | 'kill'

export interface LoopGuardResult {
  score:          number
  recommendation: LoopRecommendation
  reason:         string
}

const SENSITIVITY_SCORE: Record<string, number> = {
  low:      2,
  medium:   5,
  high:     10,
  critical: 20,
}

export function evaluateLoop(events: ToolEventSnapshot[]): LoopGuardResult {
  if (events.length === 0) {
    return { score: 0, recommendation: 'normal', reason: 'No events to evaluate' }
  }

  let score = 0

  // Detect repeated tools in last 6 events
  const recent = events.slice(-6)
  const toolCounts: Record<string, number> = {}
  for (const e of recent) {
    toolCounts[e.toolName] = (toolCounts[e.toolName] || 0) + 1
  }

  for (const [tool, count] of Object.entries(toolCounts)) {
    if (count >= 2) {
      // Each repeat beyond first adds score
      score += (count - 1) * 8
      console.log(`[LoopGuard] Tool "${tool}" repeated ${count} times in last 6 events — +${(count - 1) * 8} score`)
    }
  }

  // Add base risk from recent events
  for (const e of recent) {
    score += e.riskScore * 0.3
  }

  score = Math.round(score)

  if (score >= 50) {
    return {
      score,
      recommendation: 'kill',
      reason: `Critical loop risk (score ${score}) — run should be terminated immediately`
    }
  }

  if (score >= 30) {
    return {
      score,
      recommendation: 'safe_mode',
      reason: `Elevated loop risk (score ${score}) — safe mode recommended`
    }
  }

  return {
    score,
    recommendation: 'normal',
    reason: `Loop risk within normal range (score ${score})`
  }
}