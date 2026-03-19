import type { FC, ReactNode } from 'react'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export const TopBar: FC<TopBarProps> = ({ title, subtitle, actions }) => (
  <div className="flex items-center justify-between px-8 py-5 border-b border-forge-border bg-forge-bg/80 backdrop-blur-sm sticky top-0 z-10">
    <div>
      <h1 className="text-lg font-semibold text-forge-white">{title}</h1>
      {subtitle && <p className="text-sm text-forge-subtle mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-3">{actions}</div>}
  </div>
)
