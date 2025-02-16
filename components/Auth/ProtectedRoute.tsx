'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter()

  useEffect(() => {
    // Add your authentication check logic here
    // For example, check if user is logged in
    const isAuthenticated = false // Replace with your auth check
    
    if (!isAuthenticated) {
      router.push('/signin')
    }
  }, [router])

  return <>{children}</>
}

export default ProtectedRoute 