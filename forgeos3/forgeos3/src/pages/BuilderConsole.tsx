import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Zap, Shield, AlertTriangle, Lock } from 'lucide-react'
import { Toggle } from '../components/ui/Toggle'
import { DOMAIN_PROFILES, TOOL_PACKS, POLICY_PRESETS } from '../lib/constants'
import type { DomainProfile, RiskMode } from '../types/agent'
import { useAgentStore } from '../store/agentStore'

const STEPS = [
  { label: 'Identity', desc: 'Name and runtime' },
  { label: 'Profile', desc: 'Domain and tools' },
  { label: 'Policy', desc: 'Governance rules' },
  { label: 'Deploy', desc: 'Review and launch' },
]

const DOMAIN_STYLE: Record<string, { border: string; bg: string; icon: string; ring: string }> = {
  healthtech: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: 'text-blue-400', ring: 'ring-blue-500/20' },
  agrotech: { border: 'border-green-500/30', bg: 'bg-green-500/5', icon: 'text-green-400', ring: 'ring-green-500/20' },
  fintech: { border: 'border-amber-400/30', bg: 'bg-amber-400/5', icon: 'text-amber-400', ring: 'ring-amber-400/20' },
  custom: { border: 'border-forge-border', bg: 'bg-forge-elevated', icon: 'text-forge-secondary', ring: 'ring-forge-border' },
}

const SENSITIVITY_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-500',
  high: 'bg-amber-400/10 border-amber-400/20 text-amber-500',
  medium: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  low: 'bg-forge-elevated border-forge-border text-forge-subtle',
}

