import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle, Lock, Zap, Eye, Ban } from 'lucide-react'
import { Toggle } from '../components/ui/Toggle'
import { POLICY_PRESETS, TOOL_PACKS } from '../lib/constants'
import type { PolicyPreset } from '../types/agent'

const DOMAIN_STYLE: Record<string, string> = {
  healthtech: 'text-blue-400',
  agrotech:   'text-green-400',
  fintech:    'text-amber-400',
}

const SENS_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-500',
  high:     'bg-amber-400/10 border-amber-400/20 text-amber-500',
  medium:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
  low:      'bg-forge-elevated border-forge-border text-forge-subtle',
}

// ── Reglas nombradas (punto 3) ──────────────────────────────────────────────
interface NamedRule {
  id: string
  icon: typeof Shield
  label: string
  description: string
  category: 'amount' | 'sensitive' | 'access'
  enabled: boolean
}

const DEFAULT_RULES: NamedRule[] = [
  { id: 'block_high_amount',   icon: DollarSign,    label: 'Bloquear transferencias > $10,000',       description: 'Rechaza automáticamente cualquier transferencia que supere el límite definido.',          category: 'amount',    enabled: true  },
  { id: 'block_bulk_payments', icon: Ban,           label: 'Bloquear pagos en lote sin aprobación',   description: 'Requiere revisión humana para ejecuciones de pagos múltiples simultáneos.',               category: 'amount',    enabled: true  },
  { id: 'block_delete_ops',    icon: XCircle,       label: 'Bloquear operaciones DELETE',             description: 'Impide que cualquier agente ejecute eliminaciones permanentes de registros.',             category: 'sensitive', enabled: true  },
  { id: 'block_exec',          icon: Zap,           label: 'Bloquear ejecución de código arbitrario', description: 'Prohíbe herramientas de tipo exec, eval o shell en cualquier dominio.',                  category: 'sensitive', enabled: true  },
  { id: 'require_approval_pii',icon: Lock,          label: 'Aprobar acceso a datos PII',              description: 'Todo acceso a información personal identificable requiere aprobación del admin.',         category: 'sensitive', enabled: true  },
  { id: 'flag_sensitive_write',icon: AlertTriangle, label: 'Alertar escrituras en registros clínicos', description: 'Genera alerta cuando un agente intenta escribir en expedientes médicos o registros.',    category: 'sensitive', enabled: false },
  { id: 'readonly_mode',       icon: Eye,           label: 'Modo solo lectura (sandbox)',             description: 'Restringe todos los agentes a operaciones de lectura únicamente. Útil para demos.',      category: 'access',    enabled: false },
  { id: 'block_external_calls',icon: Shield,        label: 'Bloquear llamadas a APIs externas',       description: 'Impide que los agentes consulten servicios fuera del entorno controlado.',                category: 'access',    enabled: false },
]

const CATEGORY_META = {
  amount:    { label: 'Control de Montos',      color: 'text-amber-400' },
  sensitive: { label: 'Acciones Sensibles',     color: 'text-red-400'   },
  access:    { label: 'Control de Acceso',      color: 'text-blue-400'  },
}

type ApprovalOverrides = Record<string, boolean>
type Tab = 'rules' | 'tools'

