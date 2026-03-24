import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch, CheckCircle, XCircle, Clock, Zap, Shield,
  ArrowRight, Activity, Filter, ChevronRight
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Badge } from '../components/ui/Badge'
import { useRunStore } from '../store/runStore'
import type { ToolEvent } from '../types/run'

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const DECISION_STYLES: Record<string, { icon: typeof CheckCircle; cls: string; badge: 'allowed' | 'blocked' | 'approval' }> = {
  allowed:           { icon: CheckCircle, cls: 'text-forge-green',  badge: 'allowed'  },
  blocked:           { icon: XCircle,     cls: 'text-forge-red',    badge: 'blocked'  },
  approval_required: { icon: Clock,       cls: 'text-forge-amber',  badge: 'approval' },
}

const DOMAIN_COLOR: Record<string, string> = {
  healthtech: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  agrotech:   'bg-green-500/10 border-green-500/20 text-green-400',
  fintech:    'bg-amber-400/10 border-amber-400/20 text-amber-500',
}

const SENS_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-amber-400',
  medium:   'bg-blue-400',
  low:      'bg-forge-subtle',
}

type FilterType = 'all' | 'allowed' | 'blocked' | 'approval_required'

export function ToolGateway() {
  const { runs } = useRunStore()
  const [filter, setFilter] = useState<FilterType>('all')

  // Flatten all tool events with run context — toolEvents puede llegar null de la API
  const allEvents = runs
    .flatMap(r =>
      (r.toolEvents ?? []).map(e => ({ ...e, agentName: r.agentName, domain: r.domain }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const filtered = filter === 'all' ? allEvents : allEvents.filter(e => e.decision === filter)

  const total    = allEvents.length
  const allowed  = allEvents.filter(e => e.decision === 'allowed').length
  const blocked  = allEvents.filter(e => e.decision === 'blocked').length
  const approval = allEvents.filter(e => e.decision === 'approval_required').length

  const pctAllowed  = total ? Math.round((allowed  / total) * 100) : 0
  const pctBlocked  = total ? Math.round((blocked  / total) * 100) : 0
  const pctApproval = total ? Math.round((approval / total) * 100) : 0

  return (
    <div className="min-h-screen">
      <TopBar
        title="Tool Gateway"
        subtitle="Live intercept layer — every tool call evaluated before execution"
        actions={
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-forge-surface border border-forge-border rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-pulse" />
            <span className="text-xs text-forge-secondary font-medium">Gateway active</span>
          </div>
        }
      />

      <div className="px-8 py-6 space-y-6">

        {/* Architecture flow */}
        <div className="p-5 bg-forge-surface border border-forge-border rounded-2xl overflow-x-auto">
          <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-4">Intercept Flow</div>
          <div className="flex items-center gap-2 min-w-max">
            {[
              { icon: Zap,       label: 'Agent',          sub: 'tool intent',     color: 'text-amber-500',  bg: 'bg-amber-500/10' },
              { icon: GitBranch, label: 'Tool Gateway',   sub: 'intercepted',     color: 'text-blue-400',   bg: 'bg-blue-500/10'  },
              { icon: Shield,    label: 'Policy Engine',  sub: 'evaluate rules',  color: 'text-purple-400', bg: 'bg-purple-500/10'},
              { icon: Activity,  label: 'Decision',       sub: 'allow/block/req', color: 'text-forge-amber', bg: 'bg-amber-500/10'},
            ].map(({ icon: Icon, label, sub, color, bg }, i, arr) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-3 px-4 py-3 ${bg} border border-forge-border rounded-2xl`}>
                  <Icon size={14} className={color} />
                  <div>
                    <div className="text-xs font-semibold text-forge-white">{label}</div>
                    <div className="text-[10px] text-forge-subtle">{sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight size={14} className="text-forge-subtle shrink-0" />
                )}
              </div>
            ))}
            {/* Outcome branches */}
            <ArrowRight size={14} className="text-forge-subtle shrink-0" />
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Execute',  color: 'bg-forge-green/10 border-forge-green/20 text-forge-green'  },
                { label: 'Block',    color: 'bg-forge-red/10 border-forge-red/20 text-forge-red'        },
                { label: 'Queue',    color: 'bg-forge-amber/10 border-forge-amber/20 text-forge-amber'  },
              ].map(({ label, color }) => (
                <span key={label} className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Intercepts', value: total,    color: 'text-forge-white',  bar: null         },
            { label: 'Allowed',          value: allowed,  color: 'text-forge-green',  bar: pctAllowed,  barCls: 'bg-forge-green'  },
            { label: 'Blocked',          value: blocked,  color: 'text-forge-red',    bar: pctBlocked,  barCls: 'bg-forge-red'    },
            { label: 'Approval Req.',    value: approval, color: 'text-forge-amber',  bar: pctApproval, barCls: 'bg-forge-amber'  },
          ].map(({ label, value, color, bar, barCls }) => (
            <div key={label} className="p-5 bg-forge-surface border border-forge-border rounded-2xl">
              <div className="text-[10px] font-semibold text-forge-subtle uppercase tracking-wider mb-3">{label}</div>
              <div className={`text-3xl font-bold tracking-tight mb-3 ${color}`}>{value}</div>
              {bar !== null && bar !== undefined && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-forge-elevated rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${bar}%` }}
                      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${barCls}`} />
                  </div>
                  <div className="text-[10px] text-forge-subtle">{bar}% of total</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Event feed */}
        <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-amber-500" />
              <span className="text-sm font-semibold text-forge-white">Intercept Log</span>
              <span className="text-[10px] px-2 py-0.5 bg-forge-elevated border border-forge-border rounded-full text-forge-subtle">
                {filtered.length} events
              </span>
            </div>
            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              <Filter size={11} className="text-forge-subtle mr-1" />
              {(['all', 'allowed', 'blocked', 'approval_required'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-all capitalize ${
                    filter === f
                      ? f === 'all'               ? 'bg-forge-amber text-forge-bg border-forge-amber'
                      : f === 'allowed'            ? 'bg-forge-green/20 text-forge-green border-forge-green/30'
                      : f === 'blocked'            ? 'bg-forge-red/20 text-forge-red border-forge-red/30'
                      : 'bg-forge-amber/20 text-forge-amber border-forge-amber/30'
                      : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'
                  }`}>
                  {f === 'approval_required' ? 'approval' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-3 px-5 py-2 border-b border-forge-border/50 bg-forge-elevated/20">
            {['Tool', 'Agent', 'Domain', 'Decision', 'Risk', 'Duration', 'Time'].map(h => (
              <div key={h} className={`text-[9px] font-bold uppercase tracking-widest text-forge-subtle ${
                h === 'Tool'     ? 'col-span-2' :
                h === 'Agent'    ? 'col-span-2' :
                h === 'Domain'   ? 'col-span-2' :
                h === 'Decision' ? 'col-span-2' :
                h === 'Risk'     ? 'col-span-1' :
                h === 'Duration' ? 'col-span-1' : 'col-span-2'
              }`}>{h}</div>
            ))}
          </div>

          <div className="divide-y divide-forge-border/30">
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-forge-subtle text-sm">
                  No events match this filter
                </div>
              ) : (
                filtered.map((event, i) => {
                  const ds = DECISION_STYLES[event.decision] || DECISION_STYLES['allowed']
                  const DecisionIcon = ds.icon

                  return (
                    <motion.div key={event.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-forge-elevated/40 transition-colors">

                      {/* Tool */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SENS_DOT['medium']}`} />
                        <code className="text-xs font-mono text-forge-amber truncate">{event.toolName}</code>
                      </div>

                      {/* Agent */}
                      <div className="col-span-2 text-[11px] text-forge-secondary truncate">
                        {(event as ToolEvent & { agentName: string }).agentName}
                      </div>

                      {/* Domain */}
                      <div className="col-span-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold capitalize ${
                          DOMAIN_COLOR[(event as ToolEvent & { domain: string }).domain] || 'bg-forge-elevated border-forge-border text-forge-subtle'
                        }`}>
                          {(event as ToolEvent & { domain: string }).domain}
                        </span>
                      </div>

                      {/* Decision */}
                      <div className="col-span-2 flex items-center gap-1.5">
                        <DecisionIcon size={12} className={ds.cls} />
                        <Badge variant={ds.badge} size="sm">
                          {event.decision === 'approval_required' ? 'approval' : event.decision}
                        </Badge>
                      </div>

                      {/* Risk score */}
                      <div className="col-span-1">
                        <span className={`text-xs font-bold ${
                          event.riskScore > 30 ? 'text-forge-red' :
                          event.riskScore > 15 ? 'text-forge-amber' : 'text-forge-green'
                        }`}>
                          {event.riskScore}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="col-span-1 text-[11px] text-forge-subtle">
                        {event.durationMs ? `${event.durationMs}ms` : '—'}
                      </div>

                      {/* Time */}
                      <div className="col-span-2 text-[11px] text-forge-subtle">
                        {timeAgo(event.timestamp)}
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reason detail for blocked events */}
        {allEvents.some(e => e.decision === 'blocked' && e.reason) && (
          <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-forge-border bg-forge-elevated/20">
              <XCircle size={14} className="text-forge-red" />
              <span className="text-sm font-semibold text-forge-white">Block Reasons</span>
            </div>
            <div className="divide-y divide-forge-border/40">
              {allEvents
                .filter(e => e.decision === 'blocked' && e.reason)
                .map(e => (
                  <div key={e.id} className="flex items-start gap-4 px-5 py-3.5">
                    <code className="text-xs font-mono text-forge-amber shrink-0 w-24">{e.toolName}</code>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ChevronRight size={11} className="text-forge-subtle" />
                    </div>
                    <span className="text-xs text-forge-secondary">{e.reason}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

      </div>
    </div>
  )
}