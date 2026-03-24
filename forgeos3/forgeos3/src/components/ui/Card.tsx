import type { FC, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  amber?: boolean
}

export const Card: FC<CardProps> = ({ children, className = '', hover, amber }) => (
  <div className={`bg-forge-surface border rounded-2xl transition-all duration-200 ${amber ? 'border-forge-amber/30 shadow-amber' : 'border-forge-border'} ${hover ? 'hover:border-forge-line hover:bg-forge-elevated cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
)
