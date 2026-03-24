import { ShieldCheck, Map as MapIcon, Database } from 'lucide-react'
import { MapWidget } from '../components/MapWidget'
import { useAgentStore } from '../store/agentStore'
import { t } from '../lib/translations'

interface Props { 
  onExampleClick: (ex: string) => void;
  isFullscreen?: boolean;
}

const DURANGO_AGRO_CENTER: [number, number] = [24.0277, -104.6532]
const AFFECTED_POLYGON: [number, number][] = [
  [24.035, -104.660],
  [24.040, -104.650],
  [24.030, -104.640],
  [24.025, -104.655],
]

const EXAMPLES = [
  'Analizar sensores del campo #22',
  'Predecir cosecha sector norte',
  'Nivel de humedad 34% — recomendar',
  'Comparar campo #08 vs mes pasado',
]

export function AgroCanvas({ onExampleClick, isFullscreen }: Props) {
  const { lang } = useAgentStore()
  return (
    <div className="p-6 space-y-8 bg-transparent">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-2">
          <MapIcon size={10} /> {t(lang, 'agro_location')}
        </h3>
        <MapWidget 
          center={DURANGO_AGRO_CENTER} 
          zoom={isFullscreen ? 15 : 14} 
          polygons={[AFFECTED_POLYGON]}
          height={isFullscreen ? "500px" : "240px"}
          points={[{ lat: DURANGO_AGRO_CENTER[0], lng: DURANGO_AGRO_CENTER[1], label: 'Sector Norte - Monitoreo' }]}
        />
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{t(lang, 'satellite_feed')}</span>
            <span className="text-[9px] font-mono text-white/10 italic">ORBIT_X_102</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-forge animate-pulse" />
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Sector #44 - Anomalía Detectada</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4 flex items-center gap-2">
          <Database size={10} /> {t(lang, 'active_sensors')}
        </h3>
        <div className={isFullscreen ? "grid grid-cols-2 gap-4" : "grid gap-2"}>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => onExampleClick(ex)}
              className="text-left p-3 rounded-xl border border-white/5 bg-transparent hover:bg-white/[0.03] hover:border-white/10 transition-all text-[11px] text-white/50 leading-relaxed font-medium">
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
        <ShieldCheck size={14} className="text-emerald-500 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-emerald-500/60 font-bold uppercase tracking-wider">
          Gobernanza Activa: apply_treatment requiere firma del Council
        </p>
      </div>
    </div>
  )
}
