import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Zap } from 'lucide-react'
import { AGENTS } from '../types'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: 'easeOut' as const }
})

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-forge/30 selection:text-forge-light overflow-x-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-forge/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forge to-indigo-600 flex items-center justify-center shadow-lg shadow-forge/20">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Forge<span className="text-forge">UI</span>3
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/signin')} className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Sign in
            </button>
            <button onClick={() => navigate('/signup')} 
              className="px-5 py-2 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all shadow-xl shadow-white/5">
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 text-center">
        <motion.div {...fade(0)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Durango Hackathon 2025 · Edition</span>
        </motion.div>

        <motion.h1 {...fade(0.1)} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
          Autonomous Agents.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/40 via-white to-white/40">Gobernanza de Elite.</span>
        </motion.h1>

        <motion.p {...fade(0.15)} className="max-w-xl mx-auto text-lg text-white/40 mb-10 leading-relaxed">
          Interactúa con la nueva generación de agentes OpenClaw protegidos por la infraestructura de ForgeOS3. Seguridad, auditoría y control total.
        </motion.p>

        <motion.div {...fade(0.2)} className="flex items-center justify-center gap-4">
          <button onClick={() => navigate('/gallery')} 
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-forge to-indigo-600 font-bold flex items-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-forge/20">
            Explorar Dominios <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </section>

      {/* Domain Selection Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="text-left">
            <h2 className="text-3xl font-bold mb-3">Dominios Especializados</h2>
            <p className="text-white/40 max-w-md">Selecciona un ecosistema optimizado para resolver problemas reales en Durango.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-white/30 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <Shield size={12} className="text-emerald-500" /> Powered by Sentinel Governance
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENTS.map((agent, i) => (
            <motion.div key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate('/signup')}
              className="group relative p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">{agent.icon}</span>
              </div>
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-2xl`}
                  style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                  {agent.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-forge-light transition-colors">{agent.name}</h3>
                <p className="text-sm text-white/40 mb-6 leading-relaxed line-clamp-2">{agent.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: agent.color }}>{agent.domain}</span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-forge" />
            <span className="text-xs font-bold uppercase tracking-widest">ForgeOS3 Ecosystem</span>
          </div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em]">Build with Passion for Durango Hackathon 2025</p>
        </div>
      </footer>
    </div>
  )
}
