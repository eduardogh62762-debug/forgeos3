import { Router } from 'express'
import { supabase } from '../db/supabase'

export const registryRouter = Router()

registryRouter.get('/domain-profiles', async (_req, res) => {
  const { data, error } = await supabase
    .from('domain_profiles')
    .select('*')
    .order('name')
  if (error) return res.status(500).json({ error: 'Failed to fetch domain profiles' })
  res.json(data)
})

registryRouter.get('/tool-packs', async (req, res) => {
  const domain = req.query.domain as string | undefined
  let query = supabase
    .from('tool_packs')
    .select('*, tools:tool_pack_items(*)')
    .order('name')

  if (domain) query = query.eq('domain', domain)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch tool packs' })
  res.json(data)
})

registryRouter.get('/policy-presets', async (_req, res) => {
  const { data, error } = await supabase
    .from('policy_presets')
    .select('*')
    .order('strictness')
  if (error) return res.status(500).json({ error: 'Failed to fetch policy presets' })
  res.json(data)
})

registryRouter.get('/runtime-presets', async (_req, res) => {
  const { data, error } = await supabase
    .from('runtime_presets')
    .select('*')
    .order('name')
  if (error) return res.status(500).json({ error: 'Failed to fetch runtime presets' })
  res.json(data)
})

registryRouter.get('/templates', async (req, res) => {
  const domain = req.query.domain as string | undefined
  let query = supabase
    .from('agent_templates')
    .select('*')
    .order('name')

  if (domain) query = query.eq('default_domain', domain)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: 'Failed to fetch templates' })
  res.json(data)
})