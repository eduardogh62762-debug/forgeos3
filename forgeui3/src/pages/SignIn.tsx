import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SignIn() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setError('Fill in all fields')
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      navigate('/gallery')
    } catch (err: unknown) {
      console.error(err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong')
      }
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--color-bg)' }}>
      <div style={{ width: '45%', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }} className="hidden lg:flex">
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 13, width: 'fit-content' }}>
          <ArrowLeft size={13} /> Home
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="orb-idle" style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
            <div className="orb-active" style={{ width: 36, height: 36, borderRadius: '50%', background: 'radial-gradient(circle, #7c3aed, rgba(124,58,237,0.5))', boxShadow: '0 0 32px rgba(124,58,237,0.25)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--color-white)', fontWeight: 500, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 8 }}>AI Agents. Governed.</p>
            <p style={{ color: 'var(--color-subtle)', fontSize: 13, lineHeight: 1.65, maxWidth: 260 }}>The workspace where AI agents live — governed by ForgeOS3, powered by OpenClaw.</p>
          </div>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 12 }}>TEAM GPT · AI Tinkerers · Durango 2025</p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 360 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 13, marginBottom: 32, padding: 0 }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-white)', letterSpacing: '-0.02em', marginBottom: 6 }}>Welcome back</h1>
            <p style={{ color: 'var(--color-subtle)', fontSize: 13 }}>Sign in to your workspace</p>
          </div>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#f87171', fontSize: 13 }}>
                {error}
              </motion.div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--color-secondary)', marginBottom: 6, fontWeight: 500 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="ui-input" autoComplete="email" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: 'var(--color-secondary)', fontWeight: 500 }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="ui-input" style={{ paddingRight: 44 }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="ui-btn-primary" style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42 }}>
              {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : 'Sign in'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--color-subtle)' }}>
            No account?{' '}<Link to="/signup" style={{ color: 'var(--color-forge)', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}