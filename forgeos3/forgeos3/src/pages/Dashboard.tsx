import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Cpu, Activity, CheckSquare, ShieldOff, TrendingUp,
  ArrowRight, Zap, Shield, Eye, AlertTriangle, Clock,
  ChevronRight
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useRunStore } from '../store/runStore'
import { useAgentStore } from '../store/agentStore'
import { SkeletonMetric, SkeletonRow, SkeletonCard, ErrorBanner } from '../components/ui/Skeleton'
import type { Agent } from '../types/agent'

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  finished:         { label: 'finished',  dot: 'bg-emerald-500', text: 'text-emerald-500' },
  blocked:          { label: 'blocked',   dot: 'bg-red-500',     text: 'text-red-500'     },
  waiting_approval: { label: 'approval',  dot: 'bg-amber-400',   text: 'text-amber-500'   },
  running:          { label: 'running',   dot: 'bg-blue-400',    text: 'text-blue-400'    },
  safe_mode:        { label: 'safe mode', dot: 'bg-red-500',     text: 'text-red-500'     },
}

const DECISION_COLOR: Record<string, string> = {
  allowed:           'bg-emerald-500',
  blocked:           'bg-red-500',
  approval_required: 'bg-amber-400',
}

const DOMAIN_COLOR: Record<string, string> = {
  healthtech: 'text-blue-500',
  agrotech:   'text-green-500',
  fintech:    'text-amber-500',
}

