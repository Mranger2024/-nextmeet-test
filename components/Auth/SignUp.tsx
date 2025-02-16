'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { checkUsername } from '@/utils/checkUsername'
import toast from 'react-hot-toast'

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", 
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", 
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", 
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", 
  "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", 
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", 
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", 
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", 
  "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
  "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", 
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", 
  "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", 
  "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", 
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", 
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", 
  "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", 
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", 
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", 
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", 
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
]

const SignUp = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('other')
  const [country, setCountry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateUsername = async (username: string) => {
    if (username.length < 6) {
      setUsernameError('Username must be at least 6 characters')
      return false
    }

    setIsCheckingUsername(true)
    setUsernameError(null)

    const { available, error } = await checkUsername(username)
    setIsCheckingUsername(false)

    if (error) {
      setUsernameError(error)
      return false
    }

    if (!available) {
      setUsernameError('This username is already taken')
      return false
    }

    setUsernameError(null)
    return true
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setUsername(value)
    
    if (value.length === 0) {
      setUsernameError(null)
    } else if (value.length < 6) {
      setUsernameError('Username must be at least 6 characters')
    } else {
      validateUsername(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // First create the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        // Then create the profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              username,
              display_name: displayName,
              gender,
              country,
              avatar_url: null,
              bio: ''
            }
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error('Failed to create profile')
        }

        toast.success('Account created successfully! Please check your email to verify your account.')
        router.push(`/verify?email=${encodeURIComponent(email)}`)
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      setError(error.message || 'Failed to create account')
      toast.error(error.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
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
            Create Account
          </h2>
          <p className="text-gray-400">
            Join our community
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Choose a unique username (minimum 6 characters)"
              className={`block w-full px-4 py-3 bg-[#1A1C24] border ${
                usernameError ? 'border-red-500' : 'border-gray-800'
              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow shadow-[0_0_8px_rgba(138,137,255,0.05)] focus:shadow-[0_0_12px_rgba(138,137,255,0.15)]`}
              value={username}
              onChange={handleUsernameChange}
              minLength={6}
            />
            {usernameError && (
              <p className="mt-1 text-sm text-red-500">{usernameError}</p>
            )}
            {isCheckingUsername && (
              <p className="mt-1 text-sm text-blue-400">Checking username...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow shadow-[0_0_8px_rgba(138,137,255,0.05)] focus:shadow-[0_0_12px_rgba(138,137,255,0.15)]"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow shadow-[0_0_8px_rgba(138,137,255,0.05)] focus:shadow-[0_0_12px_rgba(138,137,255,0.15)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow shadow-[0_0_8px_rgba(138,137,255,0.05)] focus:shadow-[0_0_12px_rgba(138,137,255,0.15)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Gender
              </label>
              <select
                className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Country
              </label>
              <select
                className="block w-full px-4 py-3 bg-[#1A1C24] border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8A89FF] focus:border-transparent transition-shadow"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] rounded-lg text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)] disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center text-gray-400">
          Already have an account?{' '}
          <Link 
            href="/signin"
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B5CFF] to-[#C76AFF] hover:opacity-80"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUp 