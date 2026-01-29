import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Wait for auth state to be determined
    if (!loading) {
      if (isAuthenticated) {
        // Email confirmed and user is authenticated, redirect to chat
        navigate('/chat', { replace: true })
      } else {
        // Something went wrong, redirect to login
        navigate('/login', { replace: true })
      }
    }
  }, [isAuthenticated, loading, navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    </div>
  )
}

