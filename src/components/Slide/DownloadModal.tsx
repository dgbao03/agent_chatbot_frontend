import { createPortal } from 'react-dom'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DownloadOption {
  id: string
  title: string
  iconColor: string
  comingSoon: boolean
}

const downloadOptions: DownloadOption[] = [
  {
    id: 'pptx',
    title: 'PPTX',
    iconColor: 'bg-red-500',
    comingSoon: true
  },
  {
    id: 'pdf',
    title: 'PDF',
    iconColor: 'bg-red-500',
    comingSoon: true
  },
  {
    id: 'html',
    title: 'HTML',
    iconColor: 'bg-blue-500',
    comingSoon: true
  },
  {
    id: 'google-slides',
    title: 'Google Slides',
    iconColor: 'bg-yellow-500',
    comingSoon: true
  }
]

export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-[480px] p-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pr-8">
          Select Download Format
        </h2>
        
        {/* Download Options */}
        <div className="space-y-2">
          {downloadOptions.map((option) => (
            <div
              key={option.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Icon */}
              <div className={`w-10 h-10 ${option.iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {option.id === 'google-slides' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ) : (
                  <span className="text-white font-bold text-xs">{option.title}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900">{option.title}</h3>
                  {option.comingSoon && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              {/* Download Button */}
              <button
                disabled
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed flex-shrink-0"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

