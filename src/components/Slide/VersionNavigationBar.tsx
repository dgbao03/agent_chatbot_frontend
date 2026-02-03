import type { VersionInfo } from '../../types'

interface VersionNavigationBarProps {
  versions: VersionInfo[]
  currentVersion: number | null
  currentVersionIndex: number
  isLoadingVersions: boolean
  onPrevVersion: () => void
  onNextVersion: () => void
}

export function VersionNavigationBar({
  versions,
  currentVersion,
  currentVersionIndex,
  isLoadingVersions,
  onPrevVersion,
  onNextVersion
}: VersionNavigationBarProps) {
  if (versions.length === 0 || !currentVersion) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 flex items-center justify-center py-4 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1.5">
        <button
          onClick={onPrevVersion}
          disabled={currentVersionIndex === 1 || isLoadingVersions}
          className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Previous version"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
          Version {currentVersionIndex}/{versions.length}
        </span>
        <button
          onClick={onNextVersion}
          disabled={currentVersionIndex === versions.length || isLoadingVersions}
          className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Next version"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

