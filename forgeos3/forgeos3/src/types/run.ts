export type RunStatus = 'running' | 'finished' | 'blocked' | 'safe_mode' | 'waiting_approval'
export type ToolDecision = 'allowed' | 'blocked' | 'approval_required'
export interface ToolEvent {
  id: string; runId: string; toolName: string; decision: ToolDecision
  input: Record<string, unknown>; output?: Record<string, unknown>
  riskScore: number; timestamp: string; durationMs?: number; reason?: string
}
export interface Run {
  id: string; agentId: string; agentName: string; domain: string
  status: RunStatus; input: string; output?: string
  loopRiskScore: number; startedAt: string; finishedAt?: string
  toolEvents: ToolEvent[]
}
