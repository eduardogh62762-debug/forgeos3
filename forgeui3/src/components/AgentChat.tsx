import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Zap, Shield, Mic, MicOff } from 'lucide-react'
import { toast } from 'react-hot-toast'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { type Message, type Domain } from '../types'
import { useAgentStore } from '../store/agentStore'
import { t } from '../lib/translations'
import { MapWidget } from './MapWidget'

const DOMAIN_COLOR: Record<Domain, string> = {
  healthtech: '#00d084',
  agrotech:   '#7fc943',
  fintech:    '#f5a623',
}

function TypingOrb() {
  return (
    <div className="flex flex-col items-center gap-6 py-12 w-full">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Multi-layered Glow */}
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-forge/20 blur-3xl"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute inset-4 rounded-full border border-forge/20 border-dashed"
        />
        
        {/* Core 3D-ish Orb */}
        <motion.div 
          animate={{ 
            rotateY: [0, 360],
            rotateX: [0, 180, 0],
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full relative z-10 p-[1px] bg-gradient-to-br from-forge via-white/40 to-forge shadow-[0_0_50px_rgba(139,92,246,0.4)]">
          <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-forge/30 to-transparent animate-pulse" />
            <Zap size={20} className="text-forge relative z-10 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          </div>
        </motion.div>

        {/* Dynamic Orbitals */}
        {[0, 1, 2].map(i => (
          <motion.div 
            key={i} 
            animate={{ rotate: 360, rotateX: i * 45, rotateY: i * 30 }} 
            transition={{ duration: 4 + i * 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-12px] rounded-full border border-white/5"
          >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-forge/${20 + i * 10} shadow-lg`} />
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-2">
        <motion.p 
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[10px] font-bold uppercase tracking-[0.4em] text-forge-light">
          OpenClaw v4.2 Active
        </motion.p>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1 h-1 rounded-full bg-forge" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ArtifactSkeleton() {
  return (
    <div className="mt-4 p-5 rounded-[24px] bg-white/[0.03] border border-white/5 space-y-4 glow-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl skeleton-pulse" />
        <div className="h-3 w-32 rounded-full skeleton-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full rounded-full skeleton-pulse" />
        <div className="h-2 w-4/5 rounded-full skeleton-pulse" />
      </div>
      <div className="pt-4 flex gap-2">
        <div className="h-8 w-24 rounded-lg skeleton-pulse" />
        <div className="h-8 w-24 rounded-lg skeleton-pulse" />
      </div>
    </div>
  )
}

interface Props {
  domain:  Domain
  messages: Message[]
  running: boolean
  input:   string
  onInput: (v: string) => void
  onSend:  () => void
}

export function AgentChat({ domain, messages, running, input, onInput, onSend }: Props) {
  const { lang } = useAgentStore()
  const bottomRef = useRef<HTMLDivElement>(null)
  const color = DOMAIN_COLOR[domain]

  // Fix auto-scroll during streaming
  const lastMsgContent = messages.length > 0 ? messages[messages.length - 1].content : ''
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, lastMsgContent])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault()
      
      const cmd = input.toLowerCase().trim()
      if (cmd.startsWith('/')) {
        if (cmd === '/reset' || cmd === '/clear') {
          useAgentStore.getState().clear()
          toast.success('Sesión reiniciada', { icon: '🧹' })
          onInput('')
          return
        }
        if (cmd === '/map' || cmd === '/full') {
          useAgentStore.getState().setIsFullscreen(!useAgentStore.getState().isFullscreen)
          toast.success('Modo Fullscreen Toggled', { icon: '🗺️' })
          onInput('')
          return
        }
        if (cmd === '/trust') {
          toast('Sentinel Score: 98.2% (Premium Status)', { icon: '🛡️', duration: 4000 })
          onInput('')
          return
        }
      }

      onSend() 
    }
  }

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  const inputRef = useRef(input)
  const baseInputRef = useRef('')

  useEffect(() => {
    inputRef.current = input
  }, [input])

  // Sincronizar el transcript con el input real-time
  useEffect(() => {
    if (listening) {
      onInput(baseInputRef.current + (baseInputRef.current ? ' ' : '') + transcript)
    }
  }, [transcript, listening])

  const toggleListening = () => {
    if (!browserSupportsSpeechRecognition) {
      toast.error('Navegador no compatible')
      return
    }

    if (listening) {
      SpeechRecognition.stopListening()
      toast.dismiss('voice-toast')
    } else {
      resetTranscript()
      baseInputRef.current = inputRef.current
      const targetLang = lang === 'ENG' ? 'en-US' : 'es-MX'
      
      console.log('--- STARTING VOICE ---')
      console.log('Lang:', targetLang)
      console.log('Base:', baseInputRef.current)

      SpeechRecognition.startListening({ 
        continuous: true, 
        language: targetLang,
      }).catch(err => {
        console.error('SR Start Error:', err)
        toast.error(`Error de inicio: ${err.message || err.toString()}`)
      })

      toast.success(lang === 'ENG' ? `Listening (English)...` : `Escuchando (Español)...`, { 
        icon: '🎤', 
        id: 'voice-toast', 
        duration: 8000 
      })
    }
  }

  const handleDownload = (art: any) => {
    const content = typeof art.data === 'string' ? art.data : JSON.stringify(art.data, null, 2)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${art.title.toLowerCase().replace(/ /g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Archivo preparado para descarga')
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 no-scrollbar scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-24 select-none">
              {/* Premium Orb */}
              <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-pulse blur-2xl"
                  style={{ background: `radial-gradient(circle, ${color}30 0%, transparent 70%)` }} />
                <div className="w-12 h-12 rounded-full shadow-[0_0_40px_-5px_var(--color-forge)] border border-white/10 flex items-center justify-center"
                   style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
                   <div className="w-full h-full rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white/90 mb-2">{t(lang, 'welcome_title')}</h2>
              <p className="text-sm text-white/40 max-w-[280px]">
                {t(lang, 'welcome_subtitle')}
              </p>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group/msg`}>

                {msg.role === 'agent' && (
                  <div className="flex flex-col gap-4 max-w-[85%]">
                    {/* Agent reasoning - Glass Style */}
                    {msg.thoughts && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white/[0.03] border border-white/5 rounded-[22px] px-5 py-4 backdrop-blur-3xl overflow-hidden relative group/thought">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/thought:bg-forge transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t(lang, 'analysis_sentinel')}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed text-white/50 italic font-medium whitespace-pre-wrap selection:bg-forge/40">
                          {msg.thoughts}
                        </p>
                      </motion.div>
                    )}

                    <div className="flex gap-4 w-full">
                      {/* Avatar tint */}
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                          {msg.loading ? <div className="w-1 h-1 rounded-full bg-current animate-ping" /> : <span>{domain[0].toUpperCase()}</span>}
                        </div>
                      </div>

                      <div className="space-y-4 w-full">
                        <div className="glass-premium rounded-[28px] px-6 py-4 glow-border">
                          {msg.loading ? <TypingOrb /> : (
                            <div className="text-white/90 leading-[1.7] text-[14.5px] font-medium whitespace-pre-wrap selection:bg-forge/40">
                              {msg.content}
                            </div>
                          )}
                        </div>

                         {msg.artifacts && msg.artifacts.length > 0 && (
                           <div className="grid gap-4 pt-4 border-t border-white/5">
                             {msg.artifacts.map(art => (
                               <div key={art.id} className="w-full">
                                 {art.type === 'map' ? (
                                   <div className="space-y-3">
                                     <div className="flex items-center justify-between px-2">
                                       <h4 className="text-[11px] font-bold text-white/60 tracking-wider uppercase">{art.title}</h4>
                                       <span className="text-[9px] font-mono text-white/20">LIVE_GEODATA</span>
                                     </div>
                                     <MapWidget 
                                       center={art.data.center || [24.0277, -104.6532]} 
                                       zoom={art.data.zoom || 13}
                                       points={art.data.points || []}
                                       polygons={art.data.polygons || []}
                                       height="300px"
                                     />
                                   </div>
                                 ) : (
                                   <motion.div whileHover={{ y: -2 }}
                                     className="glass-premium rounded-[24px] p-6 glow-border hover:bg-white/[0.04] transition-all cursor-pointer group shadow-xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <Zap size={40} />
                                     </div>
                                     <div className="flex items-center justify-between mb-4">
                                       <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-white/5 border border-white/10 text-xl shadow-lg">
                                           {art.type === 'ticket' ? '🎫' : art.type === 'report' ? '📊' : '📄'}
                                         </div>
                                         <div>
                                           <h4 className="text-[13px] font-bold text-white group-hover:text-forge-light transition-colors">{art.title}</h4>
                                           <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">Artifact Engine v1</span>
                                         </div>
                                       </div>
                                       <button 
                                         onClick={() => handleDownload(art)}
                                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forge/10 border border-forge/20 text-[10px] font-bold text-forge-light hover:bg-forge/20 transition-all pointer-events-auto">
                                         <ArrowUp size={12} className="rotate-180" /> {t(lang, 'download_pdf')}
                                       </button>
                                     </div>
                                     <div className="text-[11.5px] text-white/40 leading-relaxed font-mono bg-black/20 p-3 rounded-xl border border-white/[0.02]">
                                       {typeof art.data === 'string' ? art.data : JSON.stringify(art.data, null, 2)}
                                     </div>
                                   </motion.div>
                                 )}
                               </div>
                             ))}
                           </div>
                         )}

                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/10 uppercase tracking-widest pt-2">
                           Sentinel Audit · {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {/* Visual Skeleton during thought extraction */}
                    {running && !msg.artifacts?.length && msg.id === messages[messages.length-1].id && (
                      <div className="w-full pl-12">
                        <ArtifactSkeleton />
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'user' && (
                  <div className="max-w-[75%] flex flex-col items-end">
                    <div className="glass-premium bg-white shadow-2xl rounded-[30px] px-6 py-4 text-black glow-border">
                      <p className="text-[14.5px] leading-relaxed font-medium whitespace-pre-wrap selection:bg-forge/40">
                        {msg.content}
                      </p>
                    </div>
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-3 mr-2">
                      {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input - Premium Floating Bar */}
      <div className="p-8 pb-10">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-forge/20 to-indigo-600/20 blur opacity-0 group-focus-within:opacity-100 transition duration-500 rounded-[30px]" />
          <div className="relative flex items-end gap-3 glass-premium border border-white/10 rounded-[28px] p-3 pl-6 pr-3 transition-all group-focus-within:border-white/20 group-focus-within:bg-white/[0.05] glow-border">
            <textarea
              value={input}
              onChange={e => onInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={running}
              placeholder={t(lang, 'placeholder')}
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 text-[14.5px] py-3 text-white placeholder-white/20 resize-none no-scrollbar h-[44px] max-h-[160px]"
            />
            <button
              onClick={toggleListening}
              className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all active:scale-95 flex-shrink-0 ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}>
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={onSend}
              disabled={running || !input.trim()}
              className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all shadow-xl active:scale-95 flex-shrink-0 ${
                !input.trim() || running 
                  ? 'bg-white/5 text-white/10' 
                  : 'bg-white text-black hover:scale-105'
              }`}>
              <ArrowUp size={18} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
               <Shield size={10} className="text-emerald-500/40" /> {t(lang, 'policy_guard')}
            </div>
            <div className="w-[1px] h-3 bg-white/5" />
            <div className="text-[10px] font-bold text-white/10 uppercase tracking-[0.2em] font-mono">
               open-claw-model-v4
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