const slideVariants = {
  enter: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

export function BuilderConsole() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState<DomainProfile>('healthtech')
  const [toolPackId, setToolPackId] = useState('tp-healthtech')
  const [policyId, setPolicyId] = useState('pp-medium')
  const [riskMode, setRiskMode] = useState<RiskMode>('safe')
  const [approvals, setApprovals] = useState<string[]>([])
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const { createAgent } = useAgentStore()
  const navigate = useNavigate()

  const availableToolPacks = TOOL_PACKS.filter(p => p.domain === domain)
  const selectedPack = TOOL_PACKS.find(p => p.id === toolPackId) ?? availableToolPacks[0]
  const selectedPolicy = POLICY_PRESETS.find(p => p.id === policyId)
  const selectedDomain = DOMAIN_PROFILES.find(d => d.key === domain)

  const handleDomainChange = (newDomain: DomainProfile) => {
    setDomain(newDomain)
    const defaultPack = TOOL_PACKS.find(p => p.domain === newDomain)
    if (defaultPack) setToolPackId(defaultPack.id)
  }

  const toggleApproval = (tool: string) =>
    setApprovals(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])

  const canContinue = step === 0 ? name.trim().length >= 3 : true

  const handleContinue = () => {
    if (step < STEPS.length - 1 && canContinue) {
      setStep(s => s + 1)
    }
  }

  const deploy = async () => {
    if (deploying) return
    setDeploying(true)
    setDeployError(null)
    try {
      await createAgent({
        name,
        description,
        runtime: 'openclaw',
        domainProfile: domain,
        toolPackId: selectedPack?.id ?? toolPackId,
        policyPresetId: policyId,
        riskMode,
        requiresApprovalFor: approvals,
        status: 'active',
      })
      setDeployed(true)
      setTimeout(() => navigate('/sentinel'), 1800)
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : 'Deploy failed — check backend')
    } finally {
      setDeploying(false)
    }
  }

  if (deployed) return (
    <div className="min-h-screen flex items-center justify-center bg-forge-bg">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5"
          style={{ boxShadow: '0 0 32px rgba(16,185,129,0.15)' }}>
          <Check size={28} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-forge-white mb-2">Agent deployed successfully</h2>
        <p className="text-sm text-forge-subtle mb-1">Connected to OpenClaw runtime</p>
        <p className="text-xs text-forge-subtle">Redirecting to Sentinel Studio…</p>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-forge-white">Builder Console</h1>
          <p className="text-xs text-forge-subtle mt-0.5">Deploy a new agent to OpenClaw</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-500 font-semibold">OpenClaw · Ready</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2.5 transition-all ${i < step ? 'cursor-pointer' : 'cursor-default'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all ${i === step ? 'bg-amber-400 border-amber-400 text-black'
                    : i < step ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                      : 'bg-forge-elevated border-forge-border text-forge-subtle'
                  }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <div className="hidden sm:block text-left">
                  <div className={`text-xs font-semibold transition-colors ${i === step ? 'text-amber-400' : i < step ? 'text-emerald-500' : 'text-forge-subtle'}`}>
                    {s.label}
                  </div>
                  <div className="text-[10px] text-forge-subtle">{s.desc}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-4 transition-colors ${i < step ? 'bg-emerald-500/30' : 'bg-forge-border'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {step === 0 && (
            <motion.div key="step0" variants={slideVariants} initial="enter" animate="show" exit="exit"
              className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-forge-white mb-1">Agent Identity</h2>
                <p className="text-sm text-forge-subtle">Give your agent a name and connect it to a runtime</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Agent Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. HealthAgent Alpha"
                  className="forge-input text-base"
                  autoFocus />
                {name.length > 0 && name.length < 3 && (
                  <p className="text-[11px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle size={10} /> At least 3 characters
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What does this agent do? What problem does it solve?"
                  className="forge-input resize-none leading-relaxed" rows={3} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Runtime Target</label>
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0"
                    style={{ boxShadow: '0 0 12px rgba(245,158,11,0.3)' }}>
                    <Zap size={15} className="text-black" fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-forge-white">OpenClaw</div>
                    <div className="text-[11px] text-emerald-500">Live adapter · MVP integration</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-bold">Active</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['LangGraph', 'AutoGen', 'CrewAI'].map(r => (
                    <div key={r} className="flex items-center gap-2 p-3 bg-forge-elevated/30 border border-forge-border rounded-xl opacity-35">
                      <Zap size={11} className="text-forge-subtle shrink-0" />
                      <span className="text-xs text-forge-subtle truncate">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="show" exit="exit"
              className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-forge-white mb-1">Domain Profile</h2>
                <p className="text-sm text-forge-subtle">Choose the domain — this determines the default policy and risk mode</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide mb-3 block">Domain</label>
                <div className="grid grid-cols-2 gap-3">
                  {DOMAIN_PROFILES.map(d => {
                    const s = DOMAIN_STYLE[d.key] ?? DOMAIN_STYLE['custom']
                    const active = domain === d.key
                    return (
                      <button key={d.key} onClick={() => handleDomainChange(d.key)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 ${active ? `${s.border} ${s.bg} ring-1 ${s.ring}` : 'border-forge-border bg-forge-surface hover:border-forge-line'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-2xl ${s.icon}`}>{d.icon}</span>
                          {active && <Check size={13} className="text-amber-400" />}
                        </div>
                        <div className="text-sm font-bold text-forge-white mb-0.5">{d.name}</div>
                        <div className="text-[11px] text-forge-subtle leading-relaxed mb-2">{d.description}</div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${d.riskMode === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>
                          {d.riskMode} mode
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide mb-3 block">Tool Pack</label>
                {availableToolPacks.length > 0 ? (
                  availableToolPacks.map(tp => (
                    <div key={tp.id} onClick={() => setToolPackId(tp.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${toolPackId === tp.id ? 'border-amber-400/40 bg-amber-400/5' : 'border-forge-border bg-forge-surface hover:border-forge-line'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-sm font-semibold text-forge-white">{tp.name}</span>
                          <span className="text-[11px] text-forge-subtle ml-2">{(tp.tools ?? []).length} tools</span>
                        </div>
                        {toolPackId === tp.id && <Check size={13} className="text-amber-400" />}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(tp.tools ?? []).map(t => (
                          <code key={t.id} className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono ${SENSITIVITY_STYLE[t.sensitivity]}`}>
                            {t.name}
                          </code>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 border border-forge-border rounded-2xl text-sm text-forge-subtle text-center">
                    No tool packs available for this domain
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="show" exit="exit"
              className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-forge-white mb-1">Policy Configuration</h2>
                <p className="text-sm text-forge-subtle">Define how the Policy Engine governs every tool call</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide mb-3 block">Policy Preset</label>
                <div className="space-y-2">
                  {POLICY_PRESETS.map(p => (
                    <div key={p.id} onClick={() => setPolicyId(p.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${policyId === p.id ? 'border-amber-400/40 bg-amber-400/5' : 'border-forge-border bg-forge-surface hover:border-forge-line'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {policyId === p.id && <Check size={12} className="text-amber-400" />}
                          <span className="text-sm font-bold text-forge-white">{p.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`w-5 h-1.5 rounded-full transition-colors ${i <= p.strictness ? 'bg-amber-400' : 'bg-forge-elevated'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-forge-subtle">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-forge-surface border border-forge-border rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/8 rounded-xl">
                    <Shield size={14} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-forge-white">Safe Mode</div>
                    <div className="text-[11px] text-forge-subtle mt-0.5">Halt agent when loop risk score exceeds threshold</div>
                  </div>
                </div>
                <Toggle checked={riskMode === 'safe'} onChange={v => setRiskMode(v ? 'safe' : 'normal')} />
              </div>

              {selectedPack && (
                <div>
                  <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide mb-3 block">
                    Require Human Approval For
                  </label>
                  <div className="space-y-2">
                    {(selectedPack.tools ?? []).map(t => {
                      const checked = approvals.includes(t.name) || (t.requiresApproval ?? false)
                      return (
                        <div key={t.id} className="flex items-center justify-between p-3.5 bg-forge-surface border border-forge-border rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-forge-elevated rounded-lg">
                              <Lock size={11} className="text-forge-subtle" />
                            </div>
                            <code className="text-xs font-mono text-amber-500">{t.name}</code>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide ${SENSITIVITY_STYLE[t.sensitivity]}`}>
                              {t.sensitivity}
                            </span>
                          </div>
                          <Toggle checked={checked} onChange={() => !(t.requiresApproval ?? false) && toggleApproval(t.name)} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="show" exit="exit"
              className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-forge-white mb-1">Review & Deploy</h2>
                <p className="text-sm text-forge-subtle">Confirm configuration before deploying to OpenClaw</p>
              </div>

              <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                {[
                  { label: 'Agent Name', value: name, highlight: true },
                  { label: 'Description', value: description || '—', highlight: false },
                  { label: 'Runtime', value: 'OpenClaw', highlight: false },
                  { label: 'Domain', value: selectedDomain?.name || '—', highlight: false },
                  { label: 'Tool Pack', value: selectedPack?.name || '—', highlight: false },
                  { label: 'Policy', value: selectedPolicy?.name || '—', highlight: false },
                  { label: 'Risk Mode', value: riskMode, highlight: false },
                  { label: 'Approvals', value: approvals.length > 0 ? approvals.join(', ') : 'Default from policy', highlight: false },
                ].map(({ label, value, highlight }, i) => (
                  <div key={label} className={`flex items-center justify-between px-5 py-3.5 border-b border-forge-border/50 last:border-0 ${i % 2 === 0 ? '' : 'bg-forge-elevated/20'}`}>
                    <span className="text-xs text-forge-subtle font-medium">{label}</span>
                    <span className={`text-sm font-semibold capitalize ${highlight ? 'text-amber-400' : 'text-forge-primary'}`}>{value}</span>
                  </div>
                ))}
              </div>

              {deployError && (
                <div className="flex items-center gap-3 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl">
                  <AlertTriangle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-400">{deployError}</p>
                </div>
              )}

              <button onClick={deploy} disabled={deploying}
                className="w-full flex items-center justify-center gap-2.5 py-4 bg-amber-400 text-black font-bold rounded-2xl hover:bg-amber-300 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ boxShadow: deploying ? 'none' : '0 0 28px rgba(245,158,11,0.3)' }}>
                {deploying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Deploying to OpenClaw…
                  </>
                ) : (
                  <>
                    <Zap size={15} fill="currentColor" />
                    Deploy Agent to OpenClaw
                  </>
                )}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        <div className="flex justify-between mt-8 pt-6 border-t border-forge-border">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-forge-secondary hover:text-forge-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft size={14} /> Back
          </button>
          {step < STEPS.length - 1 && (
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              type="button"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-400 text-black text-sm font-bold rounded-xl hover:bg-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ boxShadow: canContinue ? '0 0 14px rgba(245,158,11,0.2)' : 'none' }}>
              Continue <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
