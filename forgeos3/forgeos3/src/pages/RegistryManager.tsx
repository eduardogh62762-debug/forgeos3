import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Package, Shield, Layers, X, Check, AlertTriangle, Table2, AlertOctagon, TrendingUp } from 'lucide-react'
import type { DomainProfileConfig, ToolPack, PolicyPreset } from '../types/agent'
import { Spinner } from '../components/ui/Skeleton'
import api from '../lib/api'

const DOMAIN_STYLE: Record<string, { pill: string; icon: string }> = {
  healthtech: { pill: 'bg-blue-500/10 border-blue-500/20 text-blue-500', icon: 'text-blue-400' },
  agrotech:   { pill: 'bg-green-500/10 border-green-500/20 text-green-500', icon: 'text-green-400' },
  fintech:    { pill: 'bg-amber-400/10 border-amber-400/20 text-amber-500', icon: 'text-amber-400' },
  custom:     { pill: 'bg-forge-elevated border-forge-border text-forge-subtle', icon: 'text-forge-subtle' },
}

const SENS_STYLE: Record<string, string> = {
  critical: 'bg-red-500/10 border-red-500/20 text-red-500',
  high:     'bg-amber-400/10 border-amber-400/20 text-amber-500',
  medium:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
  low:      'bg-forge-elevated border-forge-border text-forge-subtle',
}

// Danger score map: used for sorting and bar width
const DANGER_SCORE: Record<string, number> = {
  critical: 100,
  high:     70,
  medium:   40,
  low:      10,
}

const DANGER_BAR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-amber-400',
  medium:   'bg-blue-400',
  low:      'bg-forge-subtle',
}

const DANGER_ICON: Record<string, string> = {
  critical: 'text-red-500',
  high:     'text-amber-400',
  medium:   'text-blue-400',
  low:      'text-forge-subtle',
}

const fade = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

type EditTarget =
  | { kind: 'domain'; item: DomainProfileConfig }
  | { kind: 'pack'; item: ToolPack }
  | { kind: 'policy'; item: PolicyPreset }
  | null

type SortKey = 'name' | 'sensitivity' | 'domain' | 'approval'
type SortDir = 'asc' | 'desc'

