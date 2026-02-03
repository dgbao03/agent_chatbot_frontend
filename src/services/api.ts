import { API_URL } from '../constants'
import type { Message, VersionInfo, PageContent } from '../types'
import { supabase } from '../lib/supabase'

export const chatService = {
  async sendMessage(
    userInput: string, 
    conversationId: string | null
  ): Promise<Message & { conversation_id?: string; title?: string }> {
    // Get JWT token from Supabase session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated. Please login again.')
    }

    // Build request body - chỉ gửi conversation_id nếu không null
    const requestBody: any = {
      start_event: {
        user_input: userInput
      }
    }
    
    // Chỉ thêm conversation_id nếu không null
    if (conversationId) {
      requestBody.start_event.conversation_id = conversationId
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(requestBody),
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
      let conversation_id: string | undefined
      let title: string | undefined
      
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
        // Extract conversation_id và title nếu có (khi tạo conversation mới)
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
        total_pages
      }
      
      // Add conversation_id và title nếu có
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
  }
}

export const slideService = {
  async fetchActivePresentationId(conversationId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_active_presentation', {
        conv_id: conversationId
      })

      if (error) {
        console.error('Error fetching active presentation:', error)
        return null
      }

      return data // RPC returns UUID directly
    } catch (error) {
      console.error('Error fetching active presentation:', error)
      return null
    }
  },

  async fetchSlideVersions(presentationId: string) {
    try {
      const { data, error } = await supabase.rpc('get_presentation_versions', {
        p_id: presentationId
      })

      if (error) {
        console.error('Error fetching versions:', error)
        throw new Error('Failed to fetch versions')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching versions:', error)
      throw error
    }
  },

  async fetchVersionContent(presentationId: string, version: number) {
    try {
      // First, get presentation metadata to check current version
      const { data: presentation, error: presError } = await supabase
        .from('presentations')
        .select('version, total_pages')
        .eq('id', presentationId)
        .single()

      if (presError || !presentation) {
        throw new Error('Presentation not found')
      }

      const currentVersion = presentation.version
      let pages

      // If requesting current version, get from presentation_pages
      if (version === currentVersion) {
        const { data: pagesData, error: pagesError } = await supabase.rpc('get_presentation_pages', {
          p_id: presentationId
        })

        if (pagesError) {
          throw new Error('Failed to fetch current version pages')
        }

        pages = pagesData
      } else {
        // Otherwise get from archived versions
        const { data: pagesData, error: pagesError } = await supabase.rpc('get_version_pages', {
          p_id: presentationId,
          v_num: version
        })

        if (pagesError) {
          throw new Error('Failed to fetch archived version pages')
        }

        pages = pagesData
      }

      return {
        presentation_id: presentationId,
        version: version,
        pages: pages || [],
        total_pages: pages?.length || 0,
        html_content: pages || [] // For backward compatibility
      }
    } catch (error) {
      console.error('Error fetching version content:', error)
      throw error
    }
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
        // html_content có thể là array hoặc string, cần xử lý cả hai
        const versionHtml = Array.isArray(versionData.html_content) 
          ? versionData.html_content.map((p: PageContent) => p.html_content).join('')
          : versionData.html_content
        const normalizedVersion = versionHtml.replace(/\s+/g, ' ').trim()
        
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
        // html_content có thể là array hoặc string, cần xử lý cả hai
        const versionHtml = Array.isArray(versionData.html_content) 
          ? versionData.html_content.map((p: PageContent) => p.html_content).join('')
          : versionData.html_content
        const normalizedVersion = versionHtml.replace(/\s+/g, ' ').trim()
        
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

