import { Router } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabase'

export const authRouter = Router()

const SignupSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
})

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

authRouter.post('/signup', async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { name, email, password } = parsed.data

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
    email_confirm: true,
  })

  if (error) return res.status(400).json({ error: error.message })

  // Save to users table
  await supabase.from('users').insert({
    id:    data.user.id,
    name,
    email,
    role:  'member',
  })

  const token = jwt.sign(
    { id: data.user.id, email: data.user.email, name },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res.status(201).json({
    token,
    user: { id: data.user.id, email: data.user.email, name },
  })
})

authRouter.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { email, password } = parsed.data

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { id: data.user.id, email: data.user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res.json({
    token,
    user: {
      id:    data.user.id,
      email: data.user.email,
      name:  data.user.user_metadata?.name ?? '',
    },
  })
})