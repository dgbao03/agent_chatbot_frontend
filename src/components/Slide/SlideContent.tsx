import { useRef, useEffect } from 'react'
import type { PageContent } from '../../types'

interface SlideContentProps {
  pages: PageContent[]
  viewMode: 'slide' | 'code'
  slideScale: number
  onScaleChange: (scale: number) => void
}

export function SlideContent({ pages, viewMode, slideScale, onScaleChange }: SlideContentProps) {
  const slideContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewMode !== 'slide') return

    const calculateScale = () => {
      if (!slideContainerRef.current) return

      const container = slideContainerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      if (containerWidth === 0 || containerHeight === 0) return

      const slideWidth = 1280
      const slideHeight = 720

      const padding = 32
      const scaleX = (containerWidth - padding) / slideWidth
      const scaleY = (containerHeight - padding) / slideHeight

      const newScale = Math.min(scaleX, scaleY, 0.7)
      const finalScale = Math.max(newScale, 0.1)

      if (Math.abs(finalScale - slideScale) > 0.01) {
        onScaleChange(finalScale)
      }
    }

    const timeoutId = setTimeout(calculateScale, 100)
    
    window.addEventListener('resize', calculateScale)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculateScale)
    }
  }, [viewMode, slideScale, onScaleChange])

  return (
    <div 
      ref={slideContainerRef}
      className={`flex-1 bg-gray-100 ${
        viewMode === 'slide' ? 'overflow-y-auto overflow-x-hidden p-8 pb-24' : 'overflow-auto pb-24'
      }`}
    >
      {viewMode === 'slide' ? (
        <div className="flex flex-col items-center gap-8">
          {pages.map((page) => (
            <div 
              key={page.page_number}
              className="bg-white shadow-lg flex-shrink-0"
              style={{
                width: `${1280 * slideScale}px`,
                height: `${720 * slideScale}px`,
              }}
            >
              <iframe
                srcDoc={page.html_content}
                className="w-full h-full border-0"
                title={`HTML Slide ${page.page_number}${page.page_title ? ` - ${page.page_title}` : ''}`}
                style={{
                  width: '1280px',
                  height: '720px',
                  transform: `scale(${slideScale})`,
                  transformOrigin: 'top left',
                }}
                scrolling="no"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full overflow-auto p-6 space-y-6">
          {pages.map((page) => (
            <div key={page.page_number} className="space-y-2">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <div className="text-base font-semibold text-gray-600">
                  Page {page.page_number}{page.page_title && ` - ${page.page_title}`}
                </div>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{page.html_content}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
