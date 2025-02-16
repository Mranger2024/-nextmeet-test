'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    const email = searchParams.get('email')
    if (email) {
      setEmail(email)
    }

    // Start resend timer
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [searchParams])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    
    if (code.length !== 6) {
      setError('Please enter the complete verification code')
      return
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email!,
        token: code,
        type: 'signup'
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/signin')
    } catch (err) {
      console.error(err)
      setError('Failed to verify code')
    }
  }

  const handleResendOTP = async () => {
    if (!canResend || !email) return

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        setError(error.message)
        return
      }

      setCanResend(false)
      setResendTimer(30)
    } catch (err) {
      console.error(err)
      setError('Failed to resend verification code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#141522] via-[#0F1117] to-[#080A0F]">
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-transparent bg-clip-text">
            Verify Your Email
          </h2>
          <p className="text-gray-400">
            Enter the verification code sent to {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow shadow-[0_0_8px_rgba(138,137,255,0.05)] focus:shadow-[0_0_12px_rgba(138,137,255,0.15)]"
              />
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] rounded-lg text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)]"
          >
            Verify Email
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canResend 
                ? 'Resend Code' 
                : `Resend code in ${resendTimer}s`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 