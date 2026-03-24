import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Toggle } from '../components/ui/Toggle'
import { POLICY_PRESETS, TOOL_PACKS } from '../lib/constants'
import type { PolicyPreset } from '../types/agent'

const DOMAIN_STYLE: Record<string, string> = {
  healthtech: 'text-blue-400',
  agrotech: 'text-green-400',
  fintech: 'text-amber-400',
}

const SENS_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-500',
  high: 'bg-amber-400/10 border-amber-400/20 text-amber-500',
  medium: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  low: 'bg-forge-elevated border-forge-border text-forge-subtle',
}

type ApprovalOverrides = Record<string, boolean>

export function PolicyStudio() {
  const [selected, setSelected] = useState<PolicyPreset>(POLICY_PRESETS[1])
  const [approvalOverrides, setApprovalOverrides] = useState<ApprovalOverrides>({})
  const [activePreset, setActivePreset] = useState<string>(POLICY_PRESETS[1].id)

  const toggleApproval = (toolId: string, currentValue: boolean) => {
    setApprovalOverrides(prev => ({ ...prev, [toolId]: !currentValue }))
  }

  const getApprovalState = (toolId: string, defaultValue: boolean): boolean => {
    return approvalOverrides[toolId] ?? defaultValue
  }

  const handleSelectPreset = (p: PolicyPreset) => {
    setSelected(p)
    setApprovalOverrides({})
  }

  const handleActivate = () => {
    setActivePreset(selected.id)
  }

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-forge-white">Policy Studio</h1>
          <p className="text-xs text-forge-subtle mt-0.5">Configure governance rules per domain and tool</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-surface border border-forge-border rounded-xl">
            <Shield size={12} className="text-amber-500" />
            <span className="text-xs text-forge-secondary font-medium">{POLICY_PRESETS.find(p => p.id === activePreset)?.name ?? selected.name} active</span>
          </div>
          {selected.id !== activePreset && (
            <button
              onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300 transition-all">
              Activate {selected.name}
            </button>
          )}
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-5">
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-4">Presets</div>
            {POLICY_PRESETS.map(p => (
              <button key={p.id} onClick={() => handleSelectPreset(p)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selected.id === p.id ? 'border-amber-400/40 bg-amber-400/5' : 'border-forge-border bg-forge-surface hover:border-forge-line'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-forge-white">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {activePreset === p.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    {selected.id === p.id && <CheckCircle size={13} className="text-amber-400" />}
                  </div>
                </div>
                <p className="text-[11px] text-forge-subtle mb-3 leading-relaxed">{p.description}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= p.strictness ? 'bg-amber-400' : 'bg-forge-elevated'}`} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="col-span-3">
            <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border bg-forge-elevated/40">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-amber-500" />
                    <span className="text-sm font-bold text-forge-white">{selected.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${selected.level === 'strict' ? 'bg-red-500/10 border-red-500/20 text-red-500' : selected.level === 'medium' ? 'bg-amber-400/10 border-amber-400/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                      {selected.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-[9px] font-bold uppercase tracking-widest text-forge-subtle">
                    <span className="w-16 text-center">Decision</span>
                    <span className="w-12 text-center">Approval</span>
                  </div>
                </div>

                {TOOL_PACKS.map((tp, tpi) => (
                  <div key={tp.id}>
                    <div className={`flex items-center gap-2 px-5 py-2.5 ${tpi > 0 ? 'border-t border-forge-border' : ''} bg-forge-elevated/20`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${DOMAIN_STYLE[tp.domain] || 'text-forge-subtle'}`}>{tp.name}</span>
                      <div className="flex-1 h-px bg-forge-border/50" />
                    </div>
                    {tp.tools.map(t => {
                      const isBlocked = t.sensitivity === 'critical' && selected.level === 'strict'
                      const defaultApproval = t.requiresApproval || (t.sensitivity === 'high' && selected.level !== 'low')
                      const needsApproval = getApprovalState(t.id, defaultApproval)
                      const decision = isBlocked ? 'blocked' : needsApproval ? 'approval' : 'allowed'

                      return (
                        <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 border-t border-forge-border/40 hover:bg-forge-elevated/30 transition-colors group">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <code className="text-xs font-mono text-amber-500 w-28 shrink-0">{t.name}</code>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${SENS_STYLE[t.sensitivity]}`}>
                              {t.sensitivity}
                            </span>
                            <span className="text-xs text-forge-subtle truncate">{t.description}</span>
                          </div>
                          <div className="flex items-center gap-6 shrink-0">
                            <div className="w-16 flex justify-center">
                              {decision === 'allowed' ? (
                                <div className="flex items-center gap-1 text-emerald-500">
                                  <CheckCircle size={13} />
                                  <span className="text-[10px] font-semibold">allow</span>
                                </div>
                              ) : decision === 'blocked' ? (
                                <div className="flex items-center gap-1 text-red-500">
                                  <XCircle size={13} />
                                  <span className="text-[10px] font-semibold">block</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Clock size={13} />
                                  <span className="text-[10px] font-semibold">review</span>
                                </div>
                              )}
                            </div>
                            <div className="w-12 flex justify-center">
                              <Toggle
                                checked={needsApproval}
                                onChange={() => !isBlocked && toggleApproval(t.id, needsApproval)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
