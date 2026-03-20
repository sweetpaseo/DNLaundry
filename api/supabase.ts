import { createClient } from '@supabase/supabase-js'
import { env } from 'hono/adapter'

export const getSupabase = (c: any) => {
  const allEnv = env(c)
  
  const url = allEnv.SUPABASE_URL || 
              allEnv.VITE_SUPABASE_URL || 
              (typeof process !== 'undefined' ? (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) : undefined)
              
  const key = allEnv.SUPABASE_ANON_KEY || 
              allEnv.VITE_SUPABASE_ANON_KEY || 
              (typeof process !== 'undefined' ? (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) : undefined)
  
  if (!url || !key) {
    throw new Error(`Supabase credentials missing. URL: ${!!url}, Key: ${!!key}`)
  }
  
  return createClient(url, key)
}
