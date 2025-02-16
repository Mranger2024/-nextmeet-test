import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
if (!supabaseKey) throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single()
    if (error) throw error
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}

export const testEmailSettings = async (email: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    
    if (error) throw error
    return { success: true, message: 'Test email sent successfully' }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// Add these provider configurations
export const socialProviders = {
  google: {
    enabled: true,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
  facebook: {
    enabled: true,
    clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
  },
  github: {
    enabled: true,
    clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
  },
  azure: {
    enabled: true,
    clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID,
  },
}

// Add this function to handle new user signup
export const handleSignup = async (user: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          username: '',
          display_name: '',
          avatar_url: null,
          gender: 'other',
          country: '',
          bio: ''
        }
      ])
    
    if (error) throw error
  } catch (error) {
    console.error('Error creating profile:', error)
    throw error
  }
} 