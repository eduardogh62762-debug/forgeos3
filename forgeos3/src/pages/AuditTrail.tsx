import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Filter, Download, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Shield, Activity, X,
  Zap, AlertTriangle, Play, LayoutList, GitBranch
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

type DomainFilter   = 'all' | 'healthtech' | 'agrotech' | 'fintech'
type DecisionFilter = 'all' | 'allowed' | 'blocked' | 'approval_required'
type EntryKindFilter = 'all' | 'tool' | 'approval' | 'run'
type ViewMode = 'timeline' | 'table'

function formatTs(ts: number) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60000)   return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const DOMAIN_PILL: Record<string, string> = {
  healthtech: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  agrotech:   'bg-green-500/10 border-green-500/20 text-green-400',
  fintech:    'bg-amber-400/10 border-amber-400/20 text-amber-500',
}

function getRiskColor(score: number) {
  if (score > 30) return 'text-forge-red'
  if (score > 15) return 'text-forge-amber'
  return 'text-forge-green'
}

function getRiskBarColor(score: number) {
  if (score > 30) return 'bg-forge-red'
  if (score > 15) return 'bg-forge-amber'
  return 'bg-forge-green'
}

function getDotColor(entry: AuditEntry): string {
  if (entry.kind === 'tool') {
    if (entry.event.decision === 'allowed')           return 'bg-forge-green shadow-[0_0_8px_rgba(52,211,153,0.55)]'
    if (entry.event.decision === 'blocked')           return 'bg-forge-red   shadow-[0_0_8px_rgba(248,113,113,0.55)]'
    return                                                   'bg-forge-amber shadow-[0_0_8px_rgba(251,191,36,0.55)]'
  }
  if (entry.kind === 'approval') {
    if (entry.approval.status === 'approved') return 'bg-forge-green shadow-[0_0_8px_rgba(52,211,153,0.55)]'
    if (entry.approval.status === 'rejected') return 'bg-forge-red   shadow-[0_0_8px_rgba(248,113,113,0.55)]'
    return                                           'bg-forge-amber shadow-[0_0_8px_rgba(251,191,36,0.55)]'
  }
  if (entry.kind === 'run') {
    if (entry.subtype === 'started')  return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.55)]'
    if (entry.subtype === 'blocked')  return 'bg-forge-red shadow-[0_0_8px_rgba(248,113,113,0.55)]'
    if (entry.subtype === 'finished') return 'bg-forge-green shadow-[0_0_8px_rgba(52,211,153,0.55)]'
    return 'bg-forge-amber shadow-[0_0_8px_rgba(251,191,36,0.55)]'
  }
  return 'bg-forge-subtle'
}

function getLineColor(entry: AuditEntry): string {
  if (entry.kind === 'tool') {
    if (entry.event.decision === 'allowed')           return 'bg-forge-green/35'
    if (entry.event.decision === 'blocked')           return 'bg-forge-red/35'
    return                                                   'bg-forge-amber/35'
  }
  if (entry.kind === 'approval') {
    if (entry.approval.status === 'approved') return 'bg-forge-green/35'
    if (entry.approval.status === 'rejected') return 'bg-forge-red/35'
    return 'bg-forge-amber/35'
  }
  if (entry.kind === 'run') {
    if (entry.subtype === 'started')  return 'bg-blue-400/35'
    if (entry.subtype === 'blocked')  return 'bg-forge-red/35'
    if (entry.subtype === 'finished') return 'bg-forge-green/35'
  }
  return 'bg-forge-border'
}

function getStepLabel(entry: AuditEntry): string {
  if (entry.kind === 'tool') {
    if (entry.event.decision === 'blocked')           return 'Blocked by Sentinel'
    if (entry.event.decision === 'approval_required') return 'Awaiting approval'
    return 'Tool executed'
  }
  if (entry.kind === 'approval') return `Approval ${entry.approval.status}`
  if (entry.kind === 'run') {
    if (entry.subtype === 'started')  return 'Run started'
    if (entry.subtype === 'blocked')  return 'Run blocked'
    if (entry.subtype === 'finished') return 'Run completed'
    return 'Safe mode activated'
  }
  return ''
}

