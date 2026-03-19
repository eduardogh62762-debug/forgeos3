import type { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

// Client-safe error messages — never expose Supabase internals
const CLIENT_SAFE: Record<number, string> = {
  400: 'Bad request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict — resource already exists',
  422: 'Unprocessable entity',
  429: 'Too many requests',
  500: 'An unexpected error occurred',
  503: 'Service temporarily unavailable',
}

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log full error internally
  logger.error({
    message:  err.message,
    stack:    err.stack,
    method:   req.method,
    path:     req.path,
    body:     req.body,
  })

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: CLIENT_SAFE[err.statusCode] ?? err.message
    })
    return
  }

  // Never expose raw DB or internal errors to client
  res.status(500).json({ error: CLIENT_SAFE[500] })
}