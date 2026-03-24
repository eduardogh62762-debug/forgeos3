import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, ChevronDown, AlertTriangle, Clock, CheckCircle, XCircle, Timer, Activity } from 'lucide-react'
import { useRunStore } from '../store/runStore'
import type { ToolEvent } from '../types/run'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SkeletonCard, SkeletonRow, ErrorState, Spinner } from '../components/ui/Skeleton'

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const D_CONFIG: Record<string, { dot: string; ring: string; text: string; bg: string; label: string; border: string }> = {
  allowed:           { dot: 'bg-emerald-500', ring: 'ring-emerald-500/40', text: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'allowed',  border: 'border-emerald-500/60' },
  blocked:           { dot: 'bg-red-500',     ring: 'ring-red-500/40',     text: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20',         label: 'blocked',  border: 'border-red-500/60'     },
  approval_required: { dot: 'bg-amber-400',   ring: 'ring-amber-400/40',   text: 'text-amber-500',   bg: 'bg-amber-400/10 border-amber-400/20',     label: 'approval', border: 'border-amber-400/60'   },
}

const STATUS_CONFIG: Record<string, { text: string; dot: string }> = {
  finished:         { text: 'text-emerald-500', dot: 'bg-emerald-500' },
  blocked:          { text: 'text-red-500',     dot: 'bg-red-500'     },
  waiting_approval: { text: 'text-amber-500',   dot: 'bg-amber-400'   },
  running:          { text: 'text-blue-400',    dot: 'bg-blue-400'    },
  safe_mode:        { text: 'text-red-500',     dot: 'bg-red-500'     },
}

const DOMAIN_COLOR: Record<string, string> = {
  healthtech: 'text-blue-400',
  agrotech:   'text-green-400',
  fintech:    'text-amber-400',
}

export function SentinelStudio() {
  const { runs, selectedRun, setSelectedRun, loading: runsLoading, error: runsError, fetchRuns } = useRunStore()
  const [selectedEvent, setSelectedEvent] = useState<ToolEvent | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  // Carga inicial + polling cada 5s solo cuando hay runs activos
  useEffect(() => {
    fetchRuns()
    const interval = setInterval(() => {
      const { runs } = useRunStore.getState()
      const hasActive = runs.some(r => r.status === "running" || r.status === "waiting_approval")
      if (hasActive) fetchRuns()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchRuns])

  const run      = selectedRun || runs[0]
  const riskData = (run?.toolEvents ?? []).map((e, i) => ({ name: e.toolName, risk: e.riskScore, i: i + 1 }))
  const sc       = run ? (STATUS_CONFIG[run.status] || STATUS_CONFIG['finished']) : null

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-forge-white">Sentinel Studio</h1>
          <p className="text-xs text-forge-subtle mt-0.5">Real-time observability and audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          {runsLoading && <Spinner size="sm" />}
          <div className="relative">
            <button onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-2 px-4 py-2 bg-forge-surface border border-forge-border rounded-xl text-sm text-forge-primary hover:border-forge-line transition-colors">
              <Eye size={13} className="text-amber-500" />
              <span className="max-w-36 truncate">{run?.agentName || 'Select run'}</span>
              <ChevronDown size={12} className={`text-forge-subtle transition-transform ${showPicker ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showPicker && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-80 bg-forge-surface border border-forge-border rounded-2xl shadow-forge-lg z-20 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-forge-border">
                    <span className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest">Select Run</span>
                  </div>
                  {runsLoading ? (
                    [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                  ) : (
                    runs.map(r => {
                      const s = STATUS_CONFIG[r.status] || STATUS_CONFIG['finished']
                      return (
                        <button key={r.id}
                          onClick={() => { setSelectedRun(r); setSelectedEvent(null); setShowPicker(false) }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-forge-elevated text-left transition-colors border-b border-forge-border/50 last:border-0 ${r.id === run?.id ? 'bg-forge-elevated' : ''}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-forge-primary font-medium truncate">{r.agentName}</div>
                            <div className={`text-[10px] capitalize ${DOMAIN_COLOR[r.domain] || 'text-forge-subtle'}`}>{r.domain} · {timeAgo(r.startedAt)}</div>
                          </div>
                          <span className={`text-[10px] font-semibold ${s.text} shrink-0`}>{r.status.replace('_', ' ')}</span>
                        </button>
                      )
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {runsError && !runsLoading && (
        <div className="px-8 py-6">
          <ErrorState message={runsError} onRetry={fetchRuns} />
        </div>
      )}

      {runsLoading && !run && (
        <div className="px-8 py-6 space-y-5">
          <SkeletonCard />
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2"><SkeletonCard /></div>
            <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
          </div>
        </div>
      )}

      {run && (
        <div className="px-8 py-6 space-y-5">
          <div className="p-5 bg-forge-surface border border-forge-border rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-base font-bold text-forge-white">{run.agentName}</h2>
                  {sc && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forge-elevated border border-forge-border">
                      <div className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${run.status === 'running' ? 'animate-pulse' : ''}`} />
                      <span className={`text-[10px] font-semibold ${sc.text}`}>{run.status.replace('_', ' ')}</span>
                    </div>
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${DOMAIN_COLOR[run.domain] || 'text-forge-subtle'} bg-forge-elevated border border-forge-border`}>
                    {run.domain}
                  </span>
                </div>
                <p className="text-sm text-forge-secondary leading-relaxed">"{run.input}"</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-3xl font-bold ${(run.loopRiskScore ?? 0) > 30 ? 'text-red-500' : (run.loopRiskScore ?? 0) > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {run.loopRiskScore}
                </div>
                <div className="text-[10px] text-forge-subtle">loop risk</div>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-forge-border">
              <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-4">Tool Timeline</div>
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-px bg-forge-border" />
                <div className="flex gap-8 relative overflow-x-auto no-scrollbar pb-2">
                  {(run.toolEvents ?? []).map((event, i) => {
                    const cfg    = D_CONFIG[event.decision]
                    const active  = selectedEvent?.id === event.id
                    const hovered = hoveredEvent === event.id
                    return (
                      <button key={event.id}
                        onClick={() => setSelectedEvent(active ? null : event)}
                        onMouseEnter={() => setHoveredEvent(event.id)}
                        onMouseLeave={() => setHoveredEvent(null)}
                        className="flex flex-col items-center gap-2.5 shrink-0 group outline-none">
                        <div className={`w-8 h-8 rounded-full border-2 border-forge-bg flex items-center justify-center z-10 transition-all duration-150 ${cfg.dot} ${active ? `scale-125 ring-4 ${cfg.ring}` : hovered ? `ring-2 ${cfg.ring} scale-110` : ''}`}>
                          <span className="text-[9px] font-bold text-white">{i + 1}</span>
                        </div>
                        <code className={`text-[10px] font-mono transition-colors ${active ? cfg.text : hovered ? cfg.text : 'text-forge-subtle'}`}>
                          {event.toolName}
                        </code>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all ${active || hovered ? `${cfg.bg} ${cfg.text} ${cfg.border}` : 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <AnimatePresence mode="wait">
                {selectedEvent ? (
                  <motion.div key={selectedEvent.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-forge-white">Event Detail</span>
                        <code className="text-xs font-mono text-amber-500">{selectedEvent.toolName}</code>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold ${D_CONFIG[selectedEvent.decision].bg} ${D_CONFIG[selectedEvent.decision].text}`}>
                        {selectedEvent.decision === 'allowed' ? <CheckCircle size={11} /> : selectedEvent.decision === 'blocked' ? <XCircle size={11} /> : <Timer size={11} />}
                        {D_CONFIG[selectedEvent.decision].label}
                      </div>
                    </div>
                    <div className="p-5 space-y-0">
                      {[
                        { label: 'Tool',       value: selectedEvent.toolName,                                              mono: true  },
                        { label: 'Decision',   value: selectedEvent.decision.replace('_', ' '),                            mono: false },
                        { label: 'Risk Score', value: String(selectedEvent.riskScore),                                     mono: false },
                        { label: 'Timestamp',  value: new Date(selectedEvent.timestamp).toLocaleTimeString(),               mono: false },
                        { label: 'Duration',   value: selectedEvent.durationMs ? `${selectedEvent.durationMs}ms` : 'Pending…', mono: false },
                      ].map(({ label, value, mono }, i) => (
                        <div key={label} className={`flex items-center justify-between py-3 ${i < 4 ? 'border-b border-forge-border/40' : ''}`}>
                          <span className="text-xs text-forge-subtle">{label}</span>
                          <span className={`text-xs font-semibold ${mono ? 'font-mono text-amber-500' : 'text-forge-primary'} capitalize`}>{value}</span>
                        </div>
                      ))}
                    </div>
                    {selectedEvent.reason && (
                      <div className="mx-5 mb-5 p-3.5 bg-red-500/5 border border-red-500/15 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <AlertTriangle size={11} className="text-red-500" />
                          <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Block Reason</span>
                        </div>
                        <p className="text-xs text-forge-secondary leading-relaxed">{selectedEvent.reason}</p>
                      </div>
                    )}
                    {Object.keys(selectedEvent.input).length > 0 && (
                      <div className="mx-5 mb-5">
                        <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-2">Input Payload</div>
                        <pre className="text-[11px] text-forge-secondary font-mono bg-forge-elevated border border-forge-border rounded-xl p-4 overflow-x-auto">
                          {JSON.stringify(selectedEvent.input, null, 2)}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="h-64 bg-forge-surface border border-forge-border rounded-2xl flex flex-col items-center justify-center gap-3">
                    <Eye size={24} className="text-forge-muted" />
                    <p className="text-sm text-forge-subtle">Click a timeline event to inspect</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-forge-border">
                  <Activity size={13} className="text-amber-500" />
                  <span className="text-sm font-bold text-forge-white">Risk Score</span>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={110}>
                    <LineChart data={riskData}>
                      <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#555' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#555' }} tickLine={false} axisLine={false} width={20} />
                      <Tooltip contentStyle={{ background: '#181818', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#888' }} />
                      <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.4} />
                      <Line type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={2}
                        dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3.5 border-b border-forge-border">
                  <Clock size={13} className="text-amber-500" />
                  <span className="text-sm font-bold text-forge-white">Run Stats</span>
                </div>
                <div className="p-4 space-y-2.5">
                  {[
                    { label: 'Started',  value: timeAgo(run.startedAt) },
                    { label: 'Events',   value: (run.toolEvents ?? []).length },
                    { label: 'Allowed',  value: (run.toolEvents ?? []).filter(e => e.decision === 'allowed').length,           color: 'text-emerald-500' },
                    { label: 'Blocked',  value: (run.toolEvents ?? []).filter(e => e.decision === 'blocked').length,           color: 'text-red-500'     },
                    { label: 'Approval', value: (run.toolEvents ?? []).filter(e => e.decision === 'approval_required').length, color: 'text-amber-500'   },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-forge-subtle">{label}</span>
                      <span className={`text-xs font-bold ${color || 'text-forge-primary'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
