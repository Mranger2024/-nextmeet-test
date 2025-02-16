'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function ResetPassword() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setError(error.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/signin')
      }, 2000)
    } catch (err) {
      console.error('Password update error:', err)
      setError('Failed to update password')
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
            Enter your new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm text-center">
              Password updated successfully! Redirecting to login...
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] rounded-lg text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)]"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
} 