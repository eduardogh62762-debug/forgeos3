import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box, Clock, Wifi, WifiOff, Key, ScrollText,
  Zap, AlertTriangle, CheckCircle, XCircle, Play, Square,
  ChevronDown, ChevronUp, Lock
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Toggle } from '../components/ui/Toggle'
import { Modal } from '../components/ui/Modal'
import { useRunStore } from '../store/runStore'

type SandboxStatus = 'idle' | 'running' | 'killed' | 'timeout'

interface SandboxConfig {
  timeoutMs: number
  maxMemoryMb: number
  maxCpuPct: number
  networkMode: 'none' | 'allowlist'
  allowedHosts: string[]
  secretScoping: boolean
  killOnTimeout: boolean
}

interface SandboxLog {
  id: string
  ts: string
  level: 'info' | 'warn' | 'error'
  message: string
}

const DEFAULT_CONFIG: SandboxConfig = {
  timeoutMs: 5000,
  maxMemoryMb: 256,
  maxCpuPct: 50,
  networkMode: 'none',
  allowedHosts: ['api.internal.forge', 'db.internal.forge'],
  secretScoping: true,
  killOnTimeout: true,
}

const MOCK_LOGS: SandboxLog[] = [
  { id: 'l1', ts: new Date(Date.now() - 12000).toISOString(), level: 'info',  message: 'Sandbox initialized · runtime openclaw_v1' },
  { id: 'l2', ts: new Date(Date.now() - 11000).toISOString(), level: 'info',  message: 'Tool intent received: summarize' },
  { id: 'l3', ts: new Date(Date.now() - 10500).toISOString(), level: 'info',  message: 'Network check: allowlist enforced · 0 external calls blocked' },
  { id: 'l4', ts: new Date(Date.now() - 9800).toISOString(),  level: 'info',  message: 'Secret scoping active · 2 secrets injected (masked)' },
  { id: 'l5', ts: new Date(Date.now() - 8000).toISOString(),  level: 'info',  message: 'Tool executed in 1240ms · within timeout (5000ms)' },
  { id: 'l6', ts: new Date(Date.now() - 5000).toISOString(),  level: 'warn',  message: 'Tool intent received: write_external' },
  { id: 'l7', ts: new Date(Date.now() - 4800).toISOString(),  level: 'warn',  message: 'Network request attempted: external-api.gov — BLOCKED by allowlist' },
  { id: 'l8', ts: new Date(Date.now() - 4500).toISOString(),  level: 'error', message: 'Tool blocked: write_external · network policy violation' },
  { id: 'l9', ts: new Date(Date.now() - 2000).toISOString(),  level: 'info',  message: 'Memory usage: 48mb / 256mb limit · CPU: 12% / 50% limit' },
]

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`
  return `${Math.round(diff / 3600000)}h ago`
}

const LOG_STYLE = {
  info:  { cls: 'text-forge-secondary', dot: 'bg-blue-400',       label: 'INFO'  },
  warn:  { cls: 'text-forge-amber',     dot: 'bg-forge-amber',    label: 'WARN'  },
  error: { cls: 'text-forge-red',       dot: 'bg-forge-red',      label: 'ERROR' },
}

export function SandboxLayer() {
  const { runs } = useRunStore()
  const [config, setConfig]         = useState<SandboxConfig>(DEFAULT_CONFIG)
  const [status, setStatus]         = useState<SandboxStatus>('idle')
  const [logs, setLogs]             = useState<SandboxLog[]>(MOCK_LOGS)
  const [logsOpen, setLogsOpen]     = useState(true)
  const [killModal, setKillModal]   = useState(false)
  const [hostInput, setHostInput]   = useState('')

  const activeRun = runs.find(r => r.status === 'running' || r.status === 'waiting_approval')

  const startSandbox = () => {
    setStatus('running')
    setLogs(prev => [...prev, {
      id: `l-${Date.now()}`,
      ts: new Date().toISOString(),
      level: 'info',
      message: `Sandbox started · timeout ${config.timeoutMs}ms · memory limit ${config.maxMemoryMb}mb`,
    }])
  }

  const killSandbox = () => {
    setStatus('killed')
    setKillModal(false)
    setLogs(prev => [...prev, {
      id: `l-${Date.now()}`,
      ts: new Date().toISOString(),
      level: 'error',
      message: 'Sandbox killed by operator · all tool execution halted',
    }])
  }

  const addHost = () => {
    if (hostInput.trim() && !config.allowedHosts.includes(hostInput.trim())) {
      setConfig(c => ({ ...c, allowedHosts: [...c.allowedHosts, hostInput.trim()] }))
      setHostInput('')
    }
  }

  const removeHost = (h: string) =>
    setConfig(c => ({ ...c, allowedHosts: c.allowedHosts.filter(x => x !== h) }))

  return (
    <div className="min-h-screen">
      <TopBar
        title="Secure Sandbox"
        subtitle="Isolated execution environment — timeouts, resource limits, network control"
        actions={
          <div className="flex items-center gap-2">
            {/* Status pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
              status === 'running' ? 'bg-forge-green/10 border-forge-green/20 text-forge-green'  :
              status === 'killed'  ? 'bg-forge-red/10 border-forge-red/20 text-forge-red'        :
              status === 'timeout' ? 'bg-forge-amber/10 border-forge-amber/20 text-forge-amber'  :
              'bg-forge-elevated border-forge-border text-forge-subtle'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'running' ? 'bg-forge-green animate-pulse' :
                status === 'killed'  ? 'bg-forge-red'   :
                status === 'timeout' ? 'bg-forge-amber' : 'bg-forge-subtle'
              }`} />
              {status === 'idle' ? 'Sandbox idle' : status === 'running' ? 'Sandbox active' : status === 'killed' ? 'Killed' : 'Timed out'}
            </div>

            {status === 'idle' && (
              <Button variant="success" size="sm" onClick={startSandbox}>
                <Play size={11} /> Start
              </Button>
            )}
            {status === 'running' && (
              <Button variant="danger" size="sm" onClick={() => setKillModal(true)}>
                <Square size={11} /> Kill
              </Button>
            )}
          </div>
        }
      />

      <div className="px-8 py-6 space-y-6">

        {/* Architecture overview */}
        <div className="p-5 bg-forge-surface border border-forge-border rounded-2xl">
          <div className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-4">Sandbox Architecture</div>
          <div className="grid grid-cols-6 gap-3">
            {[
              { icon: Box,        label: 'Isolated Container', sub: 'per tool execution',   color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
              { icon: Clock,      label: 'Timeout Enforcer',   sub: `${config.timeoutMs}ms limit`,  color: 'text-amber-500',  bg: 'bg-amber-500/10'  },
              { icon: Zap,        label: 'Resource Limits',    sub: `${config.maxMemoryMb}mb · ${config.maxCpuPct}% CPU`, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { icon: config.networkMode === 'none' ? WifiOff : Wifi, label: 'Network Control', sub: config.networkMode === 'none' ? 'fully isolated' : 'allowlist only', color: 'text-forge-green', bg: 'bg-forge-green/10' },
              { icon: Key,        label: 'Secret Scoping',     sub: config.secretScoping ? 'active' : 'disabled',     color: 'text-forge-amber', bg: 'bg-forge-amber/10' },
              { icon: ScrollText, label: 'Audit Logs',         sub: `${logs.length} events`,         color: 'text-forge-primary', bg: 'bg-forge-elevated' },
            ].map(({ icon: Icon, label, sub, color, bg }) => (
              <div key={label} className={`flex flex-col items-center gap-2 p-4 ${bg} border border-forge-border rounded-2xl text-center`}>
                <Icon size={18} className={color} />
                <div>
                  <div className="text-[11px] font-semibold text-forge-white">{label}</div>
                  <div className="text-[10px] text-forge-subtle mt-0.5">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* Left: config panel */}
          <div className="col-span-1 space-y-4">

            {/* Timeouts & Resources */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-forge-border bg-forge-elevated/20">
                <Clock size={13} className="text-amber-500" />
                <span className="text-sm font-semibold text-forge-white">Timeouts & Resources</span>
              </div>
              <div className="p-5 space-y-5">
                {[
                  { label: 'Timeout',     key: 'timeoutMs',   value: config.timeoutMs,   unit: 'ms',  min: 1000,  max: 30000, step: 500  },
                  { label: 'Max Memory',  key: 'maxMemoryMb', value: config.maxMemoryMb, unit: 'mb',  min: 64,    max: 1024,  step: 64   },
                  { label: 'Max CPU',     key: 'maxCpuPct',   value: config.maxCpuPct,   unit: '%',   min: 10,    max: 100,   step: 10   },
                ].map(({ label, key, value, unit, min, max, step }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-forge-secondary">{label}</span>
                      <span className="text-xs font-bold text-forge-amber">{value}{unit}</span>
                    </div>
                    <input type="range" min={min} max={max} step={step} value={value}
                      onChange={e => setConfig(c => ({ ...c, [key]: Number(e.target.value) }))}
                      className="w-full accent-amber-400 h-1.5 rounded-full bg-forge-elevated cursor-pointer" />
                    <div className="flex justify-between mt-1 text-[9px] text-forge-subtle/50">
                      <span>{min}{unit}</span><span>{max}{unit}</span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs text-forge-secondary">Kill on timeout</div>
                    <div className="text-[10px] text-forge-subtle">Auto-terminate when limit reached</div>
                  </div>
                  <Toggle checked={config.killOnTimeout} onChange={v => setConfig(c => ({ ...c, killOnTimeout: v }))} />
                </div>
              </div>
            </Card>

            {/* Network */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-forge-border bg-forge-elevated/20">
                <Wifi size={13} className="text-amber-500" />
                <span className="text-sm font-semibold text-forge-white">Network Control</span>
              </div>
              <div className="p-5 space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(['none', 'allowlist'] as const).map(mode => (
                    <button key={mode} onClick={() => setConfig(c => ({ ...c, networkMode: mode }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        config.networkMode === mode
                          ? mode === 'none'
                            ? 'bg-forge-red/10 border-forge-red/20 text-forge-red'
                            : 'bg-forge-green/10 border-forge-green/20 text-forge-green'
                          : 'bg-forge-elevated border-forge-border text-forge-subtle hover:border-forge-line'
                      }`}>
                      {mode === 'none' ? <WifiOff size={11} /> : <Wifi size={11} />}
                      {mode === 'none' ? 'Isolated' : 'Allowlist'}
                    </button>
                  ))}
                </div>

                {/* Allowlist */}
                {config.networkMode === 'allowlist' && (
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-forge-subtle">Allowed Hosts</div>
                    {config.allowedHosts.map(h => (
                      <div key={h} className="flex items-center gap-2 px-3 py-2 bg-forge-elevated border border-forge-border rounded-xl">
                        <code className="text-[11px] text-forge-green flex-1 font-mono">{h}</code>
                        <button onClick={() => removeHost(h)} className="text-forge-subtle hover:text-forge-red transition-colors">
                          <XCircle size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={hostInput}
                        onChange={e => setHostInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addHost()}
                        placeholder="api.example.com"
                        className="forge-input text-[11px] py-1.5 flex-1" />
                      <button onClick={addHost}
                        className="px-3 py-1.5 bg-forge-elevated border border-forge-border rounded-lg text-forge-subtle hover:text-forge-primary text-xs transition-colors">
                        Add
                      </button>
                    </div>
                  </div>
                )}
                {config.networkMode === 'none' && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-forge-red/5 border border-forge-red/15 rounded-xl">
                    <WifiOff size={12} className="text-forge-red shrink-0" />
                    <span className="text-[11px] text-forge-red">All network access blocked</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Secret scoping */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-forge-border bg-forge-elevated/20">
                <Key size={13} className="text-amber-500" />
                <span className="text-sm font-semibold text-forge-white">Secret Scoping</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-forge-secondary">Enable secret scoping</div>
                    <div className="text-[10px] text-forge-subtle">Only inject secrets required by tool</div>
                  </div>
                  <Toggle checked={config.secretScoping} onChange={v => setConfig(c => ({ ...c, secretScoping: v }))} />
                </div>
                {config.secretScoping && (
                  <div className="space-y-1.5 pt-1">
                    {[
                      { name: 'DB_CONNECTION',  scope: 'db tools only'      },
                      { name: 'API_KEY_HEALTH', scope: 'health domain only' },
                      { name: 'API_KEY_GOV',    scope: 'gov domain only'    },
                    ].map(s => (
                      <div key={s.name} className="flex items-center justify-between px-3 py-2 bg-forge-elevated/50 border border-forge-border rounded-xl">
                        <div className="flex items-center gap-2">
                          <Lock size={10} className="text-forge-amber" />
                          <code className="text-[10px] font-mono text-forge-primary">{s.name}</code>
                        </div>
                        <span className="text-[9px] text-forge-subtle">{s.scope}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: live monitor + logs */}
          <div className="col-span-2 space-y-4">

            {/* Live resource monitor */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-forge-border bg-forge-elevated/20">
                <Zap size={13} className="text-amber-500" />
                <span className="text-sm font-semibold text-forge-white">Resource Monitor</span>
                {status === 'running' && (
                  <span className="ml-auto text-[10px] text-forge-green flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-pulse" /> live
                  </span>
                )}
              </div>
              <div className="p-5 grid grid-cols-3 gap-4">
                {[
                  {
                    label: 'Memory',   used: Math.round(config.maxMemoryMb * 0.07),  max: config.maxMemoryMb, unit: 'mb',
                    color: 'bg-blue-500', warn: 80,
                  },
                  {
                    label: 'CPU',      used: Math.round(config.maxCpuPct   * 0.08),  max: config.maxCpuPct,   unit: '%',
                    color: 'bg-purple-500', warn: 80,
                  },
                  {
                    label: 'Timeout',  used: Math.round(config.timeoutMs   * 0.064), max: config.timeoutMs,   unit: 'ms',
                    color: 'bg-amber-400', warn: 70,
                  },
                ].map(({ label, used, max, unit, color, warn }) => {
                  const pct = Math.round((used / max) * 100)
                  const isWarn = pct >= warn
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-forge-secondary">{label}</span>
                        <span className={`text-xs font-bold ${isWarn ? 'text-forge-red' : 'text-forge-primary'}`}>
                          {used}{unit} / {max}{unit}
                        </span>
                      </div>
                      <div className="h-2 bg-forge-elevated rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${isWarn ? 'bg-forge-red' : color}`}
                        />
                      </div>
                      <div className="text-[9px] text-forge-subtle mt-1">{pct}% utilized</div>
                    </div>
                  )
                })}
              </div>

              {/* Active run context */}
              {activeRun && (
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-3 p-3 bg-forge-elevated/50 border border-forge-border rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-forge-amber animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-forge-white">{activeRun.agentName}</span>
                      <span className="text-forge-subtle text-xs mx-2">·</span>
                      <span className="text-xs text-forge-subtle capitalize">{activeRun.domain}</span>
                    </div>
                    <Badge variant="approval" size="sm">{activeRun.status.replace('_', ' ')}</Badge>
                  </div>
                </div>
              )}
            </Card>

            {/* Sandbox logs */}
            <Card className="overflow-hidden">
              <button
                onClick={() => setLogsOpen(p => !p)}
                className="w-full flex items-center justify-between px-5 py-3.5 border-b border-forge-border bg-forge-elevated/20 hover:bg-forge-elevated/40 transition-colors">
                <div className="flex items-center gap-2">
                  <ScrollText size={13} className="text-amber-500" />
                  <span className="text-sm font-semibold text-forge-white">Sandbox Logs</span>
                  <span className="text-[10px] px-2 py-0.5 bg-forge-elevated border border-forge-border rounded-full text-forge-subtle">
                    {logs.length} events
                  </span>
                </div>
                {logsOpen ? <ChevronUp size={13} className="text-forge-subtle" /> : <ChevronDown size={13} className="text-forge-subtle" />}
              </button>

              <AnimatePresence>
                {logsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="divide-y divide-forge-border/30 max-h-80 overflow-y-auto">
                      {[...logs].reverse().map(log => {
                        const s = LOG_STYLE[log.level]
                        return (
                          <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-forge-elevated/20 transition-colors">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[10px] font-bold mr-2 ${s.cls}`}>{s.label}</span>
                              <span className="text-[11px] text-forge-secondary font-mono">{log.message}</span>
                            </div>
                            <span className="text-[9px] text-forge-subtle shrink-0">{timeAgo(log.ts)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Status banners */}
            {status === 'killed' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-forge-red/8 border border-forge-red/20 rounded-2xl">
                <XCircle size={15} className="text-forge-red mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-forge-primary mb-0.5">Sandbox terminated</p>
                  <p className="text-xs text-forge-subtle">All tool execution halted. Event logged to audit trail. Restart to resume.</p>
                </div>
                <Button variant="secondary" size="sm" className="ml-auto shrink-0" onClick={() => setStatus('idle')}>
                  Reset
                </Button>
              </motion.div>
            )}
            {status === 'running' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-forge-green/8 border border-forge-green/20 rounded-2xl">
                <CheckCircle size={15} className="text-forge-green shrink-0" />
                <p className="text-xs text-forge-green">
                  Sandbox active — tools executing in isolated environment with enforced resource limits and network policy.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Kill modal */}
      <Modal open={killModal} onClose={() => setKillModal(false)} title="Kill Sandbox">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-forge-red/8 border border-forge-red/20 rounded-xl">
            <AlertTriangle size={15} className="text-forge-red mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-forge-primary mb-1">Terminate all tool execution?</p>
              <p className="text-xs text-forge-subtle">This immediately halts all running tools in the sandbox and logs the event to the audit trail. Active runs will be marked as killed.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setKillModal(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={killSandbox}>
              <Square size={12} /> Kill Sandbox
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}