import { createClient } from '@supabase/supabase-js'

// Using the same database as forgeui3 to ensure twin accounts (direct client connection)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://immfediupemrfpeybslu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbWZlZGl1cGVtcmZwZXlic2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjUyNTYsImV4cCI6MjA4OTEwMTI1Nn0.8o3O9qyJn_yKwIqzl2R_7V5E6zBXX_JRJ_5aX4pMdZo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