const MINI_CHART = [
  { v: 12 }, { v: 18 }, { v: 8 }, { v: 24 }, { v: 16 }, { v: 30 }, { v: 22 },
  { v: 34 }, { v: 20 }, { v: 28 }, { v: 15 }, { v: 32 },
]

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export function Dashboard() {
  const { user } = useAuthStore()
  const { runs, approvals, loading: loadingRuns, error: errorRuns, fetchRuns, fetchApprovals } = useRunStore()
  const { agents, loading: loadingAgents, error: errorAgents, fetchAgents } = useAgentStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchRuns()
    fetchApprovals()
    fetchAgents()
  }, [fetchRuns, fetchApprovals, fetchAgents])

  const pending   = (approvals ?? []).filter(a => a.status === 'pending').length
  const blocked   = runs.flatMap(r => (r.toolEvents ?? [])).filter(e => e?.decision === 'blocked').length
  const allowed   = runs.flatMap(r => (r.toolEvents ?? [])).filter(e => e?.decision === 'allowed').length
  const allEvents = runs
    .flatMap(r => (r.toolEvents ?? []).map(e => ({ ...e, agentName: r.agentName, domain: r.domain })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const isLoading = loadingRuns || loadingAgents
  const error = errorRuns || errorAgents

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-forge-white">
            {greeting}, <span className="text-amber-500">{user?.name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p className="text-xs text-forge-subtle mt-0.5">ForgeOS3 Console · OpenClaw runtime active</p>
        </div>
        <div className="flex items-center gap-3">
          {pending > 0 && (
            <button onClick={() => navigate('/approvals')}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/25 rounded-xl text-xs text-amber-500 font-medium hover:bg-amber-400/15 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {pending} pending approval{pending > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => navigate('/builder')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300 transition-all"
            style={{ boxShadow: '0 0 14px rgba(245,158,11,0.25)' }}>
            <Zap size={11} fill="currentColor" /> New Agent
          </button>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">

        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => { fetchRuns(); fetchAgents() }}
          />
        )}

        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))
          ) : (
            [
              {
                label: 'Active Agents', value: agents.length, icon: Cpu,
                accent: 'text-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/15',
                sub: 'on OpenClaw runtime',
              },
              {
                label: 'Runs Today', value: runs.length, icon: Activity,
                accent: 'text-blue-400', bg: 'bg-blue-500/8', border: 'border-blue-500/15',
                sub: `${allowed} allowed · ${blocked} blocked`,
              },
              {
                label: 'Pending Approvals', value: pending, icon: CheckSquare,
                accent: pending > 0 ? 'text-amber-500' : 'text-emerald-500',
                bg: pending > 0 ? 'bg-amber-500/8' : 'bg-emerald-500/8',
                border: pending > 0 ? 'border-amber-500/15' : 'border-emerald-500/15',
                sub: pending > 0 ? 'Waiting for review' : 'All clear',
              },
              {
                label: 'Blocked by Policy', value: blocked, icon: ShieldOff,
                accent: 'text-red-500', bg: 'bg-red-500/8', border: 'border-red-500/15',
                sub: 'Policy Engine enforced',
              },
            ].map(({ label, value, icon: Icon, accent, bg, border, sub }) => (
              <motion.div key={label} variants={fadeUp}
                className={`relative p-5 rounded-2xl bg-forge-surface border ${border} overflow-hidden group hover:border-opacity-40 transition-all duration-200`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[10px] font-semibold text-forge-subtle uppercase tracking-wider">{label}</span>
                  <div className={`p-1.5 rounded-lg ${bg}`}>
                    <Icon size={13} className={accent} />
                  </div>
                </div>
                <div className={`text-3xl font-bold tracking-tight mb-1 ${accent}`}>{value}</div>
                <div className="text-[11px] text-forge-subtle">{sub}</div>
                <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20">
                  <ResponsiveContainer width="100%" height={40} minWidth={0}>
                    <AreaChart data={MINI_CHART}>
                      <Area type="monotone" dataKey="v" stroke="currentColor" fill="currentColor" strokeWidth={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        <div className="grid grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            className="col-span-2">
            <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-amber-500" />
                  <span className="text-sm font-semibold text-forge-white">Activity Feed</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-forge-elevated border border-forge-border text-forge-subtle">
                    {allEvents.length}
                  </span>
                </div>
                <button onClick={() => navigate('/sentinel')}
                  className="flex items-center gap-1 text-[11px] text-forge-subtle hover:text-amber-500 transition-colors">
                  View Sentinel <ChevronRight size={11} />
                </button>
              </div>
              <div className="grid grid-cols-12 px-5 py-2 text-[9px] uppercase tracking-widest text-forge-subtle font-semibold border-b border-forge-border/50">
                <span className="col-span-1"></span>
                <span className="col-span-3">Agent</span>
                <span className="col-span-2">Tool</span>
                <span className="col-span-2">Domain</span>
                <span className="col-span-2">Decision</span>
                <span className="col-span-2 text-right">Time</span>
              </div>
              <div className="divide-y divide-forge-border/40 max-h-95 overflow-y-auto no-scrollbar">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : allEvents.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-forge-subtle text-sm">
                    No events yet
                  </div>
                ) : (
                  allEvents.slice(0, 10).map((event, i) => (
                    <motion.div key={event.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.04, duration: 0.3 }}
                      className="grid grid-cols-12 items-center px-5 py-3 hover:bg-forge-elevated/50 transition-colors group">
                      <div className="col-span-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${DECISION_COLOR[event.decision] || 'bg-forge-muted'}`} />
                      </div>
                      <div className="col-span-3 text-xs text-forge-primary font-medium truncate pr-2">{event.agentName}</div>
                      <div className="col-span-2">
                        <code className="text-[11px] text-amber-500 font-mono">{event.toolName}</code>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[11px] capitalize ${DOMAIN_COLOR[event.domain] || 'text-forge-subtle'}`}>{event.domain}</span>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          event.decision === 'allowed'
                            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-500'
                            : event.decision === 'blocked'
                            ? 'bg-red-500/8 border-red-500/20 text-red-500'
                            : 'bg-amber-500/8 border-amber-500/20 text-amber-500'
                        }`}>
                          {event.decision === 'approval_required' ? 'approval' : event.decision}
                        </span>
                      </div>
                      <div className="col-span-2 text-right text-[10px] text-forge-subtle">{timeAgo(event.timestamp)}</div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
            className="space-y-4">
            <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-amber-500" />
                  <span className="text-sm font-semibold text-forge-white">Loop Guard</span>
                </div>
                <span className="text-[10px] text-forge-subtle">risk scores</span>
              </div>
              <div className="p-4 space-y-4">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="animate-pulse bg-forge-elevated rounded h-3 w-24" />
                        <div className="animate-pulse bg-forge-elevated rounded h-3 w-8" />
                      </div>
                      <div className="animate-pulse bg-forge-elevated rounded-full h-1.5 w-full" />
                    </div>
                  ))
                ) : (
                  runs.map(run => {
                    const pct = Math.min(run.loopRiskScore ?? 0, 100)
                    const color = (run.loopRiskScore ?? 0) > 30 ? 'bg-red-500' : (run.loopRiskScore ?? 0) > 15 ? 'bg-amber-400' : 'bg-emerald-500'
                    const textColor = (run.loopRiskScore ?? 0) > 30 ? 'text-red-500' : (run.loopRiskScore ?? 0) > 15 ? 'text-amber-500' : 'text-emerald-500'
                    return (
                      <div key={run.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-forge-secondary truncate max-w-35">{run.agentName}</span>
                          <div className="flex items-center gap-2">
                            {(run.loopRiskScore ?? 0) > 30 && <AlertTriangle size={10} className="text-red-500" />}
                            <span className={`text-xs font-bold ${textColor}`}>{run.loopRiskScore ?? 0}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-forge-elevated rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${color}`} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
                <div className="flex items-center gap-2">
                  <Clock size={13} className="text-amber-500" />
                  <span className="text-sm font-semibold text-forge-white">Recent Runs</span>
                </div>
                <button onClick={() => navigate('/sentinel')} className="text-[10px] text-forge-subtle hover:text-amber-500 transition-colors">
                  all →
                </button>
              </div>
              <div className="divide-y divide-forge-border/40">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  runs.map(run => {
                    const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG['finished']
                    return (
                      <div key={run.id} className="flex items-center gap-3 px-5 py-3 hover:bg-forge-elevated/50 transition-colors cursor-pointer"
                        onClick={() => navigate('/sentinel')}>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-forge-primary font-medium truncate">{run.agentName}</div>
                          <div className={`text-[10px] capitalize ${DOMAIN_COLOR[run.domain] || 'text-forge-subtle'}`}>{run.domain}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`text-[10px] font-semibold ${cfg.text}`}>{cfg.label}</div>
                          <div className="text-[9px] text-forge-subtle">{timeAgo(run.startedAt)}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={13} className="text-amber-500" />
              <span className="text-sm font-semibold text-forge-white">Agents</span>
            </div>
            <button onClick={() => navigate('/builder')}
              className="flex items-center gap-1 text-[11px] text-forge-subtle hover:text-amber-500 transition-colors">
              Deploy new <ArrowRight size={11} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              agents.map((agent: Agent) => {
                const run = runs.find(r => r.agentId === agent.id)
                const domainIcon: Record<string, string> = { healthtech: '♥', agrotech: '⬡', fintech: '◈', custom: '◎' }
                const domainCol: Record<string, string> = { healthtech: 'text-blue-500', agrotech: 'text-green-500', fintech: 'text-amber-500', custom: 'text-forge-subtle' }
                return (
                  <div key={agent.id}
                    className="p-4 bg-forge-surface border border-forge-border rounded-2xl hover:border-forge-line transition-colors cursor-pointer group"
                    onClick={() => navigate('/sentinel')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-forge-elevated border border-forge-border flex items-center justify-center">
                          <span className={`text-sm ${domainCol[agent.domainProfile] || 'text-forge-subtle'}`}>
                            {domainIcon[agent.domainProfile]}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-forge-white group-hover:text-amber-500 transition-colors">{agent.name}</div>
                          <div className={`text-[10px] capitalize ${domainCol[agent.domainProfile] || 'text-forge-subtle'}`}>{agent.domainProfile}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wide">live</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-forge-subtle">
                      <div className="flex items-center gap-1">
                        <Zap size={9} className="text-amber-500" />
                        <span>OpenClaw</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield size={9} className="text-blue-400" />
                        <span>{(agent.policyPresetId ?? '').replace('pp-', '') || '—'}</span>
                      </div>
                      {run && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Eye size={9} />
                          <span>risk {run.loopRiskScore ?? 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Zap,         label: 'Build Agent',     sub: 'Deploy to OpenClaw',  path: '/builder',   color: 'text-amber-500',  bg: 'bg-amber-500/8'  },
              { icon: Eye,         label: 'Sentinel Studio', sub: 'Inspect active runs',  path: '/sentinel',  color: 'text-blue-400',   bg: 'bg-blue-500/8'   },
              { icon: Shield,      label: 'Policy Studio',   sub: 'Configure governance', path: '/policy',    color: 'text-purple-400', bg: 'bg-purple-500/8' },
              { icon: CheckSquare, label: 'Approvals',       sub: `${pending} pending`,   path: '/approvals', color: pending > 0 ? 'text-amber-500' : 'text-emerald-500', bg: pending > 0 ? 'bg-amber-500/8' : 'bg-emerald-500/8' },
            ].map(({ icon: Icon, label, sub, path, color, bg }) => (
              <button key={label} onClick={() => navigate(path)}
                className="flex items-center gap-3 p-4 bg-forge-surface border border-forge-border rounded-2xl hover:border-forge-line transition-all text-left group">
                <div className={`p-2 rounded-xl ${bg} shrink-0`}>
                  <Icon size={14} className={color} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-forge-white group-hover:text-amber-500 transition-colors">{label}</div>
                  <div className="text-[10px] text-forge-subtle truncate">{sub}</div>
                </div>
                <ChevronRight size={12} className="text-forge-subtle ml-auto shrink-0 group-hover:text-forge-primary transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
