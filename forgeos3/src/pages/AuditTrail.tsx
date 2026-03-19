import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Filter, Download, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Shield, Activity, User, X
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Badge } from '../components/ui/Badge'
import { useRunStore } from '../store/runStore'
import type { ToolEvent, Run } from '../types/run'
import type { ApprovalRequest } from '../types/approval'

type AuditEntry =
  | { kind: 'tool'; event: ToolEvent & { agentName: string; domain: string; runId: string }; ts: number }
  | { kind: 'approval'; approval: ApprovalRequest; ts: number }
  | { kind: 'run'; run: Run; ts: number; subtype: 'started' | 'finished' | 'blocked' | 'safe_mode' }

type DomainFilter = 'all' | 'healthtech' | 'agrotech' | 'fintech'
type DecisionFilter = 'all' | 'allowed' | 'blocked' | 'approval_required'
type EntryKindFilter = 'all' | 'tool' | 'approval' | 'run'

function formatTs(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const DOMAIN_PILL: Record<string, string> = {
  healthtech: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  agrotech: 'bg-green-500/10 border-green-500/20 text-green-400',
  fintech: 'bg-amber-400/10 border-amber-400/20 text-amber-500',
}

export function AuditTrail() {
  const { runs, approvals } = useRunStore()
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all')
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all')
  const [kindFilter, setKindFilter] = useState<EntryKindFilter>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)

  const entries: AuditEntry[] = useMemo(() => {
    const list: AuditEntry[] = []

    runs.forEach(r => {
      r.toolEvents.forEach(e => {
        list.push({
          kind: 'tool',
          event: { ...e, agentName: r.agentName, domain: r.domain, runId: r.id },
          ts: new Date(e.timestamp).getTime(),
        })
      })
    })

    approvals.forEach(a => {
      list.push({ kind: 'approval', approval: a, ts: new Date(a.createdAt).getTime() })
    })

    runs.forEach(r => {
      list.push({ kind: 'run', run: r, ts: new Date(r.startedAt).getTime(), subtype: 'started' })
      if (r.finishedAt) {
        list.push({ kind: 'run', run: r, ts: new Date(r.finishedAt).getTime(), subtype: r.status === 'blocked' ? 'blocked' : 'finished' })
      }
    })

    return list.sort((a, b) => b.ts - a.ts)
  }, [runs, approvals])

  const filtered = entries.filter(entry => {
    if (kindFilter !== 'all' && entry.kind !== kindFilter) return false
    if (domainFilter !== 'all') {
      const domain =
        entry.kind === 'tool' ? entry.event.domain :
          entry.kind === 'approval' ? entry.approval.domain :
            entry.run.domain
      if (domain !== domainFilter) return false
    }
    if (decisionFilter !== 'all' && entry.kind === 'tool') {
      if (entry.event.decision !== decisionFilter) return false
    }
    if (decisionFilter !== 'all' && entry.kind !== 'tool') return false
    return true
  })

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const entryId = (entry: AuditEntry, i: number) =>
    entry.kind === 'tool' ? entry.event.id :
      entry.kind === 'approval' ? entry.approval.id :
        `${entry.run.id}-${entry.subtype}-${i}`

  const activeFilters = [domainFilter !== 'all', decisionFilter !== 'all', kindFilter !== 'all'].filter(Boolean).length

  const clearFilters = () => {
    setDomainFilter('all')
    setDecisionFilter('all')
    setKindFilter('all')
  }

  const handleExport = () => {
    const rows = filtered.map(entry => {
      if (entry.kind === 'tool') return `tool,${entry.event.toolName},${entry.event.agentName},${entry.event.domain},${entry.event.decision},${entry.ts}`
      if (entry.kind === 'approval') return `approval,${entry.approval.toolName},${entry.approval.agentName},${entry.approval.domain},${entry.approval.status},${entry.ts}`
      return `run,${entry.run.agentName},,${entry.run.domain},${entry.subtype},${entry.ts}`
    })
    const csv = ['type,tool/name,agent,domain,decision/status,timestamp', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forgeos3-audit-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen">
      <TopBar
        title="Audit Trail"
        subtitle="Complete institutional record of all runs, decisions and approvals"
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-forge-elevated border border-forge-border rounded-xl text-xs text-forge-secondary hover:text-forge-primary hover:border-forge-line transition-all">
            <Download size={12} /> Export
          </button>
        }
      />

      <div className="px-8 py-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Events', value: entries.length, color: 'text-forge-white' },
            { label: 'Tool Events', value: entries.filter(e => e.kind === 'tool').length, color: 'text-blue-400' },
            { label: 'Approvals', value: entries.filter(e => e.kind === 'approval').length, color: 'text-forge-amber' },
            { label: 'Run Events', value: entries.filter(e => e.kind === 'run').length, color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-4 p-4 bg-forge-surface border border-forge-border rounded-2xl">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-forge-subtle uppercase tracking-wider font-semibold">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowFilters(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-forge-elevated/30 transition-colors">
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-forge-subtle" />
              <span className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest">Filters</span>
              {activeFilters > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-black text-[9px] font-bold rounded-full">
                  {activeFilters}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-forge-subtle">{filtered.length} of {entries.length} events</span>
              {showFilters ? <ChevronUp size={13} className="text-forge-subtle" /> : <ChevronDown size={13} className="text-forge-subtle" />}
            </div>
          </button>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-forge-border px-5 py-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-forge-subtle uppercase tracking-widest mr-1 font-bold">Domain</span>
                  {(['all', 'healthtech', 'agrotech', 'fintech'] as DomainFilter[]).map(d => (
                    <button key={d} onClick={() => setDomainFilter(d)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all ${domainFilter === d
                          ? d === 'all' ? 'bg-forge-amber text-black border-forge-amber'
                            : d === 'healthtech' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : d === 'agrotech' ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-amber-400/20 text-amber-500 border-amber-400/30'
                          : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'
                        }`}>
                      {d}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-forge-border" />

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-forge-subtle uppercase tracking-widest mr-1 font-bold">Decision</span>
                  {(['all', 'allowed', 'blocked', 'approval_required'] as DecisionFilter[]).map(d => (
                    <button key={d} onClick={() => setDecisionFilter(d)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all ${decisionFilter === d
                          ? d === 'all' ? 'bg-forge-amber text-black border-forge-amber'
                            : d === 'allowed' ? 'bg-forge-green/20 text-forge-green border-forge-green/30'
                              : d === 'blocked' ? 'bg-forge-red/20 text-forge-red border-forge-red/30'
                                : 'bg-forge-amber/20 text-forge-amber border-forge-amber/30'
                          : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'
                        }`}>
                      {d === 'approval_required' ? 'approval' : d}
                    </button>
                  ))}
                </div>

                <div className="w-px h-5 bg-forge-border" />

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-forge-subtle uppercase tracking-widest mr-1 font-bold">Type</span>
                  {(['all', 'tool', 'approval', 'run'] as EntryKindFilter[]).map(k => (
                    <button key={k} onClick={() => setKindFilter(k)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all ${kindFilter === k
                          ? 'bg-forge-amber text-black border-forge-amber'
                          : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'
                        }`}>
                      {k}
                    </button>
                  ))}
                </div>

                {activeFilters > 0 && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1 text-[10px] text-forge-red hover:text-forge-red/80 transition-colors ml-auto">
                    <X size={11} /> Clear filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-forge-border bg-forge-elevated/20">
            <BookOpen size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-forge-white">Event Log</span>
            <span className="ml-auto text-[10px] text-forge-subtle">{filtered.length} events</span>
          </div>

          <div className="divide-y divide-forge-border/30">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-forge-subtle">
                <p className="text-sm">No events match the current filters</p>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              filtered.map((entry, i) => {
                const id = entryId(entry, i)
                const isOpen = expanded.has(id)

                return (
                  <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}>
                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-forge-elevated/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(id)}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${entry.kind === 'tool' ? 'bg-blue-500/10' : entry.kind === 'approval' ? 'bg-amber-400/10' : 'bg-purple-500/10'}`}>
                        {entry.kind === 'tool' && <Activity size={12} className="text-blue-400" />}
                        {entry.kind === 'approval' && <Shield size={12} className="text-amber-500" />}
                        {entry.kind === 'run' && <User size={12} className="text-purple-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        {entry.kind === 'tool' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-xs font-mono text-forge-amber">{entry.event.toolName}</code>
                            <span className="text-forge-subtle text-[10px]">called by</span>
                            <span className="text-xs text-forge-primary font-medium">{entry.event.agentName}</span>
                          </div>
                        )}
                        {entry.kind === 'approval' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-forge-primary font-medium">{entry.approval.agentName}</span>
                            <span className="text-forge-subtle text-[10px]">approval for</span>
                            <code className="text-xs font-mono text-forge-amber">{entry.approval.toolName}</code>
                            <span className="text-forge-subtle text-[10px]">→</span>
                            <Badge variant={entry.approval.status === 'approved' ? 'allowed' : entry.approval.status === 'rejected' ? 'blocked' : 'approval'} size="sm">{entry.approval.status}</Badge>
                          </div>
                        )}
                        {entry.kind === 'run' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-forge-primary font-medium">{entry.run.agentName}</span>
                            <span className="text-forge-subtle text-[10px]">run</span>
                            <span className={`text-xs font-semibold ${entry.subtype === 'finished' ? 'text-forge-green' : entry.subtype === 'blocked' ? 'text-forge-red' : entry.subtype === 'started' ? 'text-blue-400' : 'text-forge-amber'}`}>
                              {entry.subtype}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {(() => {
                          const d = entry.kind === 'tool' ? entry.event.domain : entry.kind === 'approval' ? entry.approval.domain : entry.run.domain
                          return (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold capitalize ${DOMAIN_PILL[d] || 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>{d}</span>
                          )
                        })()}
                      </div>

                      {entry.kind === 'tool' && (
                        <div className="shrink-0 flex items-center gap-1.5">
                          {entry.event.decision === 'allowed' && <CheckCircle size={12} className="text-forge-green" />}
                          {entry.event.decision === 'blocked' && <XCircle size={12} className="text-forge-red" />}
                          {entry.event.decision === 'approval_required' && <Clock size={12} className="text-forge-amber" />}
                          <Badge variant={entry.event.decision === 'allowed' ? 'allowed' : entry.event.decision === 'blocked' ? 'blocked' : 'approval'} size="sm">
                            {entry.event.decision === 'approval_required' ? 'approval' : entry.event.decision}
                          </Badge>
                        </div>
                      )}

                      <div className="shrink-0 text-right">
                        <div className="text-[10px] text-forge-subtle">{timeAgo(entry.ts)}</div>
                        <div className="text-[9px] text-forge-subtle/60">{formatTs(entry.ts)}</div>
                      </div>

                      <div className="shrink-0 text-forge-subtle">
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>
                    </div>

                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="px-5 pb-4 bg-forge-elevated/20 border-t border-forge-border/40">
                        <div className="py-4 grid grid-cols-2 gap-4">
                          {entry.kind === 'tool' && (
                            <>
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Run ID</div>
                                  <code className="text-xs text-forge-secondary font-mono">{entry.event.runId}</code>
                                </div>
                                <div>
                                  <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Risk Score</div>
                                  <span className={`text-sm font-bold ${entry.event.riskScore > 30 ? 'text-forge-red' : entry.event.riskScore > 15 ? 'text-forge-amber' : 'text-forge-green'}`}>
                                    {entry.event.riskScore}
                                  </span>
                                </div>
                                {entry.event.durationMs && (
                                  <div>
                                    <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Duration</div>
                                    <span className="text-xs text-forge-secondary">{entry.event.durationMs}ms</span>
                                  </div>
                                )}
                                {entry.event.reason && (
                                  <div>
                                    <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Reason</div>
                                    <span className="text-xs text-forge-secondary">{entry.event.reason}</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-2">Payload</div>
                                <pre className="text-[10px] font-mono text-forge-secondary bg-forge-bg border border-forge-border rounded-xl p-3 overflow-x-auto">
                                  {JSON.stringify(entry.event.input, null, 2) || '{}'}
                                </pre>
                              </div>
                            </>
                          )}
                          {entry.kind === 'approval' && (
                            <>
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Reason</div>
                                  <span className="text-xs text-forge-secondary">{entry.approval.reason}</span>
                                </div>
                                {entry.approval.reviewedBy && (
                                  <div>
                                    <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Reviewed By</div>
                                    <span className="text-xs text-forge-secondary">{entry.approval.reviewedBy}</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-2">Payload</div>
                                <pre className="text-[10px] font-mono text-forge-secondary bg-forge-bg border border-forge-border rounded-xl p-3 overflow-x-auto">
                                  {JSON.stringify(entry.approval.payload, null, 2)}
                                </pre>
                              </div>
                            </>
                          )}
                          {entry.kind === 'run' && (
                            <div className="col-span-2 space-y-2">
                              <div>
                                <div className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">Input</div>
                                <p className="text-xs text-forge-secondary">{entry.run.input}</p>
                              </div>
                              <div className="flex items-center gap-4 text-[10px] text-forge-subtle">
                                <span>Loop Risk: <span className="text-forge-primary font-bold">{entry.run.loopRiskScore}</span></span>
                                <span>Tools: <span className="text-forge-primary font-bold">{entry.run.toolEvents.length}</span></span>
                                <span>Status: <span className="text-forge-primary font-bold">{entry.run.status}</span></span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
