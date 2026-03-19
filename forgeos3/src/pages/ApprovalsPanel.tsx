import { useState, useEffect } from 'react'
import { Clock, Check, X, AlertTriangle } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonCard, ErrorBanner } from '../components/ui/Skeleton'
import { useRunStore } from '../store/runStore'
import type { ApprovalRequest } from '../types/approval'

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const domainColors: Record<string, string> = {
  healthtech: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  agrotech:   'bg-green-500/10 text-green-400 border-green-500/20',
  fintech:    'bg-amber-400/10 text-amber-500 border-amber-400/20',
}

export function ApprovalsPanel() {
  const { approvals, resolveApproval, loadingApprovals, error, fetchApprovals } = useRunStore()
  const [modal, setModal] = useState<{ approval: ApprovalRequest; action: 'approved' | 'rejected' } | null>(null)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  const pending  = approvals.filter(a => a.status === 'pending')
  const resolved = approvals.filter(a => a.status !== 'pending')

  const confirm = async () => {
    if (!modal) return
    setResolving(true)
    await new Promise(r => setTimeout(r, 600))
    resolveApproval(modal.approval.id, modal.action)
    setResolving(false)
    setModal(null)
  }

  return (
    <div className="min-h-screen">
      <TopBar
        title="Approvals"
        subtitle="Review and authorize sensitive agent actions"
        actions={
          pending.length > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-amber/10 border border-forge-amber/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-forge-amber animate-pulse" />
              <span className="text-xs text-forge-amber font-medium">{pending.length} pending</span>
            </div>
          ) : undefined
        }
      />

      <div className="px-8 py-6 space-y-6 animate-fade-in">

        {error && (
          <ErrorBanner message={error} onRetry={fetchApprovals} />
        )}

        <section>
          <h2 className="text-xs font-semibold text-forge-subtle uppercase tracking-wider mb-3">Pending Review</h2>
          {loadingApprovals ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : pending.length === 0 ? (
            <Card className="p-8 text-center">
              <Check size={20} className="text-forge-green mx-auto mb-2" />
              <p className="text-sm text-forge-subtle">No pending approvals</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map(a => (
                <Card key={a.id} amber className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-semibold text-forge-white">{a.agentName}</span>
                        <span className="text-forge-subtle text-xs">wants to call</span>
                        <code className="text-sm font-mono text-forge-amber font-semibold">{a.toolName}</code>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${domainColors[a.domain] || 'bg-forge-elevated text-forge-subtle border-forge-border'}`}>{a.domain}</span>
                        <div className="flex items-center gap-1 text-xs text-forge-amber">
                          <Clock size={10} />
                          Waiting {Math.round((a.waitingMs || 0) / 1000)}s
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="danger" size="sm" onClick={() => setModal({ approval: a, action: 'rejected' })}>
                        <X size={12} /> Reject
                      </Button>
                      <Button variant="success" size="sm" onClick={() => setModal({ approval: a, action: 'approved' })}>
                        <Check size={12} /> Approve
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-forge-bg/50 border border-forge-border rounded-xl">
                    <div className="text-[10px] text-forge-subtle mb-1.5 font-medium uppercase tracking-wide">Reason</div>
                    <p className="text-xs text-forge-secondary">{a.reason}</p>
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] text-forge-subtle mb-1.5 font-medium uppercase tracking-wide">Payload Preview</div>
                    <pre className="text-[10px] font-mono text-forge-secondary bg-forge-bg/50 border border-forge-border rounded-xl p-3 overflow-x-auto">
                      {JSON.stringify(a.payload, null, 2)}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-forge-subtle uppercase tracking-wider mb-3">Resolved</h2>
          <Card className="divide-y divide-forge-border overflow-hidden">
            {loadingApprovals ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="animate-pulse bg-forge-elevated rounded-full w-6 h-6 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-forge-elevated rounded h-3 w-32" />
                    <div className="animate-pulse bg-forge-elevated rounded h-2 w-24" />
                  </div>
                  <div className="animate-pulse bg-forge-elevated rounded-full h-5 w-16" />
                </div>
              ))
            ) : resolved.length === 0 ? (
              <div className="px-5 py-8 text-center text-forge-subtle text-sm">No resolved approvals yet</div>
            ) : (
              resolved.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-forge-elevated/50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${a.status === 'approved' ? 'bg-forge-green/10' : 'bg-forge-red/10'}`}>
                    {a.status === 'approved' ? <Check size={11} className="text-forge-green" /> : <X size={11} className="text-forge-red" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-forge-primary font-medium">{a.agentName}</span>
                      <span className="text-forge-subtle text-xs">→</span>
                      <code className="text-xs text-forge-amber font-mono">{a.toolName}</code>
                    </div>
                    <div className="text-xs text-forge-subtle mt-0.5">
                      by {a.reviewedBy} · {a.reviewedAt ? timeAgo(a.reviewedAt) : ''}
                    </div>
                  </div>
                  <Badge variant={a.status === 'approved' ? 'allowed' : 'blocked'} size="sm">{a.status}</Badge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}>
        {modal && (
          <div className="space-y-4">
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${modal.action === 'approved' ? 'bg-forge-green/5 border-forge-green/20' : 'bg-forge-red/5 border-forge-red/20'}`}>
              <AlertTriangle size={15} className={modal.action === 'approved' ? 'text-forge-green mt-0.5' : 'text-forge-red mt-0.5'} />
              <div>
                <p className="text-sm font-medium text-forge-primary mb-1">
                  {modal.action === 'approved' ? 'Approving' : 'Rejecting'} <code className="text-forge-amber">{modal.approval.toolName}</code> for {modal.approval.agentName}
                </p>
                <p className="text-xs text-forge-subtle">{modal.approval.reason}</p>
              </div>
            </div>
            <pre className="text-[11px] font-mono text-forge-secondary bg-forge-elevated border border-forge-border rounded-xl p-4 overflow-x-auto">
              {JSON.stringify(modal.approval.payload, null, 2)}
            </pre>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant={modal.action === 'approved' ? 'success' : 'danger'} className="flex-1" loading={resolving} onClick={confirm}>
                {modal.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
