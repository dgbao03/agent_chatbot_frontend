interface SlideHeaderProps {
  viewMode: 'slide' | 'code'
  onViewModeChange: (mode: 'slide' | 'code') => void
  onDownload: () => void
  onClose: () => void
}

export function SlideHeader({
  viewMode,
  onViewModeChange,
  onDownload,
  onClose
}: SlideHeaderProps) {
  return (
    <div className="flex items-center justify-end px-2 sm:px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Download Button */}
        <button
          onClick={onDownload}
          className="text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
          aria-label="Download slide"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-200 rounded-lg p-0.5 sm:p-1 shadow-sm flex-shrink-0">
          <button
            onClick={() => onViewModeChange('slide')}
            className={`flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${
              viewMode === 'slide'
                ? 'bg-white shadow-sm'
                : 'hover:bg-gray-100'
            }`}
            aria-label="Xem slide"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="round" />
              <circle cx="5.5" cy="5.5" r="0.75" fill="currentColor" />
              <circle cx="8" cy="5.5" r="0.75" fill="currentColor" />
              <circle cx="10.5" cy="5.5" r="0.75" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('code')}
            className={`flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${
              viewMode === 'code'
                ? 'bg-white shadow-sm'
                : 'hover:bg-gray-100'
            }`}
            aria-label="Xem code HTML"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Đóng slide"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

