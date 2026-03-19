import { supabase } from '../db/supabase'

export type AuditEventType =
  | 'tool_evaluated'
  | 'tool_executed'
  | 'tool_blocked'
  | 'approval_requested'
  | 'approval_resolved'
  | 'run_started'
  | 'run_finished'
  | 'loop_risk_escalated'

export interface AuditPayload {
  type:     AuditEventType
  runId?:   string
  agentId?: string
  domain?:  string
  data:     Record<string, unknown>
}

export async function logAuditEvent(payload: AuditPayload): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_log')
      .insert({
        event_type: payload.type,
        run_id:     payload.runId    ?? null,
        agent_id:   payload.agentId  ?? null,
        domain:     payload.domain   ?? null,
        data:       payload.data,
        created_at: new Date().toISOString(),
      })

    if (error) {
      // Non-fatal — log to console but don't break the main flow
      console.warn('[AuditLayer] Failed to log event:', error.message)
    }
  } catch (err) {
    console.warn('[AuditLayer] Unexpected error:', err)
  }
}