function EntryIcon({ entry }: { entry: AuditEntry }) {
  if (entry.kind === 'tool') {
    if (entry.event.decision === 'blocked')           return <XCircle size={14} className="text-forge-red" />
    if (entry.event.decision === 'approval_required') return <Clock size={14} className="text-forge-amber" />
    return <CheckCircle size={14} className="text-forge-green" />
  }
  if (entry.kind === 'approval') {
    if (entry.approval.status === 'approved') return <CheckCircle size={14} className="text-forge-green" />
    if (entry.approval.status === 'rejected') return <XCircle size={14} className="text-forge-red" />
    return <Clock size={14} className="text-forge-amber" />
  }
  if (entry.kind === 'run') {
    if (entry.subtype === 'started')  return <Play size={14} className="text-blue-400" />
    if (entry.subtype === 'blocked')  return <AlertTriangle size={14} className="text-forge-red" />
    if (entry.subtype === 'finished') return <CheckCircle size={14} className="text-forge-green" />
    return <Shield size={14} className="text-forge-amber" />
  }
  return <Activity size={14} className="text-forge-subtle" />
}

function entryName(entry: AuditEntry) {
  return entry.kind === 'tool'     ? entry.event.toolName
       : entry.kind === 'approval' ? entry.approval.toolName
       : entry.run.agentName
}
function entryAgent(entry: AuditEntry) {
  return entry.kind === 'tool'     ? entry.event.agentName
       : entry.kind === 'approval' ? entry.approval.agentName
       : entry.run.agentName
}
function entryDomain(entry: AuditEntry) {
  return entry.kind === 'tool'     ? entry.event.domain
       : entry.kind === 'approval' ? entry.approval.domain
       : entry.run.domain
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-forge-subtle uppercase tracking-widest mb-1">{label}</p>
      <div className="text-xs">{children}</div>
    </div>
  )
}

