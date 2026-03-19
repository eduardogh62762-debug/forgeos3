import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ShieldOff, RefreshCw, Activity, Zap, TrendingUp, Info } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useRunStore } from '../store/runStore'
import type { Run } from '../types/run'

function getRiskLevel(score: number): { label: string; color: string; text: string; bg: string; border: string } {
  if (score > 30) return { label: 'CRITICAL', color: 'bg-forge-red',   text: 'text-forge-red',   bg: 'bg-forge-red/8',   border: 'border-forge-red/20'   }
  if (score > 15) return { label: 'ELEVATED', color: 'bg-forge-amber', text: 'text-forge-amber', bg: 'bg-forge-amber/8', border: 'border-forge-amber/20' }
  return              { label: 'NORMAL',   color: 'bg-forge-green', text: 'text-forge-green', bg: 'bg-forge-green/8', border: 'border-forge-green/20' }
}

const DOMAIN_COLOR: Record<string, string> = {
  healthtech: 'text-blue-400',
  agrotech:   'text-green-400',
  fintech:    'text-amber-500',
}

// Generate fake loop score history for visual interest
function fakeHistory(current: number) {
  const pts = 8
  return Array.from({ length: pts }, (_, i) => {
    const progress = i / (pts - 1)
    const base = current * progress
    const jitter = (Math.random() - 0.5) * 6
    return Math.max(0, Math.round(base + jitter))
  }).concat([current])
}

