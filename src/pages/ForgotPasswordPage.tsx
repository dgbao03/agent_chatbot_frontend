import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSuccess(false)

    if (!email) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await authService.resetPasswordForEmail(email)
      
      if (error) {
        setError(error)
      } else {
        setIsSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">
          Chat Assistant
        </h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="max-w-md w-full">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
            <p className="text-gray-600">Enter your email to receive a password reset link</p>
          </div>

          {/* Success Message */}
          {isSuccess ? (
            <div className="mb-6 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h3>
                  <p className="text-sm text-gray-700 mb-4">
                    If an account exists with <strong className="text-gray-900">{email}</strong>, you'll receive a password reset link.
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                  <Link
                    to="/login"
                    className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-500"
                    disabled={isSubmitting}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 text-white py-3 rounded-2xl font-medium hover:bg-gray-800 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Remember your password?{' '}
                  <Link to="/login" className="text-gray-900 font-medium hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

