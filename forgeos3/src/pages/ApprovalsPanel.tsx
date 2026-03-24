import { useState, useEffect, useCallback } from 'react'
import {
  Clock, Check, X, AlertTriangle, Filter, RefreshCw,
  ChevronDown, Shield, Users, Activity,
  CheckSquare, Square, ShieldAlert, Bot
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SkeletonCard, ErrorBanner } from '../components/ui/Skeleton'
import { useRunStore } from '../store/runStore'
import api from '../lib/api'
import type { ApprovalRequest } from '../types/approval'

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

function waitingLabel(ms: number) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.round(s / 60)}m ${s % 60}s`
}

function riskScore(a: ApprovalRequest): 'critical' | 'high' | 'medium' | 'low' {
  const tool = (a.toolName ?? '').toLowerCase()
  if (tool.includes('delete') || tool.includes('drop') || tool.includes('payment') || tool.includes('transfer')) return 'critical'
  if (tool.includes('write') || tool.includes('exec') || tool.includes('deploy')) return 'high'
  if (tool.includes('update') || tool.includes('send') || tool.includes('post')) return 'medium'
  return 'low'
}

const RISK_META = {
  critical: { label: 'Crítico', color: 'text-forge-red',    bg: 'bg-forge-red/10 border-forge-red/25',      dot: 'bg-forge-red' },
  high:     { label: 'Alto',    color: 'text-orange-400',   bg: 'bg-orange-500/10 border-orange-500/25',    dot: 'bg-orange-400' },
  medium:   { label: 'Medio',   color: 'text-forge-amber',  bg: 'bg-forge-amber/10 border-forge-amber/25',  dot: 'bg-forge-amber' },
  low:      { label: 'Bajo',    color: 'text-forge-green',  bg: 'bg-forge-green/10 border-forge-green/25',  dot: 'bg-forge-green' },
}

const DOMAIN_META: Record<string, { label: string; color: string }> = {
  healthtech: { label: 'Salud',    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  agrotech:   { label: 'Agro',     color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  fintech:    { label: 'Finanzas', color: 'bg-amber-400/10 text-amber-500 border-amber-400/20' },
  gobierno:   { label: 'Gobierno', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
}

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: typeof Shield; label: string; value: number | string; sub?: string; accent?: string
}) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ?? 'bg-forge-elevated'}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-forge-white">{value}</div>
        <div className="text-xs text-forge-subtle">{label}</div>
        {sub && <div className="text-[10px] text-forge-subtle/70 mt-0.5">{sub}</div>}
      </div>
    </Card>
  )
}

function WaitingTimer({ ms }: { ms: number }) {
  const [elapsed, setElapsed] = useState(ms)
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1000), 1000)
    return () => clearInterval(t)
  }, [])
  const urgent = elapsed > 120000
  return (
    <span className={`flex items-center gap-1 text-xs font-mono tabular-nums ${urgent ? 'text-forge-red animate-pulse' : 'text-forge-amber'}`}>
      <Clock size={10} />
      {waitingLabel(elapsed)}
      {urgent && <AlertTriangle size={10} />}
    </span>
  )
}

function RiskBadge({ level }: { level: ReturnType<typeof riskScore> }) {
  const m = RISK_META[level]
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.bg} ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

type FilterDomain = 'all' | string
type FilterRisk   = 'all' | 'critical' | 'high' | 'medium' | 'low'
type SortKey      = 'time' | 'risk' | 'agent'

export function ApprovalsPanel() {
  const { approvals, resolveApproval, loadingApprovals, error, fetchApprovals } = useRunStore()
  const [modal, setModal] = useState<{ approval: ApprovalRequest; action: 'approved' | 'rejected' } | null>(null)
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'approved' | 'rejected' | null>(null)
  const [bulkResolving, setBulkResolving] = useState(false)
  const [filterDomain, setFilterDomain] = useState<FilterDomain>('all')
  const [filterRisk, setFilterRisk]     = useState<FilterRisk>('all')
  const [sortKey, setSortKey]           = useState<SortKey>('time')
  const [showFilters, setShowFilters]   = useState(false)

  useEffect(() => {
    fetchApprovals()
    const t = setInterval(() => { fetchApprovals() }, 8000)
    return () => clearInterval(t)
  }, [fetchApprovals])

  const pending  = approvals.filter(a => a.status === 'pending')
  const resolved = approvals.filter(a => a.status !== 'pending').slice(0, 20)

  const criticalCount = pending.filter(a => riskScore(a) === 'critical').length
  const agentCount    = new Set(pending.map(a => a.agentId)).size
  const avgWait       = pending.length
    ? Math.round(pending.reduce((s, a) => s + (a.waitingMs || 0), 0) / pending.length / 1000)
    : 0

  const domains = [...new Set(pending.map(a => a.domain))]

  const filtered = pending
    .filter(a => filterDomain === 'all' || a.domain === filterDomain)
    .filter(a => filterRisk   === 'all' || riskScore(a) === filterRisk)
    .sort((a, b) => {
      if (sortKey === 'risk') {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[riskScore(a)] - order[riskScore(b)]
      }
      if (sortKey === 'agent') return a.agentName.localeCompare(b.agentName)
      return (b.waitingMs || 0) - (a.waitingMs || 0)
    })

  const toggleSelect = (id: string) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => setSelected(s =>
    s.size === filtered.length ? new Set() : new Set(filtered.map(a => a.id))
  )
  const allSelected = filtered.length > 0 && selected.size === filtered.length

  const confirm = async () => {
    if (!modal) return
    setResolving(true)
    try {
      await api.post(`/api/approvals/${modal.approval.id}/resolve`, { decision: modal.action })
      resolveApproval(modal.approval.id, modal.action)
      fetchApprovals()
    } catch {
      resolveApproval(modal.approval.id, modal.action)
    } finally {
      setResolving(false)
      setModal(null)
    }
  }

  const confirmBulk = useCallback(async () => {
    if (!bulkAction || selected.size === 0) return
    setBulkResolving(true)
    const ids = [...selected]
    await Promise.allSettled(
      ids.map(id => api.post(`/api/approvals/${id}/resolve`, { decision: bulkAction }).catch(() => null))
    )
    ids.forEach(id => resolveApproval(id, bulkAction))
    setSelected(new Set())
    setBulkAction(null)
    setBulkResolving(false)
    fetchApprovals()
  }, [bulkAction, selected, resolveApproval, fetchApprovals])

  return (
    <div className="min-h-screen">
      <TopBar
        title="Centro de Aprobaciones"
        subtitle="Cola centralizada de peticiones pendientes de todos los agentes"
        actions={
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-forge-amber/10 border border-forge-amber/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-forge-amber animate-pulse" />
                <span className="text-xs text-forge-amber font-semibold">{pending.length} pendientes</span>
              </div>
            )}
            <button
              onClick={() => fetchApprovals()}
              className="p-2 rounded-xl text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-all"
            >
              <RefreshCw size={14} className={loadingApprovals ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="px-8 py-6 space-y-5 animate-fade-in">
        {error && <ErrorBanner message={error} onRetry={fetchApprovals} />}

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={CheckSquare} label="Pendientes"      value={pending.length}     sub="en cola ahora"               accent="bg-forge-amber" />
          <StatCard icon={ShieldAlert} label="Críticas"        value={criticalCount}      sub="requieren atención inmediata" accent={criticalCount > 0 ? 'bg-forge-red' : 'bg-forge-elevated'} />
          <StatCard icon={Bot}         label="Agentes activos" value={agentCount}          sub="solicitando permisos"        accent="bg-blue-600" />
          <StatCard icon={Activity}    label="Espera promedio" value={`${avgWait}s`}       sub="tiempo en cola"              accent="bg-forge-elevated" />
        </div>

        {/* QUEUE */}
        <section>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold text-forge-subtle uppercase tracking-wider">Cola de Revisión</h2>
              {pending.length > 0 && (
                <span className="text-[10px] bg-forge-amber/15 text-forge-amber border border-forge-amber/20 px-2 py-0.5 rounded-full font-semibold">
                  {filtered.length} {filterDomain !== 'all' || filterRisk !== 'all' ? 'filtradas' : 'peticiones'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={e => setSortKey(e.target.value as SortKey)}
                  className="appearance-none text-xs bg-forge-elevated border border-forge-border text-forge-secondary rounded-lg pl-3 pr-7 py-1.5 cursor-pointer focus:outline-none focus:border-forge-amber/50"
                >
                  <option value="time">↓ Más tiempo esperando</option>
                  <option value="risk">↓ Mayor riesgo</option>
                  <option value="agent">↓ Por agente</option>
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-forge-subtle pointer-events-none" />
              </div>
              <button
                onClick={() => setShowFilters(s => !s)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${showFilters ? 'bg-forge-amber/10 border-forge-amber/30 text-forge-amber' : 'bg-forge-elevated border-forge-border text-forge-secondary hover:text-forge-primary'}`}
              >
                <Filter size={11} /> Filtros
                {(filterDomain !== 'all' || filterRisk !== 'all') && (
                  <span className="w-1.5 h-1.5 rounded-full bg-forge-amber ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-3 p-3 bg-forge-surface border border-forge-border rounded-xl">
              <span className="text-[10px] text-forge-subtle uppercase tracking-wider font-semibold mr-1">Dominio:</span>
              {(['all', ...domains] as string[]).map(d => (
                <button key={d} onClick={() => setFilterDomain(d)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${filterDomain === d ? 'bg-forge-amber/15 border-forge-amber/30 text-forge-amber font-semibold' : 'bg-forge-elevated border-forge-border text-forge-secondary hover:text-forge-primary'}`}>
                  {d === 'all' ? 'Todos' : (DOMAIN_META[d]?.label ?? d)}
                </button>
              ))}
              <span className="text-[10px] text-forge-subtle uppercase tracking-wider font-semibold mx-1">Riesgo:</span>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(r => (
                <button key={r} onClick={() => setFilterRisk(r)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${filterRisk === r ? 'bg-forge-amber/15 border-forge-amber/30 text-forge-amber font-semibold' : 'bg-forge-elevated border-forge-border text-forge-secondary hover:text-forge-primary'}`}>
                  {r === 'all' ? 'Todos' : RISK_META[r].label}
                </button>
              ))}
              {(filterDomain !== 'all' || filterRisk !== 'all') && (
                <button onClick={() => { setFilterDomain('all'); setFilterRisk('all') }}
                  className="text-xs text-forge-subtle hover:text-forge-red transition-colors ml-1">
                  × Limpiar
                </button>
              )}
            </div>
          )}

          {selected.size > 0 && (
            <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-forge-surface border border-forge-amber/20 rounded-xl">
              <span className="text-xs font-semibold text-forge-amber">{selected.size} seleccionadas</span>
              <div className="flex-1" />
              <Button variant="danger" size="sm" onClick={() => setBulkAction('rejected')}>
                <X size={11} /> Rechazar todas
              </Button>
              <Button variant="success" size="sm" onClick={() => setBulkAction('approved')}>
                <Check size={11} /> Aprobar todas
              </Button>
            </div>
          )}

          {loadingApprovals && pending.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-forge-elevated flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-forge-green" />
              </div>
              <p className="text-sm font-medium text-forge-primary mb-1">Cola vacía</p>
              <p className="text-xs text-forge-subtle">
                {filterDomain !== 'all' || filterRisk !== 'all'
                  ? 'Sin resultados con los filtros actuales.'
                  : 'No hay peticiones pendientes de aprobación.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-forge-subtle hover:text-forge-primary transition-colors">
                  {allSelected ? <CheckSquare size={13} className="text-forge-amber" /> : <Square size={13} />}
                  Seleccionar todo ({filtered.length})
                </button>
              </div>

              {filtered.map(a => {
                const risk = riskScore(a)
                const dm   = DOMAIN_META[a.domain]
                const isSelected = selected.has(a.id)
                const isCritical = risk === 'critical'

                return (
                  <Card key={a.id} amber={isCritical}
                    className={`p-5 transition-all ${isSelected ? 'ring-1 ring-forge-amber/40' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => toggleSelect(a.id)} className="mt-0.5 shrink-0">
                        {isSelected
                          ? <CheckSquare size={14} className="text-forge-amber" />
                          : <Square size={14} className="text-forge-subtle hover:text-forge-primary transition-colors" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <div className="flex items-center gap-1.5">
                                <Bot size={12} className="text-forge-subtle" />
                                <span className="text-sm font-semibold text-forge-white">{a.agentName}</span>
                              </div>
                              <span className="text-forge-subtle text-xs">quiere ejecutar</span>
                              <code className="text-sm font-mono text-forge-amber font-bold bg-forge-amber/5 border border-forge-amber/15 px-2 py-0.5 rounded-md">
                                {a.toolName}
                              </code>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {dm && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize font-medium ${dm.color}`}>
                                  {dm.label}
                                </span>
                              )}
                              <RiskBadge level={risk} />
                              <WaitingTimer ms={a.waitingMs || 0} />
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button variant="danger" size="sm" onClick={() => setModal({ approval: a, action: 'rejected' })}>
                              <X size={12} /> Rechazar
                            </Button>
                            <Button variant="success" size="sm" onClick={() => setModal({ approval: a, action: 'approved' })}>
                              <Check size={12} /> Aprobar
                            </Button>
                          </div>
                        </div>

                        <div className="p-3 bg-forge-bg/50 border border-forge-border rounded-xl mb-2.5">
                          <div className="text-[10px] text-forge-subtle mb-1 font-semibold uppercase tracking-wide">Motivo</div>
                          <p className="text-xs text-forge-secondary leading-relaxed">{a.reason}</p>
                        </div>

                        <div>
                          <div className="text-[10px] text-forge-subtle mb-1 font-semibold uppercase tracking-wide">Payload</div>
                          <pre className="text-[10px] font-mono text-forge-secondary bg-forge-bg/50 border border-forge-border rounded-xl p-3 overflow-x-auto max-h-28 leading-relaxed">
                            {JSON.stringify(a.payload, null, 2)}
                          </pre>
                        </div>

                        {isCritical && (
                          <div className="mt-2.5 flex items-center gap-2 p-2.5 bg-forge-red/5 border border-forge-red/20 rounded-xl">
                            <AlertTriangle size={12} className="text-forge-red shrink-0" />
                            <p className="text-[11px] text-forge-red">
                              Acción de <strong>riesgo crítico</strong>. Verificar payload antes de aprobar.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* RESOLVED LOG */}
        <section>
          <h2 className="text-xs font-semibold text-forge-subtle uppercase tracking-wider mb-3">
            Historial Reciente
            {resolved.length > 0 && <span className="ml-2 text-forge-muted">({resolved.length})</span>}
          </h2>
          <Card className="overflow-hidden divide-y divide-forge-border">
            {loadingApprovals && resolved.length === 0 ? (
              [0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="animate-pulse bg-forge-elevated rounded-full w-6 h-6 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="animate-pulse bg-forge-elevated rounded h-3 w-40" />
                    <div className="animate-pulse bg-forge-elevated rounded h-2 w-28" />
                  </div>
                  <div className="animate-pulse bg-forge-elevated rounded-full h-5 w-16" />
                </div>
              ))
            ) : resolved.length === 0 ? (
              <div className="px-5 py-8 text-center text-forge-subtle text-sm">Sin historial aún</div>
            ) : (
              resolved.map(a => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-forge-elevated/50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${a.status === 'approved' ? 'bg-forge-green/10' : 'bg-forge-red/10'}`}>
                    {a.status === 'approved' ? <Check size={11} className="text-forge-green" /> : <X size={11} className="text-forge-red" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-forge-primary font-medium">{a.agentName}</span>
                      <span className="text-forge-subtle text-xs">→</span>
                      <code className="text-xs text-forge-amber font-mono">{a.toolName}</code>
                      {DOMAIN_META[a.domain] && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${DOMAIN_META[a.domain].color}`}>
                          {DOMAIN_META[a.domain].label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-forge-subtle mt-0.5">
                      por <span className="text-forge-secondary">{a.reviewedBy ?? 'admin'}</span>
                      {a.reviewedAt ? ` · ${timeAgo(a.reviewedAt)}` : ''}
                    </div>
                  </div>
                  <Badge variant={a.status === 'approved' ? 'allowed' : 'blocked'} size="sm">
                    {a.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                  </Badge>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      {/* SINGLE MODAL */}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.action === 'approved' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}>
        {modal && (
          <div className="space-y-4">
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${modal.action === 'approved' ? 'bg-forge-green/5 border-forge-green/20' : 'bg-forge-red/5 border-forge-red/20'}`}>
              <AlertTriangle size={15} className={`${modal.action === 'approved' ? 'text-forge-green' : 'text-forge-red'} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-forge-primary mb-1">
                  {modal.action === 'approved' ? 'Aprobando' : 'Rechazando'}{' '}
                  <code className="text-forge-amber">{modal.approval.toolName}</code>{' '}
                  para <span className="text-forge-white">{modal.approval.agentName}</span>
                </p>
                <p className="text-xs text-forge-subtle">{modal.approval.reason}</p>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-forge-subtle font-semibold uppercase tracking-wide mb-1.5">Payload</div>
              <pre className="text-[11px] font-mono text-forge-secondary bg-forge-elevated border border-forge-border rounded-xl p-4 overflow-x-auto max-h-48">
                {JSON.stringify(modal.approval.payload, null, 2)}
              </pre>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant={modal.action === 'approved' ? 'success' : 'danger'} className="flex-1" loading={resolving} onClick={confirm}>
                {modal.action === 'approved' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* BULK MODAL */}
      <Modal open={!!bulkAction} onClose={() => setBulkAction(null)}
        title={bulkAction === 'approved' ? `Aprobar ${selected.size} peticiones` : `Rechazar ${selected.size} peticiones`}>
        <div className="space-y-4">
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${bulkAction === 'approved' ? 'bg-forge-green/5 border-forge-green/20' : 'bg-forge-red/5 border-forge-red/20'}`}>
            <Users size={15} className={`${bulkAction === 'approved' ? 'text-forge-green' : 'text-forge-red'} mt-0.5`} />
            <div>
              <p className="text-sm font-semibold text-forge-primary mb-1">
                Acción masiva: {bulkAction === 'approved' ? 'aprobación' : 'rechazo'} de {selected.size} peticiones
              </p>
              <p className="text-xs text-forge-subtle">
                Esta acción se aplicará a todas las peticiones seleccionadas simultáneamente.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setBulkAction(null)}>Cancelar</Button>
            <Button variant={bulkAction === 'approved' ? 'success' : 'danger'} className="flex-1" loading={bulkResolving} onClick={confirmBulk}>
              {bulkAction === 'approved' ? `Aprobar ${selected.size}` : `Rechazar ${selected.size}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
