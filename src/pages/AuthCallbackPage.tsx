import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
// ========== SUPABASE COMMENTED - Migrating to FastAPI ==========
// import { supabase } from '../lib/supabase'
import { authStorage } from '../lib/authStorage'
import { authService } from '../services/auth'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for OAuth errors in URL
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (errorParam) {
      setError(errorDescription || 'Authentication failed')
      // Redirect to login after showing error
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3000)
      return
    }

    // ========== SUPABASE COMMENTED ==========
    // Handle OAuth callback - Supabase automatically processes the hash
    const handleAuthCallback = async () => {
      try {
        // Get session from URL hash (Supabase stores tokens here)
        // const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        const session = await authService.getSession()
        const sessionError = session ? null : new Error('No session')
        
        if (sessionError || !session) {
          setError('Failed to authenticate. Please try again.')
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
          return
        }

        // Session will be set automatically, onAuthStateChange will trigger
        // Wait for auth state to update
        if (!loading) {
          if (isAuthenticated) {
            // Save google as last auth method on successful OAuth
            authStorage.saveLastAuthMethod('google')
            navigate('/chat', { replace: true })
          } else {
            setError('Authentication failed. Please try again.')
            setTimeout(() => {
              navigate('/login', { replace: true })
            }, 3000)
          }
        }
      } catch (err) {
        setError('An error occurred during authentication.')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams, isAuthenticated, loading])

  // Redirect when authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && !error) {
      // Save google as last auth method on successful OAuth
      authStorage.saveLastAuthMethod('google')
      navigate('/chat', { replace: true })
    }
  }, [isAuthenticated, loading, navigate, error])

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <>
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}

