import type { FC, ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary:   'bg-forge-amber text-forge-bg hover:bg-forge-amber-hover font-semibold',
  secondary: 'bg-forge-elevated text-forge-primary border border-forge-line hover:bg-forge-muted/20 hover:border-forge-muted',
  ghost:     'text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated',
  danger:    'bg-forge-red/10 text-forge-red border border-forge-red/20 hover:bg-forge-red/20',
  success:   'bg-forge-green/10 text-forge-green border border-forge-green/20 hover:bg-forge-green/20',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2 rounded-xl',
  lg: 'text-sm px-6 py-3 rounded-xl',
}

export const Button: FC<ButtonProps> = ({
  variant = 'secondary', size = 'md', loading, children, className = '', disabled, ...props
}) => (
  <button
    className={`inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
    {children}
  </button>
)
