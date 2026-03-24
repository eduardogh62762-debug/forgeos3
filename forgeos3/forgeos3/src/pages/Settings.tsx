import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Copy, RefreshCw, Check, Shield, Key, Building2, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const RUNTIMES = [
  { name: 'OpenClaw', key: 'openclaw_v1', live: true, desc: 'Primary MVP adapter · full integration' },
  { name: 'LangGraph', key: null, live: false, desc: 'Interface defined · adapter coming soon' },
  { name: 'AutoGen', key: null, live: false, desc: 'Interface defined · adapter coming soon' },
  { name: 'CrewAI', key: null, live: false, desc: 'Interface defined · adapter coming soon' },
  { name: 'Custom', key: null, live: false, desc: 'Bring your own runtime adapter' },
]

const SECTIONS = [
  { id: 'runtime', icon: Zap, label: 'Runtimes' },
  { id: 'api', icon: Key, label: 'API Access' },
  { id: 'org', icon: Building2, label: 'Organization' },
]

export function Settings() {
  const [copied, setCopied] = useState(false)
  const [section, setSection] = useState('runtime')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshed, setRefreshed] = useState(false)
  const [showConfirmRotate, setShowConfirmRotate] = useState(false)
  const [apiKey, setApiKey] = useState('fos3_sk_live_xxxxxxxxxxxxxxxxxxxxxxxx')
  const { user } = useAuthStore()

  const copy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRefresh = () => {
    if (showConfirmRotate) {
      setRefreshing(true)
      setShowConfirmRotate(false)
      setTimeout(() => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
        const randomKey = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        setApiKey(`fos3_sk_live_${randomKey}`)
        setRefreshing(false)
        setRefreshed(true)
        setTimeout(() => setRefreshed(false), 3000)
      }, 1200)
    } else {
      setShowConfirmRotate(true)
      setTimeout(() => setShowConfirmRotate(false), 5000)
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg">
      <div className="px-8 py-5 border-b border-forge-border sticky top-0 z-10 bg-forge-bg/90 backdrop-blur-sm">
        <h1 className="text-base font-semibold text-forge-white">Settings</h1>
        <p className="text-xs text-forge-subtle mt-0.5">Runtime configuration and workspace management</p>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-6 max-w-5xl">
          <div className="space-y-1">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setSection(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${section === id ? 'bg-amber-400/10 text-amber-500 border border-amber-400/20' : 'text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated'}`}>
                <Icon size={14} className={section === id ? 'text-amber-500' : 'text-forge-subtle'} />
                {label}
                {section === id && <ChevronRight size={12} className="ml-auto" />}
              </button>
            ))}
          </div>

          <div className="col-span-3">
            <motion.div key={section} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>

              {section === 'runtime' && (
                <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-forge-border bg-forge-elevated/30">
                    <Zap size={14} className="text-amber-500" />
                    <span className="text-sm font-bold text-forge-white">Runtime Presets</span>
                    <span className="ml-auto text-[10px] text-forge-subtle">1 active · {RUNTIMES.length - 1} planned</span>
                  </div>
                  <div className="divide-y divide-forge-border/50">
                    {RUNTIMES.map(r => (
                      <div key={r.name} className={`flex items-center gap-4 px-5 py-4 ${!r.live ? 'opacity-40' : ''}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${r.live ? 'bg-amber-400' : 'bg-forge-elevated border border-forge-border'}`}
                          style={r.live ? { boxShadow: '0 0 12px rgba(245,158,11,0.3)' } : {}}>
                          <Zap size={14} className={r.live ? 'text-black' : 'text-forge-subtle'} fill={r.live ? 'currentColor' : 'none'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-forge-white">{r.name}</span>
                            {r.key && <code className="text-[10px] font-mono text-forge-subtle bg-forge-elevated border border-forge-border px-1.5 py-0.5 rounded">{r.key}</code>}
                          </div>
                          <span className="text-xs text-forge-subtle">{r.desc}</span>
                        </div>
                        {r.live ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/8 border border-emerald-500/20 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-emerald-500 font-bold">Active</span>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-forge-elevated border border-forge-border text-forge-subtle rounded-full shrink-0">Soon</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section === 'api' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-400/5 border border-amber-400/20 rounded-2xl flex items-start gap-3">
                    <Shield size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-500 leading-relaxed">
                      Keep your API key secret. Never expose it in client-side code or public repositories.
                    </p>
                  </div>

                  {refreshed && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-500">
                      <Check size={12} />
                      API key rotated successfully. Make sure to update your integrations.
                    </motion.div>
                  )}

                  {showConfirmRotate && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-forge-red/8 border border-forge-red/20 rounded-xl flex items-center gap-3">
                      <AlertTriangle size={13} className="text-forge-red shrink-0" />
                      <p className="text-xs text-forge-red flex-1">This will invalidate your current key. All integrations using it will break. Click again to confirm.</p>
                      <button onClick={() => setShowConfirmRotate(false)} className="text-[10px] text-forge-subtle hover:text-forge-primary">Cancel</button>
                    </motion.div>
                  )}

                  <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-forge-border bg-forge-elevated/30">
                      <Key size={14} className="text-amber-500" />
                      <span className="text-sm font-bold text-forge-white">Workspace API Key</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-forge-subtle uppercase tracking-widest mb-2 block">Secret Key</label>
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center px-4 py-2.5 bg-forge-elevated border border-forge-border rounded-xl font-mono text-xs text-forge-secondary overflow-hidden">
                            <span className="truncate">{apiKey}</span>
                          </div>
                          <button onClick={copy}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${copied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-forge-elevated border-forge-border text-forge-secondary hover:text-forge-primary hover:border-forge-line'}`}>
                            {copied ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
                          </button>
                          <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            title={showConfirmRotate ? 'Click again to confirm rotation' : 'Rotate API key'}
                            className={`p-2.5 rounded-xl border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${showConfirmRotate
                                ? 'bg-forge-red/10 border-forge-red/30 text-forge-red'
                                : 'bg-forge-elevated border-forge-border text-forge-subtle hover:text-forge-primary hover:border-forge-line'
                              }`}>
                            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-forge-border">
                        {[
                          { label: 'Created', value: 'Mar 14, 2025' },
                          { label: 'Last used', value: 'Just now' },
                          { label: 'Requests', value: '247 today' },
                          { label: 'Rate limit', value: '1000 / hr' },
                        ].map(({ label, value }) => (
                          <div key={label} className="p-3 bg-forge-elevated/50 rounded-xl">
                            <div className="text-[10px] text-forge-subtle mb-0.5">{label}</div>
                            <div className="text-xs font-semibold text-forge-primary">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {section === 'org' && (
                <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-forge-border bg-forge-elevated/30">
                    <Building2 size={14} className="text-amber-500" />
                    <span className="text-sm font-bold text-forge-white">Organization</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-forge-elevated/50 border border-forge-border rounded-2xl">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
                        <span className="text-lg font-bold text-amber-500">{user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-forge-white">{user?.name}</div>
                        <div className="text-xs text-forge-subtle">{user?.email}</div>
                      </div>
                      <div className="ml-auto px-2.5 py-1 bg-amber-400/8 border border-amber-400/20 rounded-full">
                        <span className="text-[10px] font-bold text-amber-500">Owner</span>
                      </div>
                    </div>
                    <div className="space-y-0 border border-forge-border rounded-2xl overflow-hidden">
                      {[
                        { label: 'Workspace', value: 'ForgeOS3 Dev' },
                        { label: 'Plan', value: 'Hackathon MVP' },
                        { label: 'Runtime', value: 'OpenClaw v1' },
                        { label: 'Region', value: 'Durango, MX' },
                        { label: 'Created', value: 'Mar 14, 2025' },
                      ].map(({ label, value }, i) => (
                        <div key={label} className={`flex justify-between items-center px-5 py-3.5 ${i < 4 ? 'border-b border-forge-border/50' : ''} ${i % 2 === 1 ? 'bg-forge-elevated/20' : ''}`}>
                          <span className="text-xs text-forge-subtle">{label}</span>
                          <span className="text-xs font-semibold text-forge-primary">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
