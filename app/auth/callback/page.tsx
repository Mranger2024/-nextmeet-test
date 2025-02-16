'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select()
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create user profile with data from social login
          const userData = {
            id: user.id,
            username: `user_${Math.random().toString(36).slice(2, 11)}`, // temporary username
            display_name: user.user_metadata.full_name || user.user_metadata.name,
            gender: user.user_metadata.gender || 'other',
            country: user.user_metadata.country || 'US',
            is_online: true
          }

          await supabase.from('users').insert(userData)
        }

        router.push('/?welcome=true')
      }
    }

    handleAuthCallback()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
} 