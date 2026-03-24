import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Check, Zap } from 'lucide-react'
import { forgeApi } from '../lib/forgeosClient'
import { toast } from 'react-hot-toast'
import type { Domain } from '../types'

interface Approval {
  id: string
  tool_name: string
  reason: string
  agent_name: string
}

export function ApprovalWidget({ domain }: { domain: Domain }) {
  const [pending, setPending] = useState<Approval | null>(null)
  const [resolving, setResolving] = useState(false)

  // Polling for pending approvals for this domain
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await forgeApi.get(`/api/approvals?domain=${domain}&status=pending&limit=1`)
        if (data.data && data.data.length > 0) {
          setPending(data.data[0])
        } else {
          setPending(null)
        }
      } catch {
        // silently fail polling
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [domain])

  const handleResolve = async (status: 'approved' | 'rejected') => {
    if (!pending || resolving) return
    setResolving(true)
    const toastId = toast.loading(`${status === 'approved' ? 'Approving' : 'Rejecting'} action...`)
    try {
      await forgeApi.post(`/api/approvals/${pending.id}/resolve`, {
        status,
        reviewedBy: 'admin@forgeos3.dev'
      })
      toast.success(`Action ${status}`, { id: toastId })
      setPending(null)
    } catch {
      toast.error('Failed to resolve approval', { id: toastId })
    } finally {
      setResolving(false)
    }
  }

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.9, y: 40, filter: 'blur(10px)' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[440px] z-[100]"
        >
          <div className="relative group overflow-hidden p-[1px] rounded-[32px] bg-gradient-to-br from-white/20 to-transparent shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]">
            <div className="relative bg-[#0a0a0a]/90 backdrop-blur-[40px] rounded-[31px] overflow-hidden">
              {/* Top Banner */}
              <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xl shadow-amber-500/10">
                    <ShieldAlert size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-white/90">Gobernanza Sentinel</h3>
                    <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">Aprobación Crítica Requerida</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 animate-pulse" />
                </div>
              </div>

              <div className="px-8 pb-8">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
                    <Zap size={40} />
                  </div>
                  <p className="text-[13px] text-white/60 leading-relaxed mb-1">
                    <span className="text-white font-bold">{pending.agent_name}</span> solicita ejecutar:
                  </p>
                  <code className="text-forge-light font-bold text-sm block mb-4">
                    {pending.tool_name.replace(/_/g, ' ')}
                  </code>
                  
                  <div className="flex items-start gap-2 pt-4 border-t border-white/5 text-xs text-white/40 italic leading-relaxed">
                    <span className="text-amber-500/40 mt-0.5">"</span>
                    {pending.reason}
                    <span className="text-amber-500/40 mt-0.5">"</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleResolve('rejected')}
                    disabled={resolving}
                    className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/5 text-white/40 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50">
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleResolve('approved')}
                    disabled={resolving}
                    className="group flex-[1.5] h-14 rounded-2xl bg-gradient-to-r from-forge to-indigo-600 p-[1px] active:scale-95 transition-all disabled:opacity-50">
                    <div className="w-full h-full rounded-[15px] bg-[#0a0a0a]/20 backdrop-blur-sm flex items-center justify-center gap-2 group-hover:bg-transparent transition-colors">
                      <Check size={18} className="text-white" />
                      <span className="text-sm font-bold text-white">Autorizar Acción</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Progress bar if resolving */}
              {resolving && (
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: '100%' }}
                  className="absolute bottom-0 left-0 h-1 bg-forge shadow-[0_0_10px_#7c3aed]"
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
