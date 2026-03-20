import { createClient } from '@supabase/supabase-js'
import { env } from 'hono/adapter'

export const getSupabase = (c: any) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env(c)
  
  const url = SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined)
  const key = SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined)
  
  if (!url || !key) {
    throw new Error(`Supabase credentials missing. URL: ${!!url}, Key: ${!!key}`)
  }
  
  return createClient(url, key)
}
