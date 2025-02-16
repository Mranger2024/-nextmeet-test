import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://shrcmfucebizlfxkuest.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNocmNtZnVjZWJpemxmeGt1ZXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxNjYwNzYsImV4cCI6MjA1NDc0MjA3Nn0.jKtC9HfcH61yyIRiciHNU5hV39N4rYi3HOrGP3cl_Wg'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
}) 