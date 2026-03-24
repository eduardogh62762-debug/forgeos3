import { motion } from 'framer-motion'
import { ShieldAlert, Activity, TrendingUp, DollarSign, Percent } from 'lucide-react'

interface Props { 
  isFullscreen?: boolean;
}

const IMPACT = [
  { label: 'Ahorro Burocracia', value: '$12,400', sub: '+14% vs mes anterior', icon: DollarSign, color: '#10b981' },
  { label: 'Tiempo Procesado', value: '450h',  sub: 'Equivalente a 3 agentes', icon: Activity, color: '#3b82f6' },
  { label: 'Compliance Rate', value: '99.9%', sub: '0 brechas detectadas',  icon: Percent,  color: '#8b5cf6' },
]

export function FinCanvas({ isFullscreen }: Props) {
  return (
    <div className="p-6 space-y-8 bg-transparent">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
          <TrendingUp size={10} /> Indicadores de Impacto
        </h3>
        <div className={isFullscreen ? "grid grid-cols-3 gap-6" : "space-y-4"}>
          {IMPACT.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <item.icon size={48} />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">{item.label}</p>
              <h4 className="text-xl font-bold text-white/90 mb-1">{item.value}</h4>
              <p className="text-[9px] font-medium text-emerald-500/60">{item.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Alerta de Cumplimiento</span>
        </div>
        <p className="text-[11px] text-white/30 leading-relaxed">
          Toda transacción superior a $50k requiere firma multi-sig del Council de Durango.
        </p>
      </div>
    </div>
  )
}
