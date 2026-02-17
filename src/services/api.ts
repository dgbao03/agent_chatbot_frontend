import { API_URL } from '../constants'
import type { Message, VersionInfo, PageContent } from '../types'
import { authService } from './auth'
import { fetchWithAuth } from './apiClient'

export const chatService = {
  async sendMessage(
    userInput: string,
    conversationId: string | null
  ): Promise<Message & { conversation_id?: string; title?: string }> {
    const session = await authService.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated. Please login again.')
    }

    const requestBody: Record<string, unknown> = {
      start_event: {
        user_input: userInput,
      },
    }

    if (conversationId) {
      (requestBody.start_event as Record<string, unknown>).conversation_id = conversationId
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'completed' && data.result?.value?.result) {
      const result = data.result.value.result

      let content: string
      let intent: 'GENERAL' | 'PPTX' | undefined
      let pages: PageContent[] | undefined
      let total_pages: number | undefined
      let conversation_id: string | undefined
      let title: string | undefined

      if (typeof result === 'string') {
        content = result
        intent = 'GENERAL'
      } else if (result && typeof result === 'object') {
        content = result.answer || ''
        intent = result.intent
        pages = result.pages
        total_pages = result.total_pages
        conversation_id = result.conversation_id
        title = result.title
      } else {
        content = JSON.stringify(result)
      }

      const message: Message & { conversation_id?: string; title?: string } = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        intent,
        pages,
        total_pages,
      }

      if (conversation_id) {
        message.conversation_id = conversation_id
      }
      if (title) {
        message.title = title
      }

      return message
    } else if (data.error) {
      throw new Error(data.error)
    } else {
      throw new Error('Không nhận được phản hồi từ server')
    }
  },
}

/** Version info from API - maps timestamp from created_at */
interface VersionInfoApi {
  version: number
  total_pages: number
  is_current: boolean
  timestamp?: string | null
  created_at?: string | null
  user_request?: string | null
}

/** Version content from API */
interface VersionContentApi {
  pages: PageContent[]
  total_pages: number
}

export const slideService = {
  async fetchActivePresentationId(conversationId: string): Promise<string | null> {
    const { data, error } = await fetchWithAuth<{ presentation_id: string | null }>(
      `/api/conversations/${conversationId}/active-presentation`
    )
    if (error) return null
    return data?.presentation_id ?? null
  },

  async fetchSlideVersions(presentationId: string): Promise<VersionInfo[]> {
    const { data, error } = await fetchWithAuth<VersionInfoApi[]>(
      `/api/presentations/${presentationId}/versions`
    )
    if (error) throw new Error(error)
    if (!data || !Array.isArray(data)) return []

    return data.map((v) => ({
      version: v.version,
      timestamp: v.timestamp ?? v.created_at ?? '',
      user_request: v.user_request ?? '',
      is_current: v.is_current,
    }))
  },

  async fetchVersionContent(presentationId: string, version: number) {
    const { data, error } = await fetchWithAuth<VersionContentApi>(
      `/api/presentations/${presentationId}/versions/${version}`
    )
    if (error) throw new Error(error)
    if (!data) throw new Error('Version not found')

    const pages = data.pages ?? []
    return {
      presentation_id: presentationId,
      version,
      pages,
      total_pages: data.total_pages ?? pages.length,
      html_content: pages,
    }
  },

  async matchVersionByHtml(
    presentationId: string,
    versions: VersionInfo[],
    targetHtml: string
  ): Promise<number | null> {
    const normalizedTarget = targetHtml.replace(/\s+/g, ' ').trim()

    const currentVersionInfo = versions.find((v: VersionInfo) => v.is_current)
    if (currentVersionInfo) {
      try {
        const versionData = await this.fetchVersionContent(
          presentationId,
          currentVersionInfo.version
        )
        const versionHtml = Array.isArray(versionData.html_content)
          ? versionData.html_content.map((p: PageContent) => p.html_content).join('')
          : versionData.html_content
        const normalizedVersion = (versionHtml ?? '').replace(/\s+/g, ' ').trim()

        if (normalizedTarget === normalizedVersion) {
          return currentVersionInfo.version
        }
      } catch {
        // Continue to check other versions
      }
    }

    for (const versionInfo of versions) {
      if (versionInfo.is_current) continue

      try {
        const versionData = await this.fetchVersionContent(
          presentationId,
          versionInfo.version
        )
        const versionHtml = Array.isArray(versionData.html_content)
          ? versionData.html_content.map((p: PageContent) => p.html_content).join('')
          : versionData.html_content
        const normalizedVersion = (versionHtml ?? '').replace(/\s+/g, ' ').trim()

        if (normalizedTarget === normalizedVersion) {
          return versionInfo.version
        }
      } catch {
        continue
      }
    }

    return null
  },
}
