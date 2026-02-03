import { useEffect, useState } from 'react'

interface ErrorBannerProps {
  message: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function ErrorBanner({ 
  message, 
  onClose, 
  autoClose = false,
  autoCloseDelay = 5000 
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) {
          onClose()
        }
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDelay, isVisible, onClose])

  if (!isVisible) return null

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
        <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[600px]">
        {/* Warning Icon */}
        <svg 
          className="w-5 h-5 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        
        {/* Error Message */}
        <p className="flex-1 text-sm font-medium">{message}</p>
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            className="flex-shrink-0 p-1 hover:bg-red-700 rounded transition-colors"
            aria-label="Close"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
        </div>
      </div>
    </>
  )
}

