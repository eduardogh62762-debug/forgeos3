import type { FC } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export const Toggle: FC<ToggleProps> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-3 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${checked ? 'bg-forge-amber' : 'bg-forge-muted'}`}
      style={{ height: '22px' }}
    >
      <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
        style={{ width: '18px', height: '18px' }} />
    </div>
    {label && <span className="text-sm text-forge-secondary">{label}</span>}
  </label>
)
