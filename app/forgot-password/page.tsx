'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Failed to send reset email')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#141522] via-[#0F1117] to-[#080A0F]">
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-transparent bg-clip-text">
            Reset Password
          </h2>
          <p className="text-gray-400">
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm text-center">
              Check your email for password reset instructions
            </div>
          )}

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
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] rounded-lg text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)]"
          >
            Send Reset Link
          </button>

          <div className="text-center">
            <Link 
              href="/signin"
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5CFF] to-[#C76AFF] hover:opacity-80"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 