import { API_URL, VERSION_API_URL } from '../constants'
import type { Message, VersionInfo, PageContent } from '../types'
import { supabase } from '../lib/supabase'

export const chatService = {
  async sendMessage(userInput: string, conversationId: string): Promise<Message> {
    // Get JWT token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated. Please login again.')
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        start_event: {
          user_input: userInput,
          conversation_id: conversationId
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'completed' && data.result?.value?.result) {
      const result = data.result.value.result
      
      // Xử lý cả string và object response
      let content: string
      let intent: 'GENERAL' | 'PPTX' | undefined
      let pages: PageContent[] | undefined
      let total_pages: number | undefined
      
      if (typeof result === 'string') {
        // Response là string (GENERAL case cũ)
        content = result
        intent = 'GENERAL'
      } else if (result && typeof result === 'object') {
        // Response là object với intent, answer, pages, total_pages
        content = result.answer || ''
        intent = result.intent
        pages = result.pages
        total_pages = result.total_pages
      } else {
        content = JSON.stringify(result)
      }
      
      return {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        intent,
        pages,
        total_pages
      }
    } else if (data.error) {
      throw new Error(data.error)
    } else {
      throw new Error('Không nhận được phản hồi từ server')
    }
  }
}

export const slideService = {
  async fetchActivePresentationId(conversationId: string): Promise<string | null> {
    try {
      const session = await supabase.auth.getSession()
      const accessToken = session.data.session?.access_token

      if (!accessToken) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`${VERSION_API_URL}/active?conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch active presentation')
      }
      
      const data = await response.json()
      return data.active_presentation_id
    } catch (error) {
      console.error('Error fetching active presentation:', error)
      return null
    }
  },

  async fetchSlideVersions(presentationId: string) {
    const session = await supabase.auth.getSession()
    const accessToken = session.data.session?.access_token

    if (!accessToken) {
      throw new Error("User not authenticated")
    }

    const response = await fetch(`${VERSION_API_URL}/${presentationId}/versions`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch versions')
    }
    
    const data = await response.json()
    return data.versions || []
  },

  async fetchVersionContent(presentationId: string, version: number) {
    const session = await supabase.auth.getSession()
    const accessToken = session.data.session?.access_token

    if (!accessToken) {
      throw new Error("User not authenticated")
    }

    const response = await fetch(`${VERSION_API_URL}/${presentationId}/versions/${version}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch version')
    }
    
    const data = await response.json()
    return data
  },

  async matchVersionByHtml(
    presentationId: string, 
    versions: VersionInfo[], 
    targetHtml: string
  ): Promise<number | null> {
    const normalizedTarget = targetHtml.replace(/\s+/g, ' ').trim()
    
    // Ưu tiên check current version trước
    const currentVersionInfo = versions.find((v: VersionInfo) => v.is_current)
    if (currentVersionInfo) {
      try {
        const versionData = await this.fetchVersionContent(presentationId, currentVersionInfo.version)
        const normalizedVersion = versionData.html_content.replace(/\s+/g, ' ').trim()
        
        if (normalizedTarget === normalizedVersion) {
          return currentVersionInfo.version
        }
      } catch (e) {
        // Continue to check other versions
      }
    }
    
    // Nếu không match với current, check các versions khác
    for (const versionInfo of versions) {
      if (versionInfo.is_current) continue
      
      try {
        const versionData = await this.fetchVersionContent(presentationId, versionInfo.version)
        const normalizedVersion = versionData.html_content.replace(/\s+/g, ' ').trim()
        
        if (normalizedTarget === normalizedVersion) {
          return versionInfo.version
        }
      } catch (e) {
        continue
      }
    }
    
    return null
  }
}

