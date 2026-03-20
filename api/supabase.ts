import { createClient } from '@supabase/supabase-js'

export const getSupabase = (env: any) => {
  const url = env?.SUPABASE_URL || (typeof process !== 'undefined' ? process.env.SUPABASE_URL : undefined)
  const key = env?.SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.SUPABASE_ANON_KEY : undefined)
  
  if (!url || !key) {
    throw new Error(`Supabase credentials missing. URL: ${!!url}, Key: ${!!key}`)
  }
  
  return createClient(url, key)
}
