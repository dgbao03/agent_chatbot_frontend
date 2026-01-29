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

  // Tính toán scale động cho slide để fit vào container
  useEffect(() => {
    // Chỉ tính scale khi ở slide view mode
    if (viewMode !== 'slide') return

    const calculateScale = () => {
      if (!slideContainerRef.current) return

      const container = slideContainerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      // Nếu container chưa có kích thước, không tính toán
      if (containerWidth === 0 || containerHeight === 0) return

      // Kích thước gốc của slide
      const slideWidth = 1280
      const slideHeight = 720

      // Tính scale để fit cả chiều ngang và dọc, trừ đi một chút padding
      const padding = 32 // 16px mỗi bên
      const scaleX = (containerWidth - padding) / slideWidth
      const scaleY = (containerHeight - padding) / slideHeight

      // Chọn scale nhỏ hơn để đảm bảo fit cả 2 chiều
      const newScale = Math.min(scaleX, scaleY, 0.7) // Giới hạn tối đa 0.7 để không quá lớn
      const finalScale = Math.max(newScale, 0.1) // Đảm bảo scale tối thiểu là 0.1

      // Chỉ update nếu scale thay đổi đáng kể (tránh re-render liên tục)
      if (Math.abs(finalScale - slideScale) > 0.01) {
        onScaleChange(finalScale)
      }
    }

    // Delay nhỏ để đảm bảo DOM đã render
    const timeoutId = setTimeout(calculateScale, 100)
    
    // Tính lại khi window resize
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
        viewMode === 'slide' ? 'overflow-y-auto overflow-x-hidden p-8' : 'overflow-auto'
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
              {/* Page Header - Khung riêng */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <div className="text-base font-semibold text-gray-600">
                  Page {page.page_number}{page.page_title && ` - ${page.page_title}`}
                </div>
              </div>
              
              {/* Code Content - Khung riêng */}
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

