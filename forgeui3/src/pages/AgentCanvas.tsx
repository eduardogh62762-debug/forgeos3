import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, RotateCcw, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { GovernanceBar } from '../components/GovernanceBar'
import { AgentChat }     from '../components/AgentChat'
import { HealthCanvas }  from '../canvases/HealthCanvas'
import { AgroCanvas }    from '../canvases/AgroCanvas'
import { FinCanvas }     from '../canvases/FinCanvas'
import { ApprovalWidget } from '../components/ApprovalWidget'
import { useAgentStore } from '../store/agentStore'
import { runAgent }      from '../lib/agentClient'
import { AGENTS, type Domain, type GovernanceEvent } from '../types'
import { t, type Lang } from '../lib/translations'
import confetti from 'canvas-confetti'

export function AgentCanvas() {
  const { domain } = useParams<{ domain: string }>()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [sideOpen, setSideOpen] = useState(true)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const {
    messages, govEvents, running, lang, isFullscreen,
    addMessage, updateLast, addGovEvent,
    setRunning, clear, setLang, setIsFullscreen
  } = useAgentStore()

  const agent = AGENTS.find(a => a.domain === domain)

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20
    const y = (e.clientY / window.innerHeight - 0.5) * 20
    setMousePos({ x, y })
  }

  const handleSend = useCallback(async () => {
    if (!agent || !input.trim() || running) return

    const userMsg = {
      id: crypto.randomUUID(), role: 'user' as const,
      content: input.trim(), ts: Date.now(),
    }
    addMessage(userMsg)
    setInput('')
    setRunning(true)
    addMessage({ id: crypto.randomUUID(), role: 'agent' as const, content: '', ts: Date.now(), loading: true })

    await runAgent({
      domain:    agent.domain as Domain,
      agentId:   agent.agentId,
      agentName: agent.name,
      input:     userMsg.content,
      onToken:   (chunk, thoughts, artifacts) => {
        updateLast(chunk, thoughts, artifacts)
      },
      onGovEvent: (evt) => {
        addGovEvent({
          id: crypto.randomUUID(),
          toolName: evt.toolName,
          decision: evt.decision as GovernanceEvent['decision'],
          reason: evt.reason,
          ts: Date.now(),
        })
        if (evt.decision === 'approval_required') {
          toast.loading(`Approval required for ${evt.toolName}...`, { id: evt.toolName })
        } else if (evt.decision === 'allowed') {
          toast.success(`${evt.toolName} allowed`, { id: evt.toolName, duration: 2000 })
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [agent.color, '#ffffff', '#ffd700']
          })
        } else if (evt.decision === 'blocked') {
          toast.error(`${evt.toolName} blocked by policy`, { id: evt.toolName, duration: 3000 })
        }
      },
      onDone:  (output) => { 
        updateLast(output); 
        setRunning(false) 
        toast.dismiss()
      },
      onError: (err)    => { 
        toast.error(`Error: ${err}`); 
        setRunning(false) 
      },
    })
  }, [input, running, agent, messages, addMessage, updateLast, addGovEvent, setRunning])

  if (!agent) { navigate('/gallery'); return null }

  const ContextPanel = domain === 'healthtech' ? HealthCanvas
    : domain === 'agrotech' ? AgroCanvas : FinCanvas

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden relative selection:bg-forge/30 selection:text-forge-light">
      
      {/* Dynamic Parallax Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="parallax-layer opacity-20"
          style={{ 
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
            background: `radial-gradient(circle at 70% 30%, ${agent.color}44 0%, transparent 70%)` 
          }} 
        />
        <div 
          className="parallax-layer opacity-10"
          style={{ 
            transform: `translate(${mousePos.x * -0.8}px, ${mousePos.y * -0.8}px)`,
            background: `radial-gradient(circle at 20% 80%, ${agent.color}33 0%, transparent 60%)` 
          }} 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Premium Header */}
      <header className="h-14 glass-premium border-b border-white/5 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/gallery')}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft size={16} />
          </button>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-2xl"
              style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30`, color: agent.color }}>
              {agent.icon}
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight">{agent.name}</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{t(lang, 'sentinel_active')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Confidence Score */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-right">
              <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.1em]">{t(lang, 'trust_score')}</div>
              <div className="text-[11px] font-bold text-emerald-400">98.2% Perfect</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield size={14} className="text-emerald-500" />
            </div>
          </div>

          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 mr-2">
            {(['ESP', 'ENG', 'NHN'] as const).map(l => (
              <button 
                key={l} 
                onClick={() => setLang(l)}
                className={`px-2 py-1 rounded-lg text-[8px] font-bold transition-all ${lang === l ? 'bg-forge text-black shadow-lg' : 'text-white/20 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>

          <button onClick={clear}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all">
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* Governance bar */}
      <div style={{ flexShrink: 0 }}>
        <GovernanceBar domain={agent.domain as Domain} events={govEvents} running={running} />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left panel (ContextPanel / Map) */}
        <motion.div 
          animate={{ 
            width: isFullscreen ? '100%' : '260px',
            flexShrink: 0
          }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className={`relative overflow-hidden ${!isFullscreen ? 'border-r border-white/5' : ''}`}
        >
          <ContextPanel onExampleClick={setInput} color={agent.color} isFullscreen={isFullscreen} />
        </motion.div>

        {/* Chat & Evidence (Animate Hiding) */}
        <AnimatePresence>
          {!isFullscreen && (
            <motion.div 
              key="chat-evidence-panel"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="flex flex-1 min-w-0 overflow-hidden"
            >
              <div className="flex-1 overflow-hidden relative border-r border-white/5">
                <AgentChat
                  domain={agent.domain as Domain}
                  messages={messages}
                  running={running}
                  input={input}
                  onInput={setInput}
                  onSend={handleSend}
                />
                <ApprovalWidget domain={agent.domain as Domain} />
              </div>

              {sideOpen && (
                <div className="w-[300px] bg-black/40 backdrop-blur-3xl overflow-y-auto flex-shrink-0 z-20 shadow-2xl no-scrollbar flex flex-col">
                  <div className="p-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-xl z-20">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">{t(lang, 'evidence_canvas')}</p>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-white/50">{govEvents.length} {t(lang, 'audits')}</div>
                      </div>
                    </div>
                    <button onClick={() => setSideOpen(false)} className="text-white/20 hover:text-white transition-colors">
                       <ChevronLeft size={14} className="rotate-180" />
                    </button>
                  </div>

                  <div className="p-6 relative flex-1">
                    <div className="absolute left-9 top-10 bottom-10 w-[1px] bg-white/[0.05]" />
                    <div className="space-y-10 relative">
                      {govEvents.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                          <div className="w-14 h-14 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                            <Shield size={24} className="text-white/10" />
                          </div>
                          <p className="text-xs font-semibold text-white/20 uppercase tracking-widest">{t(lang, 'awaiting_audits')}</p>
                        </div>
                      ) : (
                        [...govEvents].reverse().map((e, idx) => (
                          <motion.div key={e.id} 
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative pl-10 group"
                          >
                            <div className={`absolute left-[-4.5px] top-1.5 w-[10px] h-[10px] rounded-full border-2 border-[#050505] z-10 ${
                              e.decision === 'allowed' ? 'bg-emerald-500' : e.decision === 'blocked' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            <div className="p-5 rounded-[28px] glass-premium border border-white/5 hover:border-white/10 transition-all glow-border">
                              <div className="flex items-center justify-between mb-3 text-white">
                                <span className="mono text-[9px] font-bold">{e.toolName.toUpperCase()}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                  e.decision === 'allowed' ? 'text-emerald-500' : e.decision === 'blocked' ? 'text-red-500' : 'text-amber-500'
                                }`}>
                                  {e.decision === 'approval_required' ? 'Pending' : e.decision}
                                </span>
                              </div>
                              {e.reason && <p className="text-[11px] text-white/40 leading-relaxed line-clamp-3">{e.reason}</p>}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}