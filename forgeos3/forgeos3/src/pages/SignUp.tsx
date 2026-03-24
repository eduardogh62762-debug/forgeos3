import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, User, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const PERKS = [
  'Policy Engine with allow / block / approval',
  'OpenClaw runtime adapter — live',
  'Sentinel Studio with full audit trail',
  'Loop Guard for runaway protection',
]

export function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signup } = useAuthStore()
  const navigate = useNavigate()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return setError('Please fill in all fields')
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true); setError('')
    try { await signup(name, email, password); navigate('/dashboard') }
    catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex overflow-hidden">

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-forge-border overflow-hidden">
        <div className="fixed inset-0 w-1/2 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(var(--color-forge-border) 1px,transparent 1px),linear-gradient(90deg,var(--color-forge-border) 1px,transparent 1px)', backgroundSize: '48px 48px', opacity: 0.5 }} />
        <div className="fixed top-1/3 left-1/4 w-80 h-80 pointer-events-none"
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
            <div className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold mb-3">
              OpenClaw Hackathon MVP
            </div>
            <h2 className="text-3xl font-bold text-forge-white leading-tight mb-3">
              Start governing<br />your AI agents.
            </h2>
            <p className="text-sm text-forge-secondary leading-relaxed max-w-sm">
              ForgeOS3 is the infrastructure layer that makes AI agents safe, auditable, and production-ready — across any runtime.
            </p>
          </div>

          <div className="space-y-3">
            {PERKS.map((p, i) => (
              <motion.div key={p} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3">
                <CheckCircle size={14} className="text-amber-500 shrink-0" />
                <span className="text-sm text-forge-secondary">{p}</span>
              </motion.div>
            ))}
          </div>

          <div className="p-4 bg-forge-surface border border-forge-border rounded-2xl">
            <div className="text-[10px] uppercase tracking-widest text-forge-subtle mb-2 font-semibold">Runtime</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center">
                <Zap size={11} className="text-black" fill="currentColor" />
              </div>
              <span className="text-sm font-semibold text-forge-white">OpenClaw</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-semibold">Live</span>
              </div>
            </div>
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
            <h1 className="text-2xl font-bold text-forge-white mb-1.5">Create account</h1>
            <p className="text-sm text-forge-subtle">Start governing AI agents today</p>
          </div>

          <form onSubmit={handle} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-xs text-red-500">
                {error}
              </motion.div>
            )}

            {[
              { label: 'Full name',        icon: User, value: name,     set: setName,     type: 'text',     placeholder: 'Your name',        end: null },
              { label: 'Email',            icon: Mail, value: email,    set: setEmail,    type: 'email',    placeholder: 'you@company.com',  end: null },
              { label: 'Password',         icon: Lock, value: password, set: setPassword, type: showPass ? 'text' : 'password', placeholder: '••••••••', end: 'toggle' },
              { label: 'Confirm password', icon: Lock, value: confirm,  set: setConfirm,  type: showPass ? 'text' : 'password', placeholder: '••••••••', end: null },
            ].map(({ label, icon: Icon, value, set, type, placeholder, end }) => (
              <div key={label} className="space-y-1.5">
                <label className="text-xs font-medium text-forge-secondary">{label}</label>
                <div className="relative">
                  <Icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-subtle" />
                  <input type={type} value={value} onChange={e => set(e.target.value)}
                    placeholder={placeholder} className={`forge-input forge-input-icon-left ${end === 'toggle' ? 'forge-input-icon-both' : ''}`} />
                  {end === 'toggle' && (
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-forge-subtle hover:text-forge-secondary transition-colors">
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-400 text-black font-bold py-3 rounded-xl hover:bg-amber-300 transition-all text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(245,158,11,0.25)' }}>
              {loading
                ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                : <><span>Create Account</span><ArrowRight size={14} /></>
              }
            </button>
          </form>

          <p className="text-center text-xs text-forge-subtle mt-6">
            Already have an account?{' '}
            <Link to="/signin" className="text-amber-500 hover:text-amber-400 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}