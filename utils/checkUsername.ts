import { supabase } from './supabase'

export async function checkUsername(username: string): Promise<{ 
  available: boolean; 
  error?: string 
}> {
  try {
    // First check if username meets basic requirements
    if (username.length < 6) {
      return { 
        available: false, 
        error: 'Username must be at least 6 characters' 
      }
    }

    // Check if username already exists in database
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)

    if (error) {
      console.error('Database error:', error.message)
      return { 
        available: false, 
        error: 'Error checking username availability' 
      }
    }

    // If we got data back and it has entries, username exists
    if (data && data.length > 0) {
      return { 
        available: false, 
        error: 'This username is already taken' 
      }
    }

    return { available: true }
  } catch (err) {
    console.error('Error checking username:', err)
    return { 
      available: false, 
      error: 'Unable to verify username availability' 
    }
  }
} 