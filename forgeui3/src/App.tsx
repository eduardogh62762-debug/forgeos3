import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Landing }     from './pages/Landing'
import { SignIn }      from './pages/SignIn'
import { SignUp }      from './pages/SignUp'
import { Gallery }     from './pages/Gallery'
import { AgentCanvas } from './pages/AgentCanvas'

function Protected({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [authed,   setAuthed]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (checking) return null
  return authed ? <>{children}</> : <Navigate to="/signin" replace />
}

import { Toaster } from 'react-hot-toast'
import { CommandPalette } from './components/CommandPalette'

export default function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' } }} />
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/"               element={<Landing />}    />
          <Route path="/signin"         element={<SignIn />}     />
          <Route path="/signup"         element={<SignUp />}     />
          <Route path="/gallery"        element={<Protected><Gallery /></Protected>}     />
          <Route path="/canvas/:domain" element={<Protected><AgentCanvas /></Protected>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}