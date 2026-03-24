import type { FC, ReactNode } from 'react'

interface BadgeProps {
  variant?: 'allowed' | 'blocked' | 'approval' | 'running' | 'default' | 'amber'
  children: ReactNode
  size?: 'sm' | 'md'
}

const variants = {
  allowed:  'bg-forge-green/10 text-forge-green border border-forge-green/20',
  blocked:  'bg-forge-red/10 text-forge-red border border-forge-red/20',
  approval: 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20',
  running:  'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  default:  'bg-forge-elevated text-forge-secondary border border-forge-border',
  amber:    'bg-forge-amber text-forge-bg border border-forge-amber',
}

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
}

export const Badge: FC<BadgeProps> = ({ variant = 'default', children, size = 'md' }) => (
  <span className={`inline-flex items-center gap-1 rounded-full font-medium tracking-wide ${variants[variant]} ${sizes[size]}`}>
    {children}
  </span>
)
