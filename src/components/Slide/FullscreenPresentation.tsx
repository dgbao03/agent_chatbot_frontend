import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { PageContent, VersionInfo } from '../../types'

interface FullscreenPresentationProps {
  pages: PageContent[]
  currentSlideIndex: number
  onSlideChange: (index: number) => void
  onExit: () => void
  versions?: VersionInfo[]
  currentVersion?: number | null
  onVersionChange?: (version: number) => void
}

export function FullscreenPresentation({
  pages,
  currentSlideIndex,
  onSlideChange,
  onExit,
  versions: _versions,
  currentVersion: _currentVersion,
  onVersionChange: _onVersionChange
}: FullscreenPresentationProps) {
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
          setIsFullscreen(true)
        } else {
          // Fallback: Custom fullscreen overlay
          setIsFullscreen(true)
        }
      } catch (error) {
        console.error('Error entering fullscreen:', error)
        // Fallback to custom overlay
        setIsFullscreen(true)
      }
    }

    enterFullscreen()

    // Listen to fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
      if (!isCurrentlyFullscreen) {
        onExit()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    }
  }, [onExit])

  // Exit fullscreen on unmount
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    if (isFullscreen) {
      window.addEventListener('mousemove', handleMouseMove)
      // Initial timeout
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isFullscreen])

  const handleExit = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error)
    }
    onExit()
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (currentSlideIndex > 0) {
            onSlideChange(currentSlideIndex - 1)
          }
          break
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault()
          if (currentSlideIndex < pages.length - 1) {
            onSlideChange(currentSlideIndex + 1)
          }
          break
        case 'Escape':
          e.preventDefault()
          handleExit()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, currentSlideIndex, pages.length, onSlideChange])

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1)
    }
  }

  const handleNextSlide = () => {
    if (currentSlideIndex < pages.length - 1) {
      onSlideChange(currentSlideIndex + 1)
    }
  }

  if (!isFullscreen) return null

  const currentPage = pages[currentSlideIndex]
  if (!currentPage) return null

  // Calculate scale to fit screen (contain strategy - show full slide, no cropping)
  const slideWidth = 1280
  const slideHeight = 720
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  // Use Math.min to ensure entire slide is visible (may have small borders but no cropping)
  // Leave some padding for controls (90% of height, 95% of width)
  const scaleX = (windowWidth * 0.95) / slideWidth
  const scaleY = (windowHeight * 0.9) / slideHeight
  const scale = Math.min(scaleX, scaleY) // Scale to fit, can scale up if screen is larger

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center overflow-hidden"
    >
      {/* Slide Container */}
      <div
        className="bg-white flex-shrink-0"
        style={{
          width: `${slideWidth}px`,
          height: `${slideHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <iframe
          srcDoc={currentPage.html_content}
          className="w-full h-full border-0"
          title={`Slide ${currentPage.page_number}`}
          scrolling="no"
        />
      </div>

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Exit Button - Top Right */}
        <button
          onClick={handleExit}
          className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white pointer-events-auto transition-colors"
          aria-label="Exit fullscreen"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Navigation Controls - Bottom Center */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 pointer-events-auto">
          {/* Previous Button */}
          <button
            onClick={handlePrevSlide}
            disabled={currentSlideIndex === 0}
            className="p-3 bg-black/50 hover:bg-black/70 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Slide Counter */}
          <div className="px-4 py-2 bg-black/50 rounded-lg text-white text-sm font-medium">
            Slide {currentSlideIndex + 1}/{pages.length}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextSlide}
            disabled={currentSlideIndex === pages.length - 1}
            className="p-3 bg-black/50 hover:bg-black/70 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

