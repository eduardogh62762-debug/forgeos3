import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LogOut, Zap } from 'lucide-react'
import { AGENTS } from '../types'
import { supabase } from '../lib/supabase'

export function Gallery() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '', email: data.user.email || '' })
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden flex relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-forge/5 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar - Glassmorphism */}
      <aside className="w-[280px] flex-shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forge to-indigo-600 flex items-center justify-center">
              <Zap size={16} fill="white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Forge<span className="text-forge">UI</span>3
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
          <div className="px-4 py-2 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
            Dominios Durango
          </div>
          {AGENTS.map(agent => (
            <button key={agent.id} onClick={() => navigate(`/canvas/${agent.domain}`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all text-left group">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform group-hover:scale-110"
                style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors capitalize">{agent.domain.replace('tech', '')}</div>
                <div className="text-[10px] text-white/30 truncate">{agent.name}</div>
              </div>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-sm font-bold text-white/60">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <button onClick={handleLogout} className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1">
                <LogOut size={10} /> Salir
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-12">
        <div className="max-w-5xl mx-auto">
          <header className="mb-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Gobernanza Activa
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sentinel Cloud Sync</span>
              </div>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl font-bold tracking-tight mb-4">
              Dashboard de Agentes
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white/40 max-w-lg leading-relaxed">
              Selecciona un dominio operativo para iniciar una sesión de asistencia gobernada. Cada interacción es auditada en tiempo real por el Council.
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS.map((agent, i) => (
              <motion.div key={agent.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                onClick={() => navigate(`/canvas/${agent.domain}`)}
                className="group relative p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-forge/[0.04] hover:border-forge/30 transition-all cursor-pointer overflow-hidden backdrop-blur-sm">
                <div className="absolute -top-4 -right-4 w-24 h-24 blur-3xl rounded-full opacity-20 transition-opacity group-hover:opacity-40" style={{ background: agent.color }} />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-[22px] flex items-center justify-center text-3xl mb-8 transition-transform group-hover:scale-110 shadow-2xl"
                    style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                    {agent.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{agent.name}</h3>
                  <p className="text-sm text-white/40 mb-8 leading-relaxed line-clamp-3 font-medium">
                    {agent.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10" style={{ color: agent.color }}>
                      {agent.domain.replace('tech', ' tech')}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shadow-xl">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}