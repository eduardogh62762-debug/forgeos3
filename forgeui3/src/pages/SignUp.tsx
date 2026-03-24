import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SignUp() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return setError('Fill in all fields')
    if (password !== confirm)         return setError('Passwords do not match')
    if (password.length < 6)          return setError('Password must be at least 6 characters')
    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { name } }
      })
      if (err) throw err
      navigate('/gallery')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create account')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: 'var(--color-bg)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 360 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', fontSize: 13, marginBottom: 32, padding: 0 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-forge)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>F</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--color-white)', letterSpacing: '-0.02em' }}>Forge<span style={{ color: 'var(--color-forge)' }}>UI</span>3</span>
        </div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-white)', letterSpacing: '-0.02em', marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--color-subtle)', fontSize: 13 }}>Start working with governed AI agents</p>
        </div>
        <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#f87171', fontSize: 13 }}>
              {error}
            </motion.div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-secondary)', marginBottom: 6, fontWeight: 500 }}>Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="ui-input" autoComplete="name" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--color-secondary)', marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="ui-input" autoComplete="email" />
          </div>
          {[
            { label: 'Password',         val: password, set: setPassword, toggle: true  },
            { label: 'Confirm password', val: confirm,  set: setConfirm,  toggle: false },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--color-secondary)', marginBottom: 6, fontWeight: 500 }}>{f.label}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder="••••••••" className="ui-input" style={{ paddingRight: f.toggle ? 44 : 14 }} />
                {f.toggle && (
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-subtle)', display: 'flex', padding: 0 }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading} className="ui-btn-primary" style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42 }}>
            {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : 'Create account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--color-subtle)' }}>
          Already have an account?{' '}<Link to="/signin" style={{ color: 'var(--color-forge)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}