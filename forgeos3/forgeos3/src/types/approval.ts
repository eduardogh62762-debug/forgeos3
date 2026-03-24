export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export interface ApprovalRequest {
  id: string; runId: string; agentId: string; agentName: string
  domain: string; toolName: string; payload: Record<string, unknown>
  reason: string; status: ApprovalStatus; reviewedBy?: string
  reviewedAt?: string; createdAt: string; waitingMs?: number
}
