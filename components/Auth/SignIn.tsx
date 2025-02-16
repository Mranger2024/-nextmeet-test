'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Provider } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase'

const SignIn = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/video-chat')
      }
    }
    
    checkUser()
  }, [router])

  const handleSocialLogin = async (provider: Provider) => {
    try {
      setError(null)
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/video-chat`
        }
      })

      if (error) {
        setError(error.message)
        return
      }
    } catch (err) {
      console.error(err)
      setError('Failed to sign in with social provider')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data?.user) {
        // Get user profile to verify account
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          setError('Error fetching user profile')
          return
        }

        if (!profile) {
          setError('User profile not found')
          return
        }

        router.push('/video-chat')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#141522] via-[#0F1117] to-[#080A0F]">
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-transparent bg-clip-text">
            Welcome Back
          </h2>
          <p className="text-gray-400">
            Sign in to your account
          </p>
        </div>

        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg text-gray-800 transition-all shadow-[0_0_10px_rgba(138,137,255,0.1)] hover:shadow-[0_0_16px_rgba(138,137,255,0.2)]"
            onClick={() => handleSocialLogin('google')}
            type="button"
          >
            <Image src="/google.svg" alt="Google" width={20} height={20} />
            Continue with Google
          </button>

          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#1864F2] rounded-lg text-white transition-all shadow-[0_0_10px_rgba(24,119,242,0.3)] hover:shadow-[0_0_16px_rgba(24,119,242,0.4)]"
            onClick={() => handleSocialLogin('facebook')}
            type="button"
          >
            <Image src="/facebook.svg" alt="Facebook" width={20} height={20} />
            Continue with Facebook
          </button>

          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#24292F] hover:bg-[#2C3238] rounded-lg text-white transition-all shadow-[0_0_10px_rgba(36,41,47,0.3)] hover:shadow-[0_0_16px_rgba(36,41,47,0.4)]"
            onClick={() => handleSocialLogin('github')}
            type="button"
          >
            <Image src="/github.svg" alt="GitHub" width={20} height={20} />
            Continue with GitHub
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#0F1117] text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleEmailLogin}>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <div className="mt-1 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#5B5CFF] to-[#C76AFF] hover:opacity-80"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] rounded-lg text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-gray-400">
          Don't have an account?{' '}
          <Link 
            href="/signup"
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5CFF] to-[#C76AFF] hover:opacity-80"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignIn 