import { useState } from 'react'
import type { PageContent, VersionInfo } from '../../types'
import { SlideHeader } from './SlideHeader'
import { SlideContent } from './SlideContent'
import { DownloadModal } from './DownloadModal'
import { VersionNavigationBar } from './VersionNavigationBar'
import { FullscreenPresentation } from './FullscreenPresentation'

interface SlideViewerProps {
  pages: PageContent[]
  versions: VersionInfo[]
  currentVersion: number | null
  currentVersionIndex: number
  isLoadingVersions: boolean
  viewMode: 'slide' | 'code'
  slideScale: number
  showChatOnMobile: boolean
  onPrevVersion: () => void
  onNextVersion: () => void
  onViewModeChange: (mode: 'slide' | 'code') => void
  onScaleChange: (scale: number) => void
  onClose: () => void
}

export function SlideViewer({
  pages,
  versions,
  currentVersion,
  currentVersionIndex,
  isLoadingVersions,
  viewMode,
  slideScale,
  showChatOnMobile,
  onPrevVersion,
  onNextVersion,
  onViewModeChange,
  onScaleChange,
  onClose
}: SlideViewerProps) {
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  if (pages.length === 0) return null

  const handleDownloadClick = () => {
    setShowDownloadModal(true)
  }

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false)
  }

  const handleFullscreenClick = () => {
    setIsFullscreen(true)
    setCurrentSlideIndex(0) // Start from first slide
  }

  const handleExitFullscreen = () => {
    setIsFullscreen(false)
  }

  const handleSlideChange = (index: number) => {
    setCurrentSlideIndex(index)
  }

  return (
    <>
      <div className={`flex flex-col ${showChatOnMobile ? 'hidden md:flex' : 'flex'} w-full md:flex-1 md:min-w-0 bg-gray-50 border-l border-gray-200 transition-all duration-300 relative`}>
      <SlideHeader
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
          onDownload={handleDownloadClick}
          onFullscreen={handleFullscreenClick}
        onClose={onClose}
      />
      <SlideContent
        pages={pages}
        viewMode={viewMode}
        slideScale={slideScale}
        onScaleChange={onScaleChange}
      />
        
        {/* Version Navigation Bar - Fixed at bottom */}
        <VersionNavigationBar
          versions={versions}
          currentVersion={currentVersion}
          currentVersionIndex={currentVersionIndex}
          isLoadingVersions={isLoadingVersions}
          onPrevVersion={onPrevVersion}
          onNextVersion={onNextVersion}
        />
    </div>
      
      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
      />

      {/* Fullscreen Presentation */}
      {isFullscreen && (
        <FullscreenPresentation
          pages={pages}
          currentSlideIndex={currentSlideIndex}
          onSlideChange={handleSlideChange}
          onExit={handleExitFullscreen}
          versions={versions}
          currentVersion={currentVersion}
        />
      )}
    </>
  )
}

