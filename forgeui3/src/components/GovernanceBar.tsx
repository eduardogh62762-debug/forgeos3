import { motion, AnimatePresence } from 'framer-motion'
import { Download, Maximize2, Minimize2 } from 'lucide-react'
import { useAgentStore } from '../store/agentStore'
import { t } from '../lib/translations'
import type { GovernanceEvent, Domain } from '../types'
import { AGENTS } from '../types'
import { toast } from 'react-hot-toast'

const DOMAIN_COLOR: Record<Domain, string> = {
  healthtech: '#00d084',
  agrotech:   '#7fc943',
  fintech:    '#f5a623',
}

interface Props {
  domain:  Domain
  events:  GovernanceEvent[]
  running: boolean
}

export function GovernanceBar({ domain, events, running }: Props) {
  const { lang, isFullscreen, setIsFullscreen } = useAgentStore()
  const color  = DOMAIN_COLOR[domain]
  const recent = events.slice(-5)

  const handleExportCSV = () => {
    if (events.length === 0) {
      toast.error('No hay eventos para exportar')
      return
    }
    const headers = ['ID', 'Tool', 'Decision', 'Reason', 'Timestamp']
    const csvContent = [
      headers.join(','),
      ...events.map(e => [
        e.id,
        e.toolName,
        e.decision,
        `"${(e.reason || '').replace(/"/g, '""')}"`,
        new Date(e.ts).toISOString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `forge_audit_${domain}_${Date.now()}.csv`)
    link.click()
    toast.success('Log de Auditoría exportado (CSV)')
  }

  return (
    <div className="glass-premium border-b border-white/5 z-20">
      <div className="flex items-center gap-4 px-6 py-2.5">

        {/* Status dot */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center justify-center w-4 h-4">
            <div className={`w-2 h-2 rounded-full ${running ? 'orb-active' : 'orb-idle'}`}
              style={{ background: running ? color : 'var(--muted)' }} />
            {running && (
              <div className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${color}`, animation: 'orb-ring 1.5s ease-out infinite', opacity: 0.5 }} />
            )}
          </div>
          <span className="mono text-[10px] tracking-wider"
            style={{ color: running ? color : 'var(--subtle)' }}>
            {running ? t(lang, 'evaluating') : t(lang, 'ready')}
          </span>
        </div>

        <span style={{ color: 'var(--border)' }}>|</span>

        {/* Events */}
        <div className="flex items-center gap-2 flex-1 overflow-hidden min-w-0">
          <AnimatePresence mode="popLayout">
            {recent.length === 0 ? (
              <span className="mono text-[11px]" style={{ color: 'var(--subtle)' }}>
                Waiting for tool calls...
              </span>
            ) : (
              recent.map(e => {
                const dColor = e.decision === 'allowed'
                  ? '#00d084' : e.decision === 'blocked'
                  ? '#ef4444' : '#f5a623'
                return (
                  <motion.div key={e.id} className="gov-event"
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         6,
                      padding:     '3px 8px',
                      borderRadius: 4,
                      border:      `1px solid ${dColor}22`,
                      background:  `${dColor}0a`,
                      flexShrink:  0,
                    }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: dColor }} />
                    <span className="mono text-[10px]" style={{ color: 'var(--secondary)' }}>
                      {e.toolName}
                    </span>
                    <span className="mono text-[10px]" style={{ color: dColor }}>
                      {e.decision === 'approval_required' ? 'pending' : e.decision}
                    </span>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {/* ForgeOS3 badge & Actions */}
        <div className="shrink-0 flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
            <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: color }} />
            <span className="mono text-[9px] font-bold tracking-widest text-white/40 uppercase">
              {domain} Node
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/5" />

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-white/30 hover:text-forge-light hover:bg-forge/10 transition-all"
              title="Export CSV">
              <Download size={14} />
            </button>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isFullscreen ? 'bg-forge text-white shadow-lg' : 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10'
              }`}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