export function LoopGuard() {
  const { runs } = useRunStore()
  const [killModal, setKillModal] = useState<Run | null>(null)
  const [killed, setKilled] = useState<Set<string>>(new Set())
  const [safeMode, setSafeMode] = useState<Set<string>>(new Set())

  const totalHigh = runs.filter(r => r.loopRiskScore > 30).length
  const totalElevated = runs.filter(r => r.loopRiskScore > 15 && r.loopRiskScore <= 30).length
  const avgRisk = runs.length
    ? Math.round(runs.reduce((s, r) => s + r.loopRiskScore, 0) / runs.length)
    : 0

  const confirmKill = () => {
    if (!killModal) return
    setKilled(prev => new Set([...prev, killModal.id]))
    setKillModal(null)
  }

  return (
    <div className="min-h-screen">
      <TopBar
        title="Loop Guard"
        subtitle="Runaway behavior detection — monitor loop risk scores and kill switches"
        actions={
          totalHigh > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-red/10 border border-forge-red/20 rounded-full">
              <AlertTriangle size={12} className="text-forge-red" />
              <span className="text-xs text-forge-red font-medium">{totalHigh} critical run{totalHigh > 1 ? 's' : ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-green/8 border border-forge-green/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-pulse" />
              <span className="text-xs text-forge-green font-medium">All systems normal</span>
            </div>
          )
        }
      />

      <div className="px-8 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Critical Runs',    value: totalHigh,     color: 'text-forge-red',   sub: 'score > 30' },
            { label: 'Elevated Runs',    value: totalElevated, color: 'text-forge-amber', sub: 'score 15–30' },
            { label: 'Avg. Risk Score',  value: avgRisk,       color: avgRisk > 20 ? 'text-forge-amber' : 'text-forge-green', sub: 'across all runs' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="p-5 bg-forge-surface border border-forge-border rounded-2xl">
              <div className="text-[10px] font-semibold text-forge-subtle uppercase tracking-wider mb-3">{label}</div>
              <div className={`text-3xl font-bold tracking-tight mb-1 ${color}`}>{value}</div>
              <div className="text-[11px] text-forge-subtle">{sub}</div>
            </div>
          ))}
        </div>

        {/* Threshold legend */}
        <div className="flex items-center gap-4 p-4 bg-forge-surface border border-forge-border rounded-2xl">
          <div className="flex items-center gap-2">
            <Info size={12} className="text-forge-subtle" />
            <span className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest">Thresholds</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-forge-green" />
            <span className="text-[11px] text-forge-secondary">Normal (0–14)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-forge-amber" />
            <span className="text-[11px] text-forge-secondary">Elevated (15–30)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-forge-red" />
            <span className="text-[11px] text-forge-secondary">Critical (&gt;30) — auto safe mode</span>
          </div>
        </div>

        {/* Run risk cards */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest">Run Risk Monitor</div>
          {runs.map((run, ri) => {
            const level = getRiskLevel(killed.has(run.id) ? 0 : run.loopRiskScore)
            const isKilled = killed.has(run.id)
            const isSafe   = safeMode.has(run.id)
            const pct      = Math.min(isKilled ? 0 : run.loopRiskScore, 100)
            const history  = fakeHistory(isKilled ? 0 : run.loopRiskScore)
            const toolRepeat = run.toolEvents.length > 1 &&
              run.toolEvents[run.toolEvents.length - 1]?.toolName === run.toolEvents[run.toolEvents.length - 2]?.toolName

            return (
              <motion.div key={run.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.1, duration: 0.3 }}>
                <Card className={`p-5 ${!isKilled && run.loopRiskScore > 30 ? 'border-forge-red/30' : ''}`}>
                  <div className="flex items-start gap-5">

                    {/* Left: run info + gauge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-forge-white">{run.agentName}</span>
                        <span className={`text-[10px] font-semibold capitalize ${DOMAIN_COLOR[run.domain] || 'text-forge-subtle'}`}>
                          {run.domain}
                        </span>
                        {toolRepeat && !isKilled && (
                          <span className="flex items-center gap-1 text-[9px] text-forge-amber px-2 py-0.5 bg-forge-amber/10 border border-forge-amber/20 rounded-full">
                            <RefreshCw size={8} /> tool repeat detected
                          </span>
                        )}
                        {isKilled && (
                          <Badge variant="blocked" size="sm">killed</Badge>
                        )}
                        {isSafe && !isKilled && (
                          <Badge variant="approval" size="sm">safe mode</Badge>
                        )}
                      </div>

                      <div className="text-[11px] text-forge-subtle mb-4 truncate">{run.id}</div>

                      {/* Risk gauge bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-forge-subtle">Loop Risk Score</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${level.bg} ${level.border} ${level.text}`}>
                              {level.label}
                            </span>
                            <span className={`text-xl font-bold ${level.text}`}>
                              {isKilled ? 0 : run.loopRiskScore}
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-forge-elevated rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.4 + ri * 0.1, duration: 0.7, ease: 'easeOut' }}
                            className={`h-full rounded-full ${level.color}`}
                          />
                        </div>
                        {/* Threshold markers */}
                        <div className="relative h-3">
                          <div className="absolute left-[15%] top-0 w-px h-3 bg-forge-amber/40" />
                          <div className="absolute left-[30%] top-0 w-px h-3 bg-forge-red/40" />
                          <div className="absolute left-[15%] top-0 text-[8px] text-forge-amber/60 translate-x-1">15</div>
                          <div className="absolute left-[30%] top-0 text-[8px] text-forge-red/60 translate-x-1">30</div>
                        </div>
                      </div>

                      {/* Mini history sparkline */}
                      <div className="mt-3 flex items-end gap-0.5 h-8">
                        {history.map((v, i) => (
                          <div key={i} className="flex-1 rounded-sm transition-all"
                            style={{
                              height: `${Math.max(8, (v / Math.max(...history, 1)) * 100)}%`,
                              backgroundColor: v > 30 ? 'rgba(239,68,68,0.4)' : v > 15 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)',
                            }} />
                        ))}
                      </div>
                      <div className="text-[9px] text-forge-subtle mt-1">Risk score history</div>
                    </div>

                    {/* Right: tool events + controls */}
                    <div className="w-64 shrink-0 space-y-3">
                      {/* Tool call sequence */}
                      <div className="space-y-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-forge-subtle">Tool Sequence</div>
                        {run.toolEvents.slice(-4).map((te, i, arr) => (
                          <div key={te.id} className="flex items-center gap-2">
                            <span className="text-[9px] text-forge-subtle w-3 text-right">{i + 1}</span>
                            <div className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                              te.decision === 'allowed'           ? 'bg-forge-green/5 border-forge-green/15'   :
                              te.decision === 'blocked'           ? 'bg-forge-red/5 border-forge-red/15'       :
                                                                    'bg-forge-amber/5 border-forge-amber/15'
                            }`}>
                              <code className="text-[10px] font-mono text-forge-amber">{te.toolName}</code>
                              <span className={`text-[9px] font-bold ${
                                te.decision === 'allowed' ? 'text-forge-green' :
                                te.decision === 'blocked' ? 'text-forge-red' : 'text-forge-amber'
                              }`}>
                                {te.decision === 'approval_required' ? 'req.' : te.decision}
                              </span>
                            </div>
                            {/* Highlight repeat */}
                            {i > 0 && arr[i - 1]?.toolName === te.toolName && (
                              <RefreshCw size={9} className="text-forge-amber shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Kill / Safe mode controls */}
                      {!isKilled && (
                        <div className="flex gap-2 pt-2 border-t border-forge-border">
                          <Button
                            variant="ghost" size="sm"
                            className="flex-1 text-forge-amber border border-forge-amber/20 hover:bg-forge-amber/10"
                            onClick={() => setSafeMode(prev => {
                              const next = new Set(prev)
                              if (next.has(run.id)) { next.delete(run.id) } else { next.add(run.id) }
                              return next
                            })}>
                            <ShieldOff size={11} />
                            {isSafe ? 'Exit Safe' : 'Safe Mode'}
                          </Button>
                          <Button
                            variant="danger" size="sm"
                            className="flex-1"
                            onClick={() => setKillModal(run)}>
                            <Zap size={11} />
                            Kill Run
                          </Button>
                        </div>
                      )}
                      {isKilled && (
                        <div className="flex items-center justify-center gap-2 py-2 text-forge-subtle text-xs border-t border-forge-border">
                          <Activity size={11} />
                          Run terminated
                        </div>
                      )}
                    </div>
                  </div>

                  {/* High risk warning banner */}
                  {run.loopRiskScore > 30 && !isKilled && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 flex items-start gap-3 p-3 bg-forge-red/8 border border-forge-red/20 rounded-xl">
                      <AlertTriangle size={13} className="text-forge-red mt-0.5 shrink-0" />
                      <div className="text-xs text-forge-red">
                        <span className="font-semibold">Critical threshold exceeded.</span> Loop risk score &gt;30 — safe mode auto-recommended. Review tool sequence and consider killing this run.
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* How Loop Guard works */}
        <div className="p-5 bg-forge-surface border border-forge-border rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-forge-white">How Loop Guard works</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs text-forge-secondary leading-relaxed">
            <div>
              <div className="text-forge-white font-semibold mb-1.5">Repetition Detection</div>
              Monitors for the same tool being called consecutively or in tight sequences. Each repeat increments the loop risk score.
            </div>
            <div>
              <div className="text-forge-white font-semibold mb-1.5">Risk Scoring</div>
              Score starts at 0 and accumulates. Tool repetitions, high-sensitivity calls, and short time windows between calls all raise the score.
            </div>
            <div>
              <div className="text-forge-white font-semibold mb-1.5">Safe Mode & Kill</div>
              At threshold 30, safe mode is auto-recommended. The kill switch terminates the run immediately and logs the event to the audit trail.
            </div>
          </div>
        </div>

      </div>

      {/* Kill confirmation modal */}
      <Modal open={!!killModal} onClose={() => setKillModal(null)} title="Confirm Kill Run">
        {killModal && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-forge-red/8 border border-forge-red/20 rounded-xl">
              <AlertTriangle size={15} className="text-forge-red mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-forge-primary mb-1">
                  Kill <span className="text-forge-amber">{killModal.agentName}</span>?
                </p>
                <p className="text-xs text-forge-subtle">
                  This will immediately terminate the run and log it to the audit trail. The agent will need to be redeployed to run again.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 bg-forge-elevated border border-forge-border rounded-xl">
              <div className="text-[11px] text-forge-subtle">Loop Risk Score</div>
              <div className="text-lg font-bold text-forge-red ml-auto">{killModal.loopRiskScore}</div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setKillModal(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" onClick={confirmKill}>
                <Zap size={12} /> Kill Run
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}