import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Cpu, Archive, Shield, Eye, CheckSquare,
  Settings, Zap, LogOut, GitBranch, RefreshCw, BookOpen,
  ChevronRight, ChevronsLeft, ChevronsRight, Menu, X, Box,
  Skull, Activity
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAgentStore } from '../../store/agentStore'

const PLATFORM = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/builder', icon: Cpu, label: 'Builder' },
  { to: '/registry', icon: Archive, label: 'Registry' },
]

const GOVERNANCE = [
  { to: '/policy', icon: Shield, label: 'Policy' },
  { to: '/gateway', icon: GitBranch, label: 'Tool Gateway' },
  { to: '/loopguard', icon: RefreshCw, label: 'Loop Guard' },
  { to: '/sandbox', icon: Box, label: 'Sandbox' },
  { to: '/attack-simulator', icon: Skull, label: 'Attack Simulator' },
]

const OBSERVABILITY = [
  { to: '/sentinel', icon: Eye, label: 'Sentinel' },
  { to: '/security-pulse', icon: Activity, label: 'Security Pulse' },
  { to: '/audit', icon: BookOpen, label: 'Audit Trail' },
  { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
]

type OpenGroup = 'governance' | 'observability' | null

function NavContent({
  openGroup, toggleGroup, userMenu, setUserMenu, onNavClick, logout, user, navigate,
}: {
  openGroup: OpenGroup
  toggleGroup: (g: OpenGroup) => void
  userMenu: boolean
  setUserMenu: (v: boolean) => void
  onNavClick?: () => void
  logout: () => void
  user: { name?: string; email?: string } | null
  navigate: (to: string) => void
}) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 overflow-y-auto no-scrollbar space-y-0.5">
        <div className="px-3 mb-1 text-[9px] font-bold uppercase tracking-widest text-forge-subtle/50">
          Platform
        </div>
        {PLATFORM.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive
                ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20 font-medium'
                : 'text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated'
              }`}>
            {({ isActive }) => (
              <>
                <Icon size={15} className={isActive ? 'text-forge-amber' : 'text-forge-subtle group-hover:text-forge-secondary'} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-2">
          <button onClick={() => toggleGroup('governance')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-all">
            <span className="text-[9px] font-bold uppercase tracking-widest">Governance</span>
            <ChevronRight size={11}
              className={`transition-transform duration-200 ${openGroup === 'governance' ? 'rotate-90' : ''}`} />
          </button>
          {openGroup === 'governance' && (
            <div className="mt-0.5 space-y-0.5">
              {GOVERNANCE.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={onNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive
                      ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20 font-medium'
                      : 'text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated'
                    }`}>
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'text-forge-amber' : 'text-forge-subtle group-hover:text-forge-secondary'} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div className="pt-1">
          <button onClick={() => toggleGroup('observability')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-all">
            <span className="text-[9px] font-bold uppercase tracking-widest">Observability</span>
            <ChevronRight size={11}
              className={`transition-transform duration-200 ${openGroup === 'observability' ? 'rotate-90' : ''}`} />
          </button>
          {openGroup === 'observability' && (
            <div className="mt-0.5 space-y-0.5">
              {OBSERVABILITY.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={onNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${isActive
                      ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20 font-medium'
                      : 'text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated'
                    }`}>
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'text-forge-amber' : 'text-forge-subtle group-hover:text-forge-secondary'} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-forge-border relative">
        <button
          onClick={() => setUserMenu(!userMenu)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-forge-elevated transition-colors text-left">
          <div className="w-6 h-6 rounded-full bg-forge-amber/20 border border-forge-amber/30 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-forge-amber">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <span className="text-xs text-forge-secondary flex-1 truncate">{user?.email}</span>
          <ChevronRight size={11}
            className={`text-forge-subtle transition-transform duration-200 ${userMenu ? '-rotate-90' : 'rotate-90'}`} />
        </button>

        {userMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-forge-surface border border-forge-border rounded-xl overflow-hidden shadow-lg z-10">
            <button
              onClick={() => { navigate('/dashboard'); setUserMenu(false); onNavClick?.() }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated transition-colors text-left">
              <LayoutDashboard size={14} className="text-forge-subtle" />
              Dashboard
            </button>
            <div className="h-px bg-forge-border" />
            <button
              onClick={() => { navigate('/settings'); setUserMenu(false); onNavClick?.() }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forge-secondary hover:text-forge-primary hover:bg-forge-elevated transition-colors text-left">
              <Settings size={14} className="text-forge-subtle" />
              Settings
            </button>
            <div className="h-px bg-forge-border" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-forge-secondary hover:text-forge-red hover:bg-forge-red/5 transition-colors text-left">
              <LogOut size={14} className="text-forge-subtle" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function ConnectionBadge({ isLive }: { isLive: boolean }) {
  const cfg = isLive
    ? { dot: 'bg-forge-green animate-pulse', text: 'text-forge-green', bg: 'bg-forge-green/5 border-forge-green/15', label: 'OpenClaw · Connected' }
    : { dot: 'bg-forge-red', text: 'text-forge-red', bg: 'bg-forge-red/5 border-forge-red/15', label: 'OpenClaw · Offline' }
  return (
    <div className={`w-full flex items-center gap-2 px-2.5 py-1.5 border rounded-lg ${cfg.bg}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={`text-[11px] font-medium flex-1 text-left ${cfg.text}`}>{cfg.label}</span>
    </div>
  )
}

export function Sidebar() {
  const { logout, user } = useAuthStore()
  const { isLive, checkHealth } = useAgentStore()
  const navigate = useNavigate()
  const [openGroup, setOpenGroup] = useState<OpenGroup>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto health-check every 5s — shows real live status
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 5000)
    return () => clearInterval(interval)
  }, [checkHealth])

  const toggleGroup = (g: OpenGroup) =>
    setOpenGroup(prev => (prev === g ? null : g))

  const sharedProps = {
    openGroup, toggleGroup, userMenu, setUserMenu, logout, user, navigate,
  }

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-forge-bg border-b border-forge-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-forge-amber flex items-center justify-center">
            <Zap size={13} className="text-forge-bg" fill="currentColor" />
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-forge-white tracking-tight hover:text-forge-amber transition-colors">
            ForgeOS<span className="text-forge-amber">3</span>
          </button>
        </div>
        <button onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-colors">
          <Menu size={18} />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] bg-forge-bg border-r border-forge-border flex flex-col h-full">
            <div className="px-5 py-5 border-b border-forge-border flex items-center justify-between">
              <button onClick={() => { navigate('/dashboard'); setMobileOpen(false) }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <div className="w-7 h-7 rounded-lg bg-forge-amber flex items-center justify-center">
                  <Zap size={14} className="text-forge-bg" fill="currentColor" />
                </div>
                <span className="text-sm font-semibold text-forge-white tracking-tight">
                  ForgeOS<span className="text-forge-amber">3</span>
                </span>
              </button>
              <button onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-5 py-2 border-b border-forge-border">
              <ConnectionBadge isLive={isLive} />
            </div>
            <NavContent {...sharedProps} onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <aside className={`hidden lg:flex w-[56px] flex-shrink-0 bg-forge-bg border-r border-forge-border flex-col h-screen sticky top-0 items-center py-4 gap-1 ${collapsed ? '' : 'lg:hidden'}`}
        style={{ display: collapsed ? undefined : 'none' }}>
        <button onClick={() => setCollapsed(false)} title="Expand sidebar"
          className="w-8 h-8 flex items-center justify-center text-forge-subtle hover:text-forge-primary transition-all mb-3 shrink-0">
          <ChevronsRight size={15} />
        </button>
        <NavLink to="/dashboard" title="Dashboard"
          className={({ isActive }) =>
            `w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20' : 'text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated'}`}>
          <LayoutDashboard size={15} />
        </NavLink>
        {PLATFORM.slice(1).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={label}
            className={({ isActive }) =>
              `w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20' : 'text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated'}`}>
            <Icon size={15} />
          </NavLink>
        ))}
        <div className="w-6 h-px bg-forge-border my-1" />
        {GOVERNANCE.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={label}
            className={({ isActive }) =>
              `w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20' : 'text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated'}`}>
            <Icon size={15} />
          </NavLink>
        ))}
        <div className="w-6 h-px bg-forge-border my-1" />
        {OBSERVABILITY.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} title={label}
            className={({ isActive }) =>
              `w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-forge-amber/10 text-forge-amber border border-forge-amber/20' : 'text-forge-subtle hover:text-forge-primary hover:bg-forge-elevated'}`}>
            <Icon size={15} />
          </NavLink>
        ))}
        <div className="mt-auto">
          <button onClick={() => { setCollapsed(false); setUserMenu(true) }} title={user?.email}
            className="w-7 h-7 rounded-full bg-forge-amber/20 border border-forge-amber/30 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-forge-amber">{user?.name?.[0]?.toUpperCase()}</span>
          </button>
        </div>
      </aside>

      <aside className={`hidden lg:flex w-[220px] flex-shrink-0 bg-forge-bg border-r border-forge-border flex-col h-screen sticky top-0 ${collapsed ? 'lg:hidden' : ''}`}
        style={{ display: collapsed ? 'none' : undefined }}>
        <div className="px-5 py-5 border-b border-forge-border">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-forge-amber flex items-center justify-center">
                <Zap size={14} className="text-forge-bg" fill="currentColor" />
              </div>
              <span className="text-sm font-semibold text-forge-white tracking-tight">
                ForgeOS<span className="text-forge-amber">3</span>
              </span>
            </button>
            <button onClick={() => setCollapsed(true)}
              className="text-forge-subtle hover:text-forge-primary transition-colors p-1 rounded-lg hover:bg-forge-elevated">
              <ChevronsLeft size={14} />
            </button>
          </div>
          <div className="mt-3">
            <ConnectionBadge isLive={isLive} />
          </div>
        </div>

        <NavContent {...sharedProps} />
      </aside>
    </>
  )
}
