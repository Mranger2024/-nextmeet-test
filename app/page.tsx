'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsLoggedIn(!!session)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#141522] via-[#0F1117] to-[#080A0F]">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-transparent bg-clip-text">
                NEXTMEET
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/safety" className="text-gray-300 hover:text-white transition-colors">
                Safety
              </Link>
              <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                About
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              {isLoggedIn ? (
                <button
                  onClick={() => router.push('/video-chat')}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)]"
                >
                  Start Chat
                </button>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/signin')}
                    className="px-6 py-2.5 rounded-lg text-white font-medium hover:text-gray-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => router.push('/signup')}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-white font-medium transition-all hover:shadow-[0_0_16px_rgba(138,137,255,0.3)] shadow-[0_0_8px_rgba(138,137,255,0.2)]"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-8"
          >
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-transparent bg-clip-text">
              Most Advanced Random
              <br />
              Video Chat Platform
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect with people worldwide through high-quality video chat. Experience real
              conversations with advanced matching algorithms and premium features.
            </p>

            <div className="flex items-center justify-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(isLoggedIn ? '/video-chat' : '/signin')}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-white font-medium text-lg transition-all hover:shadow-[0_0_24px_rgba(138,137,255,0.3)] shadow-[0_0_12px_rgba(138,137,255,0.2)]"
              >
                Start Chatting Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/features')}
                className="px-8 py-4 rounded-full bg-gray-800/50 text-white font-medium text-lg transition-all hover:bg-gray-800/70 backdrop-blur-sm"
              >
                Explore Features
              </motion.button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="p-8 rounded-2xl bg-gray-800/30 backdrop-blur-sm border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">HD Video Quality</h3>
              <p className="text-gray-400">
                Crystal clear video and audio quality for the best chat experience.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-800/30 backdrop-blur-sm border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Smart Matching</h3>
              <p className="text-gray-400">
                Advanced algorithms to connect you with like-minded people.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-800/30 backdrop-blur-sm border border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Secure & Private</h3>
              <p className="text-gray-400">
                End-to-end encryption and advanced privacy controls for safe chatting.
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-[#4F4FFF] via-[#845EFF] to-[#A455FF] text-transparent bg-clip-text">
                  NEXTMEET
                </span>
              </Link>
              <p className="text-gray-400 text-sm">
                The most advanced random video chat platform connecting people worldwide.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-gray-400 hover:text-white text-sm">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="text-gray-400 hover:text-white text-sm">
                    Safety
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white text-sm">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/help" className="text-gray-400 hover:text-white text-sm">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-white mb-4">Connect</h3>
              <div className="flex space-x-4">
                <Link 
                  href="https://twitter.com" 
                  target="_blank"
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link 
                  href="https://github.com" 
                  target="_blank"
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} NEXTMEET. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
