export interface StartRunInput  { agentId: string; input: string }
export interface ToolIntent     { runId: string; toolName: string; input: Record<string, unknown> }
export interface ToolDecision   { decision: 'allowed' | 'blocked' | 'approval_required'; reason?: string }
export interface ToolResult     { runId: string; toolName: string; output: Record<string, unknown>; durationMs: number }
export interface RunResult      { runId: string; status: 'finished' | 'blocked'; output?: string }

export const openclawAdapter = {
  async startRun(_input: StartRunInput)                    { /* POST /api/runs/start */    },
  async beforeToolCall(_intent: ToolIntent): Promise<ToolDecision> {
    return { decision: 'allowed' }                         /* POST /api/tools/evaluate */
  },
  async afterToolCall(_result: ToolResult)                 { /* POST /api/tools/log */     },
  async finishRun(_result: RunResult)                      { /* POST /api/runs/finish */   },
}
