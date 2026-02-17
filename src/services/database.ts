import { fetchWithAuth } from './apiClient'
import type {
  Conversation,
  Message,
  ConversationSummary,
  UserFact,
  CreateConversationData,
  CreateMessageData,
  UpdateConversationData,
} from '../types/database'

// ============================================
// CONVERSATIONS
// ============================================

export const conversationService = {
  async fetchConversations(): Promise<{ data: Conversation[]; error: string }> {
    const { data, error } = await fetchWithAuth<Conversation[]>('/api/conversations')
    if (error) return { data: [], error }
    return { data: data ?? [], error: '' }
  },

  async createConversation(_data: CreateConversationData): Promise<{ data: Conversation | null; error: string }> {
    return { data: null, error: 'Conversation được tạo tự động khi gửi tin nhắn đầu tiên' }
  },

  async updateConversation(
    id: string,
    data: UpdateConversationData
  ): Promise<{ data: Conversation | null; error: string }> {
    const { data: result, error } = await fetchWithAuth<Conversation>(
      `/api/conversations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
    if (error) return { data: null, error }
    return { data: result, error: '' }
  },

  async deleteConversation(id: string): Promise<{ error: string }> {
    const { error } = await fetchWithAuth<null>(`/api/conversations/${id}`, {
      method: 'DELETE',
    })
    return { error: error || '' }
  },

  async checkConversationExists(id: string): Promise<{ exists: boolean; error: string }> {
    const { data, error } = await fetchWithAuth<{ exists: boolean }>(
      `/api/conversations/${id}/exists`
    )
    if (error) return { exists: false, error }
    return { exists: data?.exists ?? false, error: '' }
  },
}

// ============================================
// MESSAGES
// ============================================

export const messageService = {
  async fetchMessages(conversationId: string): Promise<{ data: Message[]; error: string }> {
    const { data, error } = await fetchWithAuth<Message[]>(
      `/api/conversations/${conversationId}/messages`
    )
    if (error) return { data: [], error }
    return { data: data ?? [], error: '' }
  },

  async fetchWorkingMemoryMessages(_conversationId: string): Promise<{ data: Message[]; error: string }> {
    return { data: [], error: '' }
  },

  async createMessage(_data: CreateMessageData): Promise<{ data: Message | null; error: string }> {
    return { data: null, error: 'Message được tạo qua workflow chat' }
  },

  async markAsSummarized(_messageIds: string[]): Promise<{ error: string }> {
    return { error: '' }
  },
}

// ============================================
// SUMMARIES (Backend only - không gọi từ FE)
// ============================================

export const summaryService = {
  async fetchSummaries(_conversationId: string): Promise<{ data: ConversationSummary[]; error: string }> {
    return { data: [], error: '' }
  },

  async createSummary(
    _conversationId: string,
    _summaryContent: string
  ): Promise<{ data: ConversationSummary | null; error: string }> {
    return { data: null, error: '' }
  },
}

// ============================================
// USER FACTS (Backend tools only - không gọi từ FE)
// ============================================

export const userFactsService = {
  async fetchUserFacts(): Promise<{ data: UserFact[]; error: string }> {
    return { data: [], error: '' }
  },

  async upsertUserFact(_key: string, _value: string): Promise<{ data: UserFact | null; error: string }> {
    return { data: null, error: '' }
  },
}
