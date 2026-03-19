import { Router } from 'express'
import { supabase } from '../db/supabase'

export const auditRouter = Router()

// GET /api/audit — paginated with filters
auditRouter.get('/', async (req, res) => {
  const limit      = Math.min(parseInt(req.query.limit  as string) || 50, 200)
  const offset     = parseInt(req.query.offset as string) || 0
  const domain     = req.query.domain     as string | undefined
  const eventType  = req.query.event_type as string | undefined
  const runId      = req.query.run_id     as string | undefined
  const from       = req.query.from       as string | undefined
  const to         = req.query.to         as string | undefined

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (domain)    query = query.eq('domain', domain)
  if (eventType) query = query.eq('event_type', eventType)
  if (runId)     query = query.eq('run_id', runId)
  if (from)      query = query.gte('created_at', from)
  if (to)        query = query.lte('created_at', to)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch audit log' })
  res.json({ data, total: count, limit, offset })
})

// GET /api/audit/run/:runId — all events for a specific run
auditRouter.get('/run/:runId', async (req, res) => {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('run_id', req.params.runId)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: 'Failed to fetch run audit' })
  res.json(data)
})

// GET /api/audit/summary — counts by event type and domain
auditRouter.get('/summary', async (_req, res) => {
  const { data, error } = await supabase
    .from('audit_log')
    .select('event_type, domain, created_at')

  if (error) return res.status(500).json({ error: 'Failed to fetch audit summary' })

  const byType:   Record<string, number> = {}
  const byDomain: Record<string, number> = {}

  for (const row of data ?? []) {
    byType[row.event_type]  = (byType[row.event_type]  || 0) + 1
    if (row.domain) {
      byDomain[row.domain]  = (byDomain[row.domain] || 0) + 1
    }
  }

  res.json({ byType, byDomain, total: data?.length ?? 0 })
})

// GET /api/audit/export — CSV export
auditRouter.get('/export', async (req, res) => {
  const domain    = req.query.domain     as string | undefined
  const eventType = req.query.event_type as string | undefined

  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (domain)    query = query.eq('domain', domain)
  if (eventType) query = query.eq('event_type', eventType)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: 'Failed to export audit log' })

  const rows = data ?? []
  const headers = ['id', 'event_type', 'run_id', 'agent_id', 'domain', 'data', 'created_at']
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const val = r[h as keyof typeof r]
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')
        return `"${str.replace(/"/g, '""')}"`
      }).join(',')
    )
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="forgeos3-audit-${Date.now()}.csv"`)
  res.send(csv)
})