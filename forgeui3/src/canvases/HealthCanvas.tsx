import { motion } from 'framer-motion'
import { Activity, Clipboard, UserPlus, MapPin } from 'lucide-react'
import { MapWidget } from '../components/MapWidget'
import { useAgentStore } from '../store/agentStore'
import { t } from '../lib/translations'

interface Props { 
  onExampleClick: (ex: string) => void; 
  color: string;
  isFullscreen?: boolean;
}

const CLINIC_POS: [number, number] = [24.0221, -104.6588]

const STATS = [
  { label: 'Pacientes hoy',  value: '24', icon: UserPlus },
  { label: 'Pendientes',     value: '7',  icon: Clipboard  },
  { label: 'Procesados',     value: '142',icon: Activity },
]

const EXAMPLES = [
  'Resumir formulario ingreso #4821',
  'Checklist seguimiento post-op',
  'Revisión: fiebre 38.5°C, 3 días',
  'Instrucciones de alta diabético',
]

export function HealthCanvas({ onExampleClick, color, isFullscreen }: Props) {
  const { lang } = useAgentStore()
  return (
    <div className="p-6 space-y-8 bg-transparent">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
          <MapPin size={10} /> {t(lang, 'health_location')}
        </h3>
        <MapWidget 
          center={CLINIC_POS} 
          zoom={isFullscreen ? 16 : 15} 
          height={isFullscreen ? "500px" : "180px"}
          points={[{ lat: CLINIC_POS[0], lng: CLINIC_POS[1], label: 'Unidad Médica Durango Sur' }]}
        />
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
          <Activity size={10} /> {t(lang, 'active_sensors')}
        </h3>
        <div className={isFullscreen ? "grid grid-cols-3 gap-4" : "space-y-3"}>
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex justify-between items-center p-4 rounded-[20px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center gap-3">
                <s.icon size={14} className="text-white/20" />
                <span className="text-[12px] text-white/40 font-medium">{s.label}</span>
              </div>
              <span className="text-sm font-bold text-white/80" style={{ color }}>{s.value}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Sugerencias Médicas</h3>
        <div className="grid gap-2">
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => onExampleClick(ex)}
              className="text-left p-3 rounded-xl border border-white/5 bg-transparent hover:bg-white/[0.03] hover:border-white/10 transition-all text-[11px] text-white/50 leading-relaxed font-medium">
              "{ex}"
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
