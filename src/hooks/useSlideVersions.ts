import { useState } from 'react'
import type { VersionInfo, PageContent } from '../types'
import { slideService } from '../services/api'

export function useSlideVersions() {
  const [currentVersion, setCurrentVersion] = useState<number | null>(null)
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)

  const fetchSlideVersions = async (slideId: string, targetHtml?: string | null) => {
    if (!slideId) return
    
    setIsLoadingVersions(true)
    try {
      const fetchedVersions = await slideService.fetchSlideVersions(slideId)
      setVersions(fetchedVersions)
      
      if (targetHtml && fetchedVersions.length > 0) {
        const matchedVersion = await slideService.matchVersionByHtml(
          slideId, 
          fetchedVersions, 
          targetHtml
        )
        
        if (matchedVersion !== null) {
          setCurrentVersion(matchedVersion)
        } else {
          const current = fetchedVersions.find((v: VersionInfo) => v.is_current)
          if (current) {
            setCurrentVersion(current.version)
          } else if (fetchedVersions.length > 0) {
            const maxVersion = Math.max(...fetchedVersions.map((v: VersionInfo) => v.version))
            setCurrentVersion(maxVersion)
          }
        }
      } else {
        const current = fetchedVersions.find((v: VersionInfo) => v.is_current)
        if (current) {
          setCurrentVersion(current.version)
        } else if (fetchedVersions.length > 0) {
          const maxVersion = Math.max(...fetchedVersions.map((v: VersionInfo) => v.version))
          setCurrentVersion(maxVersion)
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
      setVersions([])
    } finally {
      setIsLoadingVersions(false)
    }
  }

  const handleVersionChange = async (
    slideId: string, 
    targetVersion: number,
    onPagesUpdate: (pages: PageContent[]) => void
  ) => {
    if (!slideId || isLoadingVersions) return
    
    try {
      const data = await slideService.fetchVersionContent(slideId, targetVersion)
      onPagesUpdate(data.pages || [])
      setCurrentVersion(targetVersion)
    } catch (error) {
      console.error('Error fetching version:', error)
    }
  }

  const getCurrentVersionIndex = () => {
    if (!currentVersion || versions.length === 0) return 0
    return versions.findIndex(v => v.version === currentVersion) + 1
  }

  const handlePrevVersion = (
    slideId: string,
    onPagesUpdate: (pages: PageContent[]) => void
  ) => {
    if (!currentVersion || versions.length === 0) return
    const currentIndex = versions.findIndex(v => v.version === currentVersion)
    if (currentIndex > 0) {
      const prevVersion = versions[currentIndex - 1].version
      handleVersionChange(slideId, prevVersion, onPagesUpdate)
    }
  }

  const handleNextVersion = (
    slideId: string,
    onPagesUpdate: (pages: PageContent[]) => void
  ) => {
    if (!currentVersion || versions.length === 0) return
    const currentIndex = versions.findIndex(v => v.version === currentVersion)
    if (currentIndex < versions.length - 1) {
      const nextVersion = versions[currentIndex + 1].version
      handleVersionChange(slideId, nextVersion, onPagesUpdate)
    }
  }

  const resetVersions = () => {
    setCurrentVersion(null)
    setVersions([])
  }

  return {
    currentVersion,
    versions,
    isLoadingVersions,
    fetchSlideVersions,
    handleVersionChange,
    getCurrentVersionIndex,
    handlePrevVersion,
    handleNextVersion,
    resetVersions
  }
}
