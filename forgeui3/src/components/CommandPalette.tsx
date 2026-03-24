import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Terminal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAgentStore } from '../store/agentStore'
import { AGENTS } from '../types'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { clear } = useAgentStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const actions = [
    ...AGENTS.map(a => ({
      id: `agent-${a.id}`,
      title: `Ir a ${a.name}`,
      icon: a.icon,
      color: a.color,
      perform: () => { navigate(`/canvas/${a.domain}`); setOpen(false) }
    })),
    {
      id: 'clear-chat',
      title: 'Limpiar Sesión Actual',
      icon: <Terminal size={18} />,
      color: '#ef4444',
      perform: () => { clear(); setOpen(false) }
    },
    {
      id: 'go-gallery',
      title: 'Regresar a Galería',
      icon: <Search size={18} />,
      color: '#ffffff',
      perform: () => { navigate('/gallery'); setOpen(false) }
    }
  ]

  const filtered = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]">
            
            <div className="flex items-center px-6 py-4 border-b border-white/5">
              <Search className="text-white/20 mr-4" size={20} />
              <input
                autoFocus
                placeholder="Escribe un comando o busca un agente... (Cmd+K)"
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 py-2 outline-none"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto p-3 no-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-white/20 text-sm italic">No se encontraron resultados</div>
              ) : (
                filtered.map(a => (
                  <button key={a.id} onClick={a.perform}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:scale-110 transition-transform"
                      style={{ color: a.color }}>
                      {a.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{a.title}</div>
                      <div className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-0.5">Comando Rápido</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-center gap-4">
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">↑↓ Navegar</span>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">↵ Ejecutar</span>
              <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">esc Cerrar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