export function RegistryManager() {
  const [tab, setTab] = useState(0)
  const [domains, setDomains] = useState<DomainProfileConfig[]>([])
  const [packs, setPacks] = useState<ToolPack[]>([])
  const [policies, setPolicies] = useState<PolicyPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)

  // Registry table state
  const [regSearch, setRegSearch] = useState('')
  const [regFilter, setRegFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('sensitivity')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [domainsRes, packsRes, policiesRes] = await Promise.all([
        api.get<{ data: DomainProfileConfig[] }>('/api/domain-profiles'),
        api.get<{ data: ToolPack[] }>('/api/tool-packs'),
        api.get<{ data: PolicyPreset[] }>('/api/policy-presets'),
      ])
      setDomains(domainsRes.data.data ?? [])
      setPacks((packsRes.data.data ?? []).map(p => ({ ...p, tools: p.tools ?? [] })))
      setPolicies(policiesRes.data.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Flatten all tools from all packs for the registry table
  const allTools = packs.flatMap(pack =>
    (pack.tools ?? []).map(tool => ({
      ...tool,
      packName: pack.name,
      domain: pack.domain,
    }))
  )

  const filteredTools = allTools
    .filter(t => {
      const matchSearch = regSearch === '' ||
        t.name.toLowerCase().includes(regSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(regSearch.toLowerCase()) ||
        t.domain.toLowerCase().includes(regSearch.toLowerCase())
      const matchFilter = regFilter === 'all' || t.sensitivity === regFilter
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === 'sensitivity') {
        cmp = (DANGER_SCORE[b.sensitivity] ?? 0) - (DANGER_SCORE[a.sensitivity] ?? 0)
      } else if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortKey === 'domain') {
        cmp = a.domain.localeCompare(b.domain)
      } else if (sortKey === 'approval') {
        cmp = (b.requiresApproval ? 1 : 0) - (a.requiresApproval ? 1 : 0)
      }
      return sortDir === 'asc' ? -cmp : cmp
    })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const criticalCount = allTools.filter(t => t.sensitivity === 'critical').length
  const highCount     = allTools.filter(t => t.sensitivity === 'high').length
  const approvalCount = allTools.filter(t => t.requiresApproval).length

  const TABS = [
    { label: 'Domain Profiles', icon: Layers,       count: domains.length  },
    { label: 'Tool Packs',      icon: Package,      count: packs.length    },
    { label: 'Policy Presets',  icon: Shield,       count: policies.length },
    { label: 'Tool Registry',   icon: Table2,       count: allTools.length },
  ]

  const openEdit = (target: EditTarget) => {
    if (!target) return
    setEditTarget(target)
    setEditName(target.item.name)
    setEditDesc(target.item.description)
  }

  const saveEdit = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      if (editTarget.kind === 'domain') {
        await api.patch(`/api/domain-profiles/${editTarget.item.id}`, { name: editName, description: editDesc })
        setDomains(prev => prev.map(d => d.id === editTarget.item.id ? { ...d, name: editName, description: editDesc } : d))
      } else if (editTarget.kind === 'pack') {
        await api.patch(`/api/tool-packs/${editTarget.item.id}`, { name: editName, description: editDesc })
        setPacks(prev => prev.map(p => p.id === editTarget.item.id ? { ...p, name: editName, description: editDesc } : p))
      } else if (editTarget.kind === 'policy') {
        await api.patch(`/api/policy-presets/${editTarget.item.id}`, { name: editName, description: editDesc })
        setPolicies(prev => prev.map(p => p.id === editTarget.item.id ? { ...p, name: editName, description: editDesc } : p))
      }
      setEditTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-semibold text-forge-white">Registry</h1>
          <p className="text-xs text-forge-subtle mt-0.5">Reusable components for agent creation</p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <Spinner size="sm" />}
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-xl hover:bg-amber-300 transition-all"
            style={{ boxShadow: '0 0 14px rgba(245,158,11,0.2)' }}>
            <Plus size={12} /> New
          </button>
        </div>
      </div>

      <div className="px-8 py-6">
        {error && !loading && (
          <div className="flex items-center gap-3 p-4 mb-5 bg-forge-red/8 border border-forge-red/20 rounded-2xl">
            <AlertTriangle size={14} className="text-forge-red shrink-0" />
            <p className="text-xs text-forge-red flex-1">{error}</p>
            <button onClick={fetchAll} className="text-xs text-forge-red underline underline-offset-2 hover:opacity-80">Reintentar</button>
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-forge-surface border border-forge-border p-1 rounded-2xl w-fit">
          {TABS.map(({ label, icon: Icon, count }, i) => (
            <button key={label} onClick={() => setTab(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === i ? 'bg-amber-400 text-black' : 'text-forge-secondary hover:text-forge-primary'}`}>
              <Icon size={13} />
              {label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === i ? 'bg-black/15 text-black' : 'bg-forge-elevated text-forge-subtle'}`}>{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-5 bg-forge-surface border border-forge-border rounded-2xl space-y-3">
                <div className="animate-pulse bg-forge-elevated rounded h-4 w-32" />
                <div className="animate-pulse bg-forge-elevated rounded h-3 w-full" />
                <div className="animate-pulse bg-forge-elevated rounded h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {tab === 0 && (
              <motion.div key="domains" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                className="grid grid-cols-2 gap-4">
                {domains.map(d => {
                  const s = DOMAIN_STYLE[d.key] ?? DOMAIN_STYLE['custom']
                  return (
                    <motion.div key={d.id} variants={fade}
                      className="group p-5 bg-forge-surface border border-forge-border rounded-2xl hover:border-forge-line transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl bg-forge-elevated border border-forge-border flex items-center justify-center text-xl ${s.icon}`}>
                          {d.icon}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit({ kind: 'domain', item: d }) }}
                          className="p-1.5 text-forge-subtle hover:text-forge-primary rounded-lg hover:bg-forge-elevated transition-colors opacity-0 group-hover:opacity-100">
                          <Edit2 size={13} />
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-forge-white mb-1">{d.name}</h3>
                      <p className="text-xs text-forge-subtle leading-relaxed mb-4">{d.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${s.pill}`}>{d.key}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${d.riskMode === 'safe' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>
                          {d.riskMode} mode
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
                <motion.div variants={fade} onClick={() => setShowNewModal(true)}
                  className="p-5 bg-forge-surface border border-dashed border-forge-border rounded-2xl hover:border-forge-amber/40 hover:bg-forge-amber/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-forge-subtle hover:text-forge-amber min-h-40">
                  <Plus size={20} />
                  <span className="text-xs font-medium">New Domain Profile</span>
                </motion.div>
              </motion.div>
            )}

            {tab === 1 && (
              <motion.div key="packs" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-4">
                {packs.map(tp => {
                  const ds = DOMAIN_STYLE[tp.domain] ?? DOMAIN_STYLE['custom']
                  const tools = tp.tools ?? []
                  return (
                    <motion.div key={tp.id} variants={fade}
                      className="group p-5 bg-forge-surface border border-forge-border rounded-2xl hover:border-forge-line transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-bold text-forge-white">{tp.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${ds.pill}`}>{tp.domain}</span>
                          </div>
                          <p className="text-xs text-forge-subtle">{tp.description} · {tools.length} tools</p>
                        </div>
                        <button onClick={() => openEdit({ kind: 'pack', item: tp })}
                          className="p-1.5 text-forge-subtle hover:text-forge-primary rounded-lg hover:bg-forge-elevated transition-colors opacity-0 group-hover:opacity-100">
                          <Edit2 size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {tools.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-forge-elevated/60 border border-forge-border rounded-xl">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.sensitivity === 'critical' ? 'bg-red-500' : t.sensitivity === 'high' ? 'bg-amber-400' : 'bg-forge-subtle'}`} />
                              <code className="text-[11px] font-mono text-amber-500 truncate">{t.name}</code>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide shrink-0 ${SENS_STYLE[t.sensitivity] ?? SENS_STYLE['low']}`}>
                              {t.sensitivity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
                <motion.div variants={fade} onClick={() => setShowNewModal(true)}
                  className="p-5 bg-forge-surface border border-dashed border-forge-border rounded-2xl hover:border-forge-amber/40 hover:bg-forge-amber/5 transition-all cursor-pointer flex items-center justify-center gap-2 text-forge-subtle hover:text-forge-amber py-8">
                  <Plus size={16} />
                  <span className="text-xs font-medium">New Tool Pack</span>
                </motion.div>
              </motion.div>
            )}

            {tab === 2 && (
              <motion.div key="policies" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                className="space-y-3">
                {policies.map(p => (
                  <motion.div key={p.id} variants={fade}
                    className="group flex items-center gap-5 p-5 bg-forge-surface border border-forge-border rounded-2xl hover:border-forge-line transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-forge-white">{p.name}</h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wide ${p.level === 'strict' ? 'bg-red-500/10 border-red-500/20 text-red-500' : p.level === 'medium' ? 'bg-amber-400/10 border-amber-400/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                          {p.level}
                        </span>
                      </div>
                      <p className="text-xs text-forge-subtle">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-6 h-2 rounded-full transition-colors ${i <= (p.strictness ?? 0) ? 'bg-amber-400' : 'bg-forge-elevated'}`} />
                      ))}
                    </div>
                    <button onClick={() => openEdit({ kind: 'policy', item: p })}
                      className="p-1.5 text-forge-subtle hover:text-forge-primary rounded-lg hover:bg-forge-elevated transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <Edit2 size={13} />
                    </button>
                  </motion.div>
                ))}
                <motion.div variants={fade} onClick={() => setShowNewModal(true)}
                  className="p-5 bg-forge-surface border border-dashed border-forge-border rounded-2xl hover:border-forge-amber/40 hover:bg-forge-amber/5 transition-all cursor-pointer flex items-center justify-center gap-2 text-forge-subtle hover:text-forge-amber py-8">
                  <Plus size={16} />
                  <span className="text-xs font-medium">New Policy Preset</span>
                </motion.div>
              </motion.div>
            )}

            {/* ─── TAB 3: TOOL REGISTRY ─── */}
            {tab === 3 && (
              <motion.div key="registry" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className="space-y-5">

                {/* Summary KPI strip */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total Tools',      value: allTools.length, color: 'text-forge-white',   icon: Table2,         iconCls: 'text-forge-subtle'  },
                    { label: 'Critical',         value: criticalCount,   color: 'text-red-400',       icon: AlertOctagon,   iconCls: 'text-red-500'       },
                    { label: 'High Risk',        value: highCount,       color: 'text-amber-400',     icon: TrendingUp,     iconCls: 'text-amber-400'     },
                    { label: 'Require Approval', value: approvalCount,   color: 'text-blue-400',      icon: Shield,         iconCls: 'text-blue-400'      },
                  ].map(({ label, value, color, icon: Icon, iconCls }) => (
                    <div key={label} className="flex items-center gap-3 p-4 bg-forge-surface border border-forge-border rounded-2xl">
                      <div className="w-8 h-8 rounded-xl bg-forge-elevated border border-forge-border flex items-center justify-center shrink-0">
                        <Icon size={14} className={iconCls} />
                      </div>
                      <div>
                        <div className={`text-xl font-bold tracking-tight ${color}`}>{value}</div>
                        <div className="text-[10px] text-forge-subtle uppercase tracking-wide">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table container */}
                <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">

                  {/* Table toolbar */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-forge-border gap-4">
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <input
                        value={regSearch}
                        onChange={e => setRegSearch(e.target.value)}
                        placeholder="Search tools..."
                        className="flex-1 bg-forge-elevated border border-forge-border rounded-xl px-3 py-1.5 text-xs text-forge-white placeholder:text-forge-subtle outline-none focus:border-forge-amber/40 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
                        <button key={f} onClick={() => setRegFilter(f)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all ${
                            regFilter === f
                              ? f === 'all'      ? 'bg-forge-amber text-forge-bg border-forge-amber'
                              : f === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : f === 'high'     ? 'bg-amber-400/20 text-amber-400 border-amber-400/30'
                              : f === 'medium'   ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              :                   'bg-forge-elevated border-forge-border text-forge-subtle'
                              : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'
                          }`}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-forge-border/50 bg-forge-elevated/20">
                    {[
                      { label: 'Tool Name',    key: 'name' as SortKey,        span: 'col-span-3' },
                      { label: 'Description',  key: null,                      span: 'col-span-3' },
                      { label: 'Domain',       key: 'domain' as SortKey,      span: 'col-span-2' },
                      { label: 'Pack',         key: null,                      span: 'col-span-2' },
                      { label: 'Danger',       key: 'sensitivity' as SortKey, span: 'col-span-1' },
                      { label: 'Approval',     key: 'approval' as SortKey,    span: 'col-span-1' },
                    ].map(({ label, key, span }) => (
                      <button key={label}
                        onClick={() => key && toggleSort(key)}
                        className={`text-[9px] font-bold uppercase tracking-widest text-forge-subtle text-left flex items-center gap-1 ${span} ${key ? 'hover:text-forge-secondary transition-colors cursor-pointer' : 'cursor-default'}`}>
                        {label}
                        {key && sortKey === key && (
                          <span className="text-forge-amber">{sortDir === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-forge-border/30">
                    <AnimatePresence>
                      {filteredTools.length === 0 ? (
                        <div className="flex items-center justify-center py-12 text-forge-subtle text-sm">
                          No tools match this filter
                        </div>
                      ) : (
                        filteredTools.map((tool, i) => {
                          const dangerScore = DANGER_SCORE[tool.sensitivity] ?? 10
                          return (
                            <motion.div key={tool.id}
                              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.025, duration: 0.2 }}
                              className="grid grid-cols-12 gap-3 items-center px-5 py-3.5 hover:bg-forge-elevated/30 transition-colors group">

                              {/* Tool Name */}
                              <div className="col-span-3 flex items-center gap-2.5">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${DANGER_BAR[tool.sensitivity]}`} />
                                <code className="text-xs font-mono text-forge-amber truncate">{tool.name}</code>
                              </div>

                              {/* Description */}
                              <div className="col-span-3 text-[11px] text-forge-subtle truncate">
                                {tool.description || '—'}
                              </div>

                              {/* Domain */}
                              <div className="col-span-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold capitalize ${DOMAIN_STYLE[tool.domain]?.pill ?? 'bg-forge-elevated border-forge-border text-forge-subtle'}`}>
                                  {tool.domain}
                                </span>
                              </div>

                              {/* Pack */}
                              <div className="col-span-2 text-[11px] text-forge-subtle truncate">
                                {tool.packName}
                              </div>

                              {/* Danger level — badge + mini bar */}
                              <div className="col-span-1">
                                <div className="space-y-1">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide ${SENS_STYLE[tool.sensitivity] ?? SENS_STYLE['low']}`}>
                                    {tool.sensitivity}
                                  </span>
                                  <div className="h-1 bg-forge-elevated rounded-full overflow-hidden w-full">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${dangerScore}%` }}
                                      transition={{ delay: i * 0.025 + 0.2, duration: 0.4, ease: 'easeOut' }}
                                      className={`h-full rounded-full ${DANGER_BAR[tool.sensitivity]}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Requires Approval */}
                              <div className="col-span-1 flex items-center">
                                {tool.requiresApproval ? (
                                  <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border bg-amber-400/10 border-amber-400/20 text-amber-400 font-bold">
                                    <AlertOctagon size={8} /> Yes
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded border bg-forge-elevated border-forge-border text-forge-subtle font-semibold">
                                    No
                                  </span>
                                )}
                              </div>

                            </motion.div>
                          )
                        })
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer count */}
                  <div className="px-5 py-3 border-t border-forge-border/50 bg-forge-elevated/10 flex items-center justify-between">
                    <span className="text-[10px] text-forge-subtle">
                      Showing {filteredTools.length} of {allTools.length} tools
                    </span>
                    <div className="flex items-center gap-3">
                      {(['critical', 'high', 'medium', 'low'] as const).map(s => (
                        <div key={s} className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${DANGER_BAR[s]}`} />
                          <span className="text-[10px] text-forge-subtle capitalize">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-forge-surface border border-forge-border rounded-2xl shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-forge-border">
              <h2 className="text-base font-semibold text-forge-white">
                Edit {editTarget.kind === 'domain' ? 'Domain Profile' : editTarget.kind === 'pack' ? 'Tool Pack' : 'Policy Preset'}
              </h2>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="forge-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="forge-input resize-none" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditTarget(null)} className="flex-1 px-4 py-2 text-sm text-forge-secondary hover:text-forge-primary border border-forge-border rounded-xl hover:bg-forge-elevated transition-all">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 text-black text-sm font-bold rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50">
                  {saving ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Check size={13} />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowNewModal(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-forge-surface border border-forge-border rounded-2xl shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-forge-border">
              <h2 className="text-base font-semibold text-forge-white">
                Create New {tab === 0 ? 'Domain Profile' : tab === 1 ? 'Tool Pack' : 'Policy Preset'}
              </h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Name</label>
                <input className="forge-input" placeholder="Enter name..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-forge-secondary uppercase tracking-wide">Description</label>
                <textarea className="forge-input resize-none" rows={3} placeholder="Enter description..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-2 text-sm text-forge-secondary hover:text-forge-primary border border-forge-border rounded-xl hover:bg-forge-elevated transition-all">
                  Cancel
                </button>
                <button onClick={() => setShowNewModal(false)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-400 text-black text-sm font-bold rounded-xl hover:bg-amber-300 transition-all">
                  <Plus size={13} /> Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
