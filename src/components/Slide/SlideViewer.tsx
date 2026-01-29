import type { PageContent, VersionInfo } from '../../types'
import { SlideHeader } from './SlideHeader'
import { SlideContent } from './SlideContent'

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
  if (pages.length === 0) return null

  return (
    <div className={`flex flex-col ${showChatOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-1/2 bg-gray-50 border-l border-gray-200 transition-all duration-300`}>
      <SlideHeader
        versions={versions}
        currentVersion={currentVersion}
        currentVersionIndex={currentVersionIndex}
        isLoadingVersions={isLoadingVersions}
        viewMode={viewMode}
        onPrevVersion={onPrevVersion}
        onNextVersion={onNextVersion}
        onViewModeChange={onViewModeChange}
        onClose={onClose}
      />
      <SlideContent
        pages={pages}
        viewMode={viewMode}
        slideScale={slideScale}
        onScaleChange={onScaleChange}
      />
    </div>
  )
}

