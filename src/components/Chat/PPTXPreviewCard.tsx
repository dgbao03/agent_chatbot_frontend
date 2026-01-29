import type { PageContent } from '../../types'

interface PPTXPreviewCardProps {
  pages: PageContent[]
  slideId?: string
  onViewSlide: () => void
}

export function PPTXPreviewCard({ onViewSlide }: PPTXPreviewCardProps) {
  return (
    <div className="mt-4">
      <div 
        className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl p-4 border border-gray-400 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={onViewSlide}
      >
        <div className="flex items-center gap-4">
          {/* PPT Icon */}
          <div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">PPT</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex items-center justify-start">
            <button className="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Click here to view
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

