import type { FC } from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton: FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-forge-elevated rounded-xl ${className}`} />
)

export const SkeletonCard: FC = () => (
  <div className="p-5 bg-forge-surface border border-forge-border rounded-2xl space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
    <div className="flex gap-2 pt-1">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  </div>
)

export const SkeletonRow: FC = () => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-forge-border/40">
    <Skeleton className="w-6 h-6 rounded-full shrink-0" />
    <Skeleton className="h-3 w-28" />
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-3 w-16 ml-auto" />
  </div>
)

export const SkeletonMetric: FC = () => (
  <div className="p-5 bg-forge-surface border border-forge-border rounded-2xl space-y-3">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-32" />
  </div>
)

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export const ErrorBanner: FC<ErrorBannerProps> = ({ message, onRetry }) => (
  <div className="flex items-center justify-between px-5 py-4 bg-forge-red/8 border border-forge-red/20 rounded-2xl">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-forge-red shrink-0" />
      <span className="text-sm text-forge-red">{message}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs text-forge-red border border-forge-red/30 px-3 py-1.5 rounded-lg hover:bg-forge-red/10 transition-colors">
        Retry
      </button>
    )}
  </div>
)

// ─── Spinner ───────────────────────────────────────────────────────────────

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }
const spinnerSizes = { sm: 'w-3.5 h-3.5 border-2', md: 'w-5 h-5 border-2', lg: 'w-8 h-8 border-[3px]' }
export const Spinner: FC<SpinnerProps> = ({ size = 'md', className = '' }) => (
  <span className={`inline-block rounded-full border-forge-muted border-t-forge-amber animate-spin ${spinnerSizes[size]} ${className}`}
    role="status" aria-label="Cargando..." />
)

// ─── ErrorState ────────────────────────────────────────────────────────────

interface ErrorStateProps { message: string; onRetry?: () => void }
export const ErrorState: FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <div className="w-10 h-10 rounded-full bg-forge-red/10 border border-forge-red/20 flex items-center justify-center">
      <span className="text-forge-red text-lg font-bold">!</span>
    </div>
    <p className="text-sm text-forge-subtle text-center max-w-xs">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs text-forge-amber underline underline-offset-2 hover:opacity-80 transition-colors">
        Reintentar
      </button>
    )}
  </div>
)
