import type { FC, ReactNode } from 'react'
import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

export const Modal: FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative w-full ${sizes[size]} bg-forge-surface border border-forge-border rounded-2xl shadow-forge-lg animate-slide-up`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-forge-border">
          <h2 className="text-base font-semibold text-forge-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