// ─── Expanded detail panel (shared between views) ──────────────────────────
function EntryDetail({ entry }: { entry: AuditEntry }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-forge-border/40 bg-forge-elevated/20"
    >
      <div className="px-4 py-4 grid grid-cols-2 gap-4">
        {entry.kind === 'tool' && (
          <>
            <div className="space-y-3">
              <DetailRow label="Run ID"><code className="font-mono text-forge-secondary">{entry.event.runId}</code></DetailRow>
              <DetailRow label="Risk Score">
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${getRiskColor(entry.event.riskScore)}`}>{entry.event.riskScore}</span>
                  <div className="h-1.5 w-16 bg-forge-elevated rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getRiskBarColor(entry.event.riskScore)}`}
                      style={{ width: `${Math.min(entry.event.riskScore, 100)}%` }} />
                  </div>
                </div>
              </DetailRow>
              {entry.event.durationMs && (
                <DetailRow label="Duration"><span className="text-forge-secondary">{entry.event.durationMs}ms</span></DetailRow>
              )}
              {entry.event.reason && (
                <DetailRow label="Reason"><span className="text-forge-secondary">{entry.event.reason}</span></DetailRow>
              )}
            </div>
            <div>
              <p className="text-[9px] text-forge-subtle uppercase tracking-widest mb-2">Payload</p>
              <pre className="text-[10px] font-mono text-forge-secondary bg-forge-bg border border-forge-border rounded-xl p-3 overflow-x-auto max-h-40">
                {JSON.stringify(entry.event.input, null, 2) || '{}'}
              </pre>
            </div>
          </>
        )}
        {entry.kind === 'approval' && (
          <>
            <div className="space-y-3">
              <DetailRow label="Reason"><span className="text-forge-secondary">{entry.approval.reason}</span></DetailRow>
              {entry.approval.reviewedBy && (
                <DetailRow label="Reviewed By"><span className="text-forge-secondary">{entry.approval.reviewedBy}</span></DetailRow>
              )}
            </div>
            <div>
              <p className="text-[9px] text-forge-subtle uppercase tracking-widest mb-2">Payload</p>
              <pre className="text-[10px] font-mono text-forge-secondary bg-forge-bg border border-forge-border rounded-xl p-3 overflow-x-auto max-h-40">
                {JSON.stringify(entry.approval.payload, null, 2)}
              </pre>
            </div>
          </>
        )}
        {entry.kind === 'run' && (
          <div className="col-span-2 space-y-3">
            <DetailRow label="Input"><p className="text-forge-secondary">{entry.run.input}</p></DetailRow>
            <div className="flex items-center gap-6 text-[10px] text-forge-subtle">
              <span>Loop Risk: <span className={`font-bold ${getRiskColor(entry.run.loopRiskScore)}`}>{entry.run.loopRiskScore}</span></span>
              <span>Tools: <span className="font-bold text-forge-primary">{(entry.run.toolEvents ?? []).length}</span></span>
              <span>Status: <span className="font-bold text-forge-primary">{entry.run.status}</span></span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Timeline Card ─────────────────────────────────────────────────────────
function TimelineCard({
  entry, index, isLast, isExpanded, onToggle, isNew,
}: {
  entry: AuditEntry; index: number; isLast: boolean
  isExpanded: boolean; onToggle: () => void; isNew: boolean
}) {
  const dot  = getDotColor(entry)
  const line = getLineColor(entry)
  const label = getStepLabel(entry)
  const domain = entryDomain(entry)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.035, duration: 0.28, ease: 'easeOut' }}
      className="flex gap-0"
    >
      {/* Spine */}
      <div className="flex flex-col items-center w-10 shrink-0">
        <motion.div
          initial={isNew ? { scale: 0 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className={`w-3 h-3 rounded-full mt-[18px] shrink-0 z-10 ${dot}`}
        />
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: index * 0.035 + 0.12, duration: 0.25 }}
            style={{ transformOrigin: 'top' }}
            className={`w-px flex-1 mt-1 ${line}`}
          />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 mb-3 ml-3">
        {isNew && (
          <span className="inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 bg-forge-amber/10 border border-forge-amber/20 rounded text-[9px] text-forge-amber font-bold uppercase tracking-wider">
            <Zap size={8} /> Live
          </span>
        )}
        <div
          onClick={onToggle}
          className={`bg-forge-surface border rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden
            ${isExpanded
              ? 'border-forge-line'
              : 'border-forge-border hover:border-forge-line hover:bg-forge-elevated/20'}`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              entry.kind === 'tool' ? 'bg-blue-500/10'
              : entry.kind === 'approval' ? 'bg-amber-400/10'
              : 'bg-purple-500/10'}`}>
              <EntryIcon entry={entry} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <code className="text-xs font-mono text-forge-amber font-semibold truncate max-w-[150px]">{entryName(entry)}</code>
                <span className="text-forge-subtle text-[10px]">·</span>
                <span className="text-[10px] text-forge-subtle truncate max-w-[100px]">{entryAgent(entry)}</span>
                <span className="text-forge-subtle text-[10px]">·</span>
                <span className={`text-[10px] font-semibold ${
                  entry.kind === 'run' && entry.subtype === 'started'  ? 'text-blue-400'
                  : entry.kind === 'run' && entry.subtype === 'finished' ? 'text-forge-green'
                  : entry.kind === 'run' ? 'text-forge-red'
                  : 'text-forge-secondary'}`}>{label}</span>
              </div>
              {/* Mini risk bar — only for tool events */}
              {entry.kind === 'tool' && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-0.5 w-20 bg-forge-elevated rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(entry.event.riskScore, 100)}%` }}
                      transition={{ delay: index * 0.035 + 0.18, duration: 0.45 }}
                      className={`h-full rounded-full ${getRiskBarColor(entry.event.riskScore)}`}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${getRiskColor(entry.event.riskScore)}`}>
                    risk {entry.event.riskScore}
                  </span>
                </div>
              )}
            </div>

            {/* Domain */}
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold capitalize shrink-0 ${DOMAIN_PILL[domain] || 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>
              {domain}
            </span>

            {/* Decision badge */}
            {entry.kind === 'tool' && (
              <Badge variant={entry.event.decision === 'allowed' ? 'allowed' : entry.event.decision === 'blocked' ? 'blocked' : 'approval'} size="sm">
                {entry.event.decision === 'approval_required' ? 'approval' : entry.event.decision}
              </Badge>
            )}
            {entry.kind === 'approval' && (
              <Badge variant={entry.approval.status === 'approved' ? 'allowed' : entry.approval.status === 'rejected' ? 'blocked' : 'approval'} size="sm">
                {entry.approval.status}
              </Badge>
            )}

            {/* Time */}
            <div className="shrink-0 text-right">
              <div className="text-[10px] text-forge-subtle">{timeAgo(entry.ts)}</div>
              <div className="text-[9px] text-forge-subtle/50">{formatTs(entry.ts)}</div>
            </div>

            <div className="shrink-0 text-forge-subtle">
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && <EntryDetail entry={entry} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Run Selector ──────────────────────────────────────────────────────────
function RunSelector({ runs, selected, onSelect }: {
  runs: Run[]; selected: string | null; onSelect: (id: string | null) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all ${
          selected === null
            ? 'bg-forge-amber/10 border-forge-amber/30 text-forge-amber'
            : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'}`}
      >
        <GitBranch size={10} /> All runs
      </button>
      {runs.map(r => (
        <button key={r.id} onClick={() => onSelect(r.id)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all max-w-[160px] ${
            selected === r.id
              ? 'bg-forge-amber/10 border-forge-amber/30 text-forge-amber'
              : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            r.status === 'finished' ? 'bg-forge-green'
            : r.status === 'blocked' ? 'bg-forge-red'
            : r.status === 'running' ? 'bg-blue-400 animate-pulse'
            : 'bg-forge-amber'}`}
          />
          <span className="truncate">{r.agentName}</span>
        </button>
      ))}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-forge-subtle uppercase tracking-widest mr-1 font-bold">{label}</span>
      {children}
    </div>
  )
}

function FilterBtn({ active, onClick, label, activeClass }: {
  active: boolean; onClick: () => void; label: string; activeClass: string
}) {
  return (
    <button onClick={onClick}
      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all ${
        active ? activeClass : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'}`}>
      {label}
    </button>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function AuditTrail() {
  const { runs, approvals } = useRunStore()
  const [domainFilter,   setDomainFilter]   = useState<DomainFilter>('all')
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all')
  const [kindFilter,     setKindFilter]     = useState<EntryKindFilter>('all')
  const [expanded,       setExpanded]       = useState<Set<string>>(new Set())
  const [showFilters,    setShowFilters]    = useState(false)
  const [viewMode,       setViewMode]       = useState<ViewMode>('timeline')
  const [selectedRun,    setSelectedRun]    = useState<string | null>(null)
  const [newIds,         setNewIds]         = useState<Set<string>>(new Set())
  const prevCountRef = useRef(0)

  const allEntries: AuditEntry[] = useMemo(() => {
    const list: AuditEntry[] = []
    runs.forEach(r => {
      (r.toolEvents ?? []).forEach(e => {
        list.push({ kind: 'tool', event: { ...e, agentName: r.agentName, domain: r.domain, runId: r.id }, ts: new Date(e.timestamp).getTime() })
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

  // Mark new live entries
  useEffect(() => {
    const n = allEntries.length
    if (prevCountRef.current > 0 && n > prevCountRef.current) {
      const fresh = allEntries.slice(0, n - prevCountRef.current).map((e, i) => mkId(e, i))
      setNewIds(new Set(fresh))
      const t = setTimeout(() => setNewIds(new Set()), 4500)
      return () => clearTimeout(t)
    }
    prevCountRef.current = n
  }, [allEntries])

  const filtered = useMemo(() => allEntries.filter(entry => {
    if (selectedRun !== null) {
      const rid = entry.kind === 'tool' ? entry.event.runId
        : entry.kind === 'approval' ? entry.approval.runId
        : entry.run.id
      if (rid !== selectedRun) return false
    }
    if (kindFilter !== 'all' && entry.kind !== kindFilter) return false
    if (domainFilter !== 'all' && entryDomain(entry) !== domainFilter) return false
    if (decisionFilter !== 'all') {
      if (entry.kind !== 'tool') return false
      if (entry.event.decision !== decisionFilter) return false
    }
    return true
  }), [allEntries, selectedRun, kindFilter, domainFilter, decisionFilter])

  function mkId(entry: AuditEntry, i: number) {
    return entry.kind === 'tool' ? entry.event.id
      : entry.kind === 'approval' ? entry.approval.id
      : `${entry.run.id}-${entry.subtype}-${i}`
  }

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const activeFilters = [domainFilter !== 'all', decisionFilter !== 'all', kindFilter !== 'all'].filter(Boolean).length
  const clearFilters  = () => { setDomainFilter('all'); setDecisionFilter('all'); setKindFilter('all') }

  const handleExport = () => {
    const rows = filtered.map(e => {
      if (e.kind === 'tool')     return `tool,${e.event.toolName},${e.event.agentName},${e.event.domain},${e.event.decision},${e.ts}`
      if (e.kind === 'approval') return `approval,${e.approval.toolName},${e.approval.agentName},${e.approval.domain},${e.approval.status},${e.ts}`
      return `run,${e.run.agentName},,${e.run.domain},${e.subtype},${e.ts}`
    })
    const csv  = ['type,tool/name,agent,domain,decision/status,timestamp', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `forgeos3-audit-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const stats = [
    { label: 'Total Events', value: allEntries.length,                                                              color: 'text-forge-white' },
    { label: 'Tool Events',  value: allEntries.filter(e => e.kind === 'tool').length,                              color: 'text-blue-400'    },
    { label: 'Approvals',    value: allEntries.filter(e => e.kind === 'approval').length,                          color: 'text-forge-amber' },
    { label: 'Blocked',      value: allEntries.filter(e => e.kind === 'tool' && e.event.decision === 'blocked').length, color: 'text-forge-red' },
  ]

  const isLive = runs.some(r => r.status === 'running')

  return (
    <div className="min-h-screen">
      <TopBar
        title="Audit Trail"
        subtitle="Línea de tiempo del razonamiento del agente en tiempo real"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-0.5 bg-forge-elevated border border-forge-border rounded-xl">
              <button onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[10px] font-semibold transition-all ${viewMode === 'timeline' ? 'bg-forge-surface text-forge-amber border border-forge-line' : 'text-forge-subtle hover:text-forge-secondary'}`}>
                <GitBranch size={10} /> Timeline
              </button>
              <button onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[10px] font-semibold transition-all ${viewMode === 'table' ? 'bg-forge-surface text-forge-amber border border-forge-line' : 'text-forge-subtle hover:text-forge-secondary'}`}>
                <LayoutList size={10} /> Table
              </button>
            </div>
            <button onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-forge-elevated border border-forge-border rounded-xl text-xs text-forge-secondary hover:text-forge-primary hover:border-forge-line transition-all">
              <Download size={12} /> Export
            </button>
          </div>
        }
      />

      <div className="px-8 py-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-4 p-4 bg-forge-surface border border-forge-border rounded-2xl">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-forge-subtle uppercase tracking-wider font-semibold">{label}</div>
            </div>
          ))}
        </div>

        {/* Run selector */}
        {runs.length > 0 && (
          <div className="bg-forge-surface border border-forge-border rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Activity size={12} className="text-forge-subtle" />
              <span className="text-[9px] font-bold text-forge-subtle uppercase tracking-widest">Filter by run</span>
            </div>
            <RunSelector runs={runs} selected={selectedRun} onSelect={setSelectedRun} />
          </div>
        )}

        {/* Filters */}
        <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
          <button onClick={() => setShowFilters(p => !p)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-forge-elevated/30 transition-colors">
            <div className="flex items-center gap-2">
              <Filter size={13} className="text-forge-subtle" />
              <span className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest">Filters</span>
              {activeFilters > 0 && (
                <span className="px-2 py-0.5 bg-amber-400 text-black text-[9px] font-bold rounded-full">{activeFilters}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-forge-subtle">{filtered.length} of {allEntries.length} events</span>
              {showFilters ? <ChevronUp size={13} className="text-forge-subtle" /> : <ChevronDown size={13} className="text-forge-subtle" />}
            </div>
          </button>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="border-t border-forge-border px-5 py-4"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <FilterGroup label="Domain">
                  {(['all','healthtech','agrotech','fintech'] as DomainFilter[]).map(d => (
                    <FilterBtn key={d} active={domainFilter === d} onClick={() => setDomainFilter(d)} label={d}
                      activeClass={d === 'all' ? 'bg-forge-amber text-black border-forge-amber'
                        : d === 'healthtech' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : d === 'agrotech'   ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-amber-400/20 text-amber-500 border-amber-400/30'} />
                  ))}
                </FilterGroup>
                <div className="w-px h-5 bg-forge-border" />
                <FilterGroup label="Decision">
                  {(['all','allowed','blocked','approval_required'] as DecisionFilter[]).map(d => (
                    <FilterBtn key={d} active={decisionFilter === d} onClick={() => setDecisionFilter(d)}
                      label={d === 'approval_required' ? 'approval' : d}
                      activeClass={d === 'all' ? 'bg-forge-amber text-black border-forge-amber'
                        : d === 'allowed' ? 'bg-forge-green/20 text-forge-green border-forge-green/30'
                        : d === 'blocked' ? 'bg-forge-red/20 text-forge-red border-forge-red/30'
                        : 'bg-forge-amber/20 text-forge-amber border-forge-amber/30'} />
                  ))}
                </FilterGroup>
                <div className="w-px h-5 bg-forge-border" />
                <FilterGroup label="Type">
                  {(['all','tool','approval','run'] as EntryKindFilter[]).map(k => (
                    <FilterBtn key={k} active={kindFilter === k} onClick={() => setKindFilter(k)} label={k}
                      activeClass="bg-forge-amber text-black border-forge-amber" />
                  ))}
                </FilterGroup>
                {activeFilters > 0 && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1 text-[10px] text-forge-red hover:text-forge-red/80 transition-colors ml-auto">
                    <X size={11} /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Main content panel */}
        <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-forge-border bg-forge-elevated/20">
            <BookOpen size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-forge-white">
              {viewMode === 'timeline' ? 'Reasoning Timeline' : 'Event Log'}
            </span>
            {isLive && (
              <span className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Live</span>
              </span>
            )}
            <span className="ml-auto text-[10px] text-forge-subtle">{filtered.length} events</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-forge-subtle">
              <p className="text-sm">No events match current filters</p>
              {(activeFilters > 0 || selectedRun) && (
                <button onClick={() => { clearFilters(); setSelectedRun(null) }}
                  className="text-xs text-amber-500 hover:text-amber-400 transition-colors">
                  Clear all filters
                </button>
              )}
            </div>
          ) : viewMode === 'timeline' ? (

            /* ── TIMELINE VIEW ── */
            <div className="px-5 pt-5 pb-2">
              {filtered.map((entry, i) => {
                const id = mkId(entry, i)
                return (
                  <TimelineCard
                    key={id}
                    entry={entry}
                    index={i}
                    isLast={i === filtered.length - 1}
                    isExpanded={expanded.has(id)}
                    onToggle={() => toggle(id)}
                    isNew={newIds.has(id)}
                  />
                )
              })}
            </div>

          ) : (

            /* ── TABLE VIEW ── */
            <div className="divide-y divide-forge-border/30">
              {filtered.map((entry, i) => {
                const id = mkId(entry, i)
                const isOpen = expanded.has(id)
                const domain = entryDomain(entry)
                return (
                  <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}>
                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-forge-elevated/30 transition-colors cursor-pointer"
                      onClick={() => toggle(id)}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        entry.kind === 'tool' ? 'bg-blue-500/10' : entry.kind === 'approval' ? 'bg-amber-400/10' : 'bg-purple-500/10'}`}>
                        <EntryIcon entry={entry} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono text-forge-amber">{entryName(entry)}</code>
                          <span className="text-forge-subtle text-[10px]">by</span>
                          <span className="text-xs text-forge-primary font-medium">{entryAgent(entry)}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold capitalize shrink-0 ${DOMAIN_PILL[domain] || 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>{domain}</span>
                      {entry.kind === 'tool' && (
                        <Badge variant={entry.event.decision === 'allowed' ? 'allowed' : entry.event.decision === 'blocked' ? 'blocked' : 'approval'} size="sm">
                          {entry.event.decision === 'approval_required' ? 'approval' : entry.event.decision}
                        </Badge>
                      )}
                      {entry.kind === 'approval' && (
                        <Badge variant={entry.approval.status === 'approved' ? 'allowed' : entry.approval.status === 'rejected' ? 'blocked' : 'approval'} size="sm">
                          {entry.approval.status}
                        </Badge>
                      )}
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] text-forge-subtle">{timeAgo(entry.ts)}</div>
                        <div className="text-[9px] text-forge-subtle/60">{formatTs(entry.ts)}</div>
                      </div>
                      <div className="shrink-0 text-forge-subtle">
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isOpen && <EntryDetail entry={entry} />}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
