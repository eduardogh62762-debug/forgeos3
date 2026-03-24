import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabase'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name?: string }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = header.split(' ')[1]
  
  // Allow server-to-server agent communication
  if (process.env.AGENT_API_KEY && token === process.env.AGENT_API_KEY) {
    req.user = { id: 'agent-system', email: 'agent@forgeos3.dev' }
    return next()
  }

  try {
    // 1. Try Supabase Auth (twin-frontend architecture)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (user && !error) {
       req.user = { 
         id: user.id, 
         email: user.email || '', 
         name: user.user_metadata?.name 
       }
       return next()
    }

    // 2. Fallback strictly to internal JWT for API processes
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; name?: string }
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token. Authentication failed.' })
  }
}