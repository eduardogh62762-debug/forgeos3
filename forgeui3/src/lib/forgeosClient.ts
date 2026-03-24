import axios from 'axios'

const BASE = import.meta.env.VITE_FORGEOS_API_URL || 'https://forgeos3-production.up.railway.app'
const TOKEN = import.meta.env.VITE_AGENT_TOKEN || ''

export const forgeApi = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${TOKEN}` },
})

export async function startRun(agentId: string, agentName: string, domain: string, input: string) {
  const { data } = await forgeApi.post('/api/runs/start', { agentId, agentName, domain, input })
  return data as { id: string }
}

export async function evaluateTool(runId: string, toolName: string, domain: string, input = {}) {
  const { data } = await forgeApi.post('/api/tools/evaluate', { runId, toolName, domain, input })
  return data as {
    decision:    'allowed' | 'blocked' | 'approval_required'
    reason:      string
    riskScore:   number
    toolEventId: string
  }
}

export async function logTool(toolEventId: string, output: object, durationMs: number) {
  await forgeApi.post('/api/tools/log', { toolEventId, output, durationMs })
}

export async function finishRun(runId: string, status: 'finished' | 'blocked' | 'safe_mode', output?: string) {
  await forgeApi.post('/api/runs/finish', { runId, status, output })
}

export async function requestApproval(runId: string, agentId: string, agentName: string, domain: string, toolName: string, payload: object, reason: string) {
  const { data } = await forgeApi.post('/api/approvals/request', { runId, agentId, agentName, domain, toolName, payload, reason })
  return data as { id: string }
}

export async function pollApproval(approvalId: string): Promise<'pending' | 'approved' | 'rejected'> {
  const { data } = await forgeApi.get(`/api/approvals/${approvalId}`)
  return data.status
}
