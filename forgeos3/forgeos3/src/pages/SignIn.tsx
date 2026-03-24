import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setError('Please fill in all fields')
    setLoading(true); setError('')
    try { await login(email, password); navigate('/dashboard') }
    catch { setError('Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex overflow-hidden">

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-forge-border overflow-hidden">
        <div className="fixed inset-0 w-1/2 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(var(--color-forge-border) 1px,transparent 1px),linear-gradient(90deg,var(--color-forge-border) 1px,transparent 1px)', backgroundSize: '48px 48px', opacity: 0.5 }} />
        <div className="fixed top-1/4 left-1/4 w-96 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)' }} />

        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 text-[11px] text-forge-subtle hover:text-forge-primary transition-colors">
            ← Home
          </Link>
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(245,158,11,0.35)' }}>
            <Zap size={13} className="text-black" fill="currentColor" />
          </div>
          <span className="text-sm font-bold text-forge-white tracking-tight">ForgeOS<span className="text-amber-500">3</span></span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-forge-white leading-tight mb-3">
              Governance for<br />every agent runtime.
            </h2>
            <p className="text-sm text-forge-secondary leading-relaxed max-w-sm">
              Policy enforcement, tool control, human approvals, and full observability — built for production AI agents.
            </p>
          </div>

          {/* Mini sentinel preview */}
          <div className="bg-forge-surface border border-forge-border rounded-2xl overflow-hidden max-w-sm">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forge-border bg-forge-elevated/50">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono text-forge-subtle">sentinel · run-002</span>
            </div>
            {[
              { tool: 'classify',      d: 'allowed',  c: 'text-emerald-500' },
              { tool: 'route',         d: 'allowed',  c: 'text-emerald-500' },
              { tool: 'write_external',d: 'approval', c: 'text-amber-500'   },
            ].map((e, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-forge-border/40 last:border-0">
                <code className="text-[11px] text-amber-500 font-mono">{e.tool}</code>
                <span className={`text-[10px] font-semibold ${e.c}`}>{e.d}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-forge-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            OpenClaw · Connected · MVP live
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-forge-subtle">
          AI Tinkerers Hackathon · Durango, MX 2025
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center justify-between mb-10 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
                <Zap size={13} className="text-black" fill="currentColor" />
              </div>
              <span className="text-sm font-bold text-forge-white">ForgeOS<span className="text-amber-500">3</span></span>
            </div>
            <Link to="/" className="text-[11px] text-forge-subtle hover:text-forge-primary transition-colors">← Home</Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-forge-white mb-1.5">Welcome back</h1>
            <p className="text-sm text-forge-subtle">Sign in to your ForgeOS3 console</p>
          </div>

          <form onSubmit={handle} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-xs text-red-500">
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-forge-secondary">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-subtle" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" className="forge-input forge-input-icon-left" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-forge-secondary">Password</label>
                <button type="button" className="text-[11px] text-amber-500 hover:text-amber-400 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-subtle" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="forge-input forge-input-icon-both" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forge-subtle hover:text-forge-secondary transition-colors">
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-all text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(245,158,11,0.25)' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <><span>Sign In</span><ArrowRight size={14} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-forge-subtle mt-6">
            No account?{' '}
            <Link to="/signup" className="text-amber-500 hover:text-amber-400 transition-colors font-medium">
              Get started free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}