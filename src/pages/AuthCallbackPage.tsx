import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authStorage } from '../lib/authStorage'
import { tokenStorage } from '../lib/tokenStorage'
import { authApi } from '../services/authApi'
import { emitAuthSessionUpdated } from '../contexts/AuthContext'

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: 'Google sign-in failed.',
  user_info_failed: 'Unable to retrieve information from Google.',
  missing_user_data: 'Missing user data.',
  user_creation_failed: 'Unable to create account.',
  unexpected_error: 'An error occurred. Please try again.',
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || 'Sign-in failed.')
      setTimeout(() => navigate('/login', { replace: true }), 3000)
      return
    }

    const accessToken = searchParams.get('access_token')

    if (!accessToken) {
      setError('Missing authentication credentials.')
      setTimeout(() => navigate('/login', { replace: true }), 3000)
      return
    }

    const handleCallback = async () => {
      try {
        const { user, error: meError } = await authApi.getMe(accessToken)
        if (meError || !user) {
          setError('Unable to retrieve user information.')
          setTimeout(() => navigate('/login', { replace: true }), 3000)
          return
        }

        tokenStorage.setStoredSession({
          access_token: accessToken,
          user,
        })
        authStorage.saveLastAuthMethod('google')
        emitAuthSessionUpdated()
        navigate('/chat', { replace: true })
      } catch {
        setError('An error occurred.')
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      }
    }

    handleCallback()
  }, [navigate, searchParams])

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
            <p className="text-gray-600">Completing sign-in...</p>
          </>
        )}
      </div>
    </div>
  )
}