export function PolicyStudio() {
  const [selected, setSelected]               = useState<PolicyPreset>(POLICY_PRESETS[1])
  const [approvalOverrides, setApprovalOverrides] = useState<ApprovalOverrides>({})
  const [activePreset, setActivePreset]       = useState<string>(POLICY_PRESETS[1].id)
  const [rules, setRules]                     = useState<NamedRule[]>(DEFAULT_RULES)
  const [tab, setTab]                         = useState<Tab>('rules')
  const [saved, setSaved]                     = useState(false)

  const toggleApproval = (toolId: string, currentValue: boolean) =>
    setApprovalOverrides(prev => ({ ...prev, [toolId]: !currentValue }))

  const getApprovalState = (toolId: string, defaultValue: boolean): boolean =>
    approvalOverrides[toolId] ?? defaultValue

  const handleSelectPreset = (p: PolicyPreset) => {
    setSelected(p)
    setApprovalOverrides({})
  }

  const handleActivate = () => {
    setActivePreset(selected.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleRule = (id: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))

  const enabledCount = rules.filter(r => r.enabled).length

  // Group rules by category
  const grouped = (['amount', 'sensitive', 'access'] as const).map(cat => ({
    cat,
    items: rules.filter(r => r.category === cat),
  }))

  return (
    <div className="min-h-screen bg-forge-bg">
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-forge-white">Editor de Políticas</h1>
          <p className="text-xs text-forge-subtle mt-0.5">Activa o desactiva reglas de gobernanza por tipo de acción</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-surface border border-forge-border rounded-xl">
            <Shield size={12} className="text-amber-500" />
            <span className="text-xs text-forge-secondary font-medium">
              {POLICY_PRESETS.find(p => p.id === activePreset)?.name ?? selected.name} · {enabledCount} reglas activas
            </span>
          </div>
          {saved ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Guardado</span>
            </div>
          ) : selected.id !== activePreset ? (
            <button onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300 transition-all">
              Activar {selected.name}
            </button>
          ) : (
            <button onClick={handleActivate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-forge-elevated border border-forge-border text-forge-secondary text-xs font-semibold rounded-xl hover:border-forge-line transition-all">
              Guardar cambios
            </button>
          )}
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-5">

          {/* PRESETS */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-4">Presets</div>
            {POLICY_PRESETS.map(p => (
              <button key={p.id} onClick={() => handleSelectPreset(p)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selected.id === p.id ? 'border-amber-400/40 bg-amber-400/5' : 'border-forge-border bg-forge-surface hover:border-forge-line'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-forge-white">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {activePreset === p.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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

          {/* MAIN PANEL */}
          <div className="col-span-3">
            <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

              {/* TABS */}
              <div className="flex gap-1 mb-4 p-1 bg-forge-surface border border-forge-border rounded-xl w-fit">
                {([['rules', 'Reglas'], ['tools', 'Herramientas']] as [Tab, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === key ? 'bg-forge-elevated text-forge-white' : 'text-forge-subtle hover:text-forge-primary'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* ── TAB: REGLAS ── */}
              {tab === 'rules' && (
                <div className="space-y-4">
                  {grouped.map(({ cat, items }) => (
                    <div key={cat} className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-5 py-3 bg-forge-elevated/30 border-b border-forge-border">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${CATEGORY_META[cat].color}`}>
                          {CATEGORY_META[cat].label}
                        </span>
                        <div className="flex-1 h-px bg-forge-border/50" />
                        <span className="text-[10px] text-forge-subtle">
                          {items.filter(r => r.enabled).length}/{items.length} activas
                        </span>
                      </div>
                      {items.map((rule, i) => {
                        const Icon = rule.icon
                        return (
                          <div key={rule.id}
                            className={`flex items-center gap-4 px-5 py-4 hover:bg-forge-elevated/20 transition-colors ${i > 0 ? 'border-t border-forge-border/40' : ''}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${rule.enabled ? 'bg-forge-elevated' : 'bg-forge-elevated/40'}`}>
                              <Icon size={14} className={rule.enabled ? CATEGORY_META[rule.category].color : 'text-forge-subtle/40'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${rule.enabled ? 'text-forge-white' : 'text-forge-subtle'}`}>
                                {rule.label}
                              </p>
                              <p className="text-xs text-forge-subtle mt-0.5 leading-relaxed">{rule.description}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rule.enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>
                                {rule.enabled ? 'Activa' : 'Inactiva'}
                              </span>
                              <Toggle checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB: HERRAMIENTAS ── */}
              {tab === 'tools' && (
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
                      <span className="w-16 text-center">Decisión</span>
                      <span className="w-12 text-center">Aprobar</span>
                    </div>
                  </div>
                  {TOOL_PACKS.map((tp, tpi) => (
                    <div key={tp.id}>
                      <div className={`flex items-center gap-2 px-5 py-2.5 ${tpi > 0 ? 'border-t border-forge-border' : ''} bg-forge-elevated/20`}>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${DOMAIN_STYLE[tp.domain] || 'text-forge-subtle'}`}>{tp.name}</span>
                        <div className="flex-1 h-px bg-forge-border/50" />
                      </div>
                      {tp.tools.map(t => {
                        const isBlocked     = t.sensitivity === 'critical' && selected.level === 'strict'
                        const defaultApproval = t.requiresApproval || (t.sensitivity === 'high' && selected.level !== 'low')
                        const needsApproval = getApprovalState(t.id, defaultApproval)
                        const decision      = isBlocked ? 'blocked' : needsApproval ? 'approval' : 'allowed'
                        return (
                          <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 border-t border-forge-border/40 hover:bg-forge-elevated/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <code className="text-xs font-mono text-amber-500 w-32 shrink-0">{t.name}</code>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${SENS_STYLE[t.sensitivity]}`}>
                                {t.sensitivity}
                              </span>
                              <span className="text-xs text-forge-subtle truncate">{t.description}</span>
                            </div>
                            <div className="flex items-center gap-6 shrink-0">
                              <div className="w-16 flex justify-center">
                                {decision === 'allowed' ? (
                                  <div className="flex items-center gap-1 text-emerald-500"><CheckCircle size={13} /><span className="text-[10px] font-semibold">allow</span></div>
                                ) : decision === 'blocked' ? (
                                  <div className="flex items-center gap-1 text-red-500"><XCircle size={13} /><span className="text-[10px] font-semibold">block</span></div>
                                ) : (
                                  <div className="flex items-center gap-1 text-amber-500"><Clock size={13} /><span className="text-[10px] font-semibold">review</span></div>
                                )}
                              </div>
                              <div className="w-12 flex justify-center">
                                <Toggle checked={needsApproval} onChange={() => !isBlocked && toggleApproval(t.id, needsApproval)} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
