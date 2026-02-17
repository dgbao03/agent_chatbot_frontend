// ========== SUPABASE COMMENTED - Migrating to FastAPI ==========
// import { supabase } from '../lib/supabase'
import type {
  Conversation,
  Message,
  ConversationSummary,
  UserFact,
  CreateConversationData,
  CreateMessageData,
  UpdateConversationData
} from '../types/database'

// ============================================
// CONVERSATIONS
// ============================================

export const conversationService = {
  // Fetch all conversations for current user
  async fetchConversations(): Promise<{ data: Conversation[]; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false })
    //   if (error) return { data: [], error: error.message }
    //   return { data: data || [], error: '' }
    // } catch (error) {
    //   return { data: [], error: 'Failed to fetch conversations' }
    // }
    return { data: [], error: '' }
  },

  // Create new conversation
  async createConversation(_data: CreateConversationData): Promise<{ data: Conversation | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: session } = await supabase.auth.getSession()
    //   if (!session.session?.user) return { data: null, error: 'Not authenticated' }
    //   const { data: conversation, error } = await supabase.from('conversations')
    //     .insert({ user_id: session.session.user.id, title: data.title || 'New Chat' })
    //     .select().single()
    //   if (error) return { data: null, error: error.message }
    //   return { data: conversation, error: '' }
    // } catch (error) {
    //   return { data: null, error: 'Failed to create conversation' }
    // }
    return { data: null, error: 'Supabase disabled - use FastAPI' }
  },

  // Update conversation
  async updateConversation(
    _id: string,
    _data: UpdateConversationData
  ): Promise<{ data: Conversation | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: conversation, error } = await supabase.from('conversations')
    //     .update(data).eq('id', id).select().single()
    //   if (error) return { data: null, error: error.message }
    //   return { data: conversation, error: '' }
    // } catch (error) {
    //   return { data: null, error: 'Failed to update conversation' }
    // }
    return { data: null, error: 'Supabase disabled - use FastAPI' }
  },

  // Delete conversation
  async deleteConversation(_id: string): Promise<{ error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { error } = await supabase.from('conversations').delete().eq('id', id)
    //   if (error) return { error: error.message }
    //   return { error: '' }
    // } catch (error) {
    //   return { error: 'Failed to delete conversation' }
    // }
    return { error: '' }
  },

  // Check if conversation exists
  async checkConversationExists(_id: string): Promise<{ exists: boolean; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.from('conversations').select('id').eq('id', id).maybeSingle()
    //   if (error) return { exists: false, error: error.message }
    //   return { exists: !!data, error: '' }
    // } catch (error) {
    //   return { exists: false, error: 'Failed to check conversation' }
    // }
    return { exists: false, error: '' }
  }
}

// ============================================
// MESSAGES
// ============================================

export const messageService = {
  // Fetch messages for a conversation
  async fetchMessages(_conversationId: string): Promise<{ data: Message[]; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
    //   if (error) return { data: [], error: error.message }
    //   return { data: data || [], error: '' }
    // } catch (error) {
    //   return { data: [], error: 'Failed to fetch messages' }
    // }
    return { data: [], error: '' }
  },

  // Fetch working memory messages only
  async fetchWorkingMemoryMessages(_conversationId: string): Promise<{ data: Message[]; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.from('messages').select('*')
    //     .eq('conversation_id', conversationId).eq('is_in_working_memory', true).order('created_at', { ascending: true })
    //   if (error) return { data: [], error: error.message }
    //   return { data: data || [], error: '' }
    // } catch (error) {
    //   return { data: [], error: 'Failed to fetch working memory messages' }
    // }
    return { data: [], error: '' }
  },

  // Create new message
  async createMessage(_data: CreateMessageData): Promise<{ data: Message | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: message, error } = await supabase.from('messages')
    //     .insert({ conversation_id: data.conversation_id, role: data.role, content: data.content, intent: data.intent || null, metadata: data.metadata || null })
    //     .select().single()
    //   if (error) return { data: null, error: error.message }
    //   return { data: message, error: '' }
    // } catch (error) {
    //   return { data: null, error: 'Failed to create message' }
    // }
    return { data: null, error: 'Supabase disabled - use FastAPI' }
  },

  // Mark messages as summarized
  async markAsSummarized(_messageIds: string[]): Promise<{ error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { error } = await supabase.from('messages')
    //     .update({ is_in_working_memory: false, summarized_at: new Date().toISOString() })
    //     .in('id', messageIds)
    //   if (error) return { error: error.message }
    //   return { error: '' }
    // } catch (error) {
    //   return { error: 'Failed to mark messages as summarized' }
    // }
    return { error: '' }
  }
}

// ============================================
// SUMMARIES
// ============================================

export const summaryService = {
  // Fetch summaries for a conversation
  async fetchSummaries(_conversationId: string): Promise<{ data: ConversationSummary[]; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.from('conversation_summaries').select('*').eq('conversation_id', conversationId).order('version', { ascending: true })
    //   if (error) return { data: [], error: error.message }
    //   return { data: data || [], error: '' }
    // } catch (error) {
    //   return { data: [], error: 'Failed to fetch summaries' }
    // }
    return { data: [], error: '' }
  },

  // Create new summary
  async createSummary(
    _conversationId: string,
    _summaryContent: string
  ): Promise<{ data: ConversationSummary | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: latestSummary } = await supabase.from('conversation_summaries')
    //     .select('version').eq('conversation_id', conversationId).order('version', { ascending: false }).limit(1).single()
    //   const nextVersion = latestSummary ? latestSummary.version + 1 : 1
    //   const { data: summary, error } = await supabase.from('conversation_summaries')
    //     .insert({ conversation_id: conversationId, version: nextVersion, summary_content: summaryContent })
    //     .select().single()
    //   if (error) return { data: null, error: error.message }
    //   return { data: summary, error: '' }
    // } catch (error) {
    //   return { data: null, error: 'Failed to create summary' }
    // }
    return { data: null, error: 'Supabase disabled - use FastAPI' }
  }
}

// ============================================
// USER FACTS
// ============================================

export const userFactsService = {
  // Fetch all user facts
  async fetchUserFacts(): Promise<{ data: UserFact[]; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data, error } = await supabase.from('user_facts').select('*').order('key', { ascending: true })
    //   if (error) return { data: [], error: error.message }
    //   return { data: data || [], error: '' }
    // } catch (error) {
    //   return { data: [], error: 'Failed to fetch user facts' }
    // }
    return { data: [], error: '' }
  },

  // Upsert user fact (insert or update)
  async upsertUserFact(_key: string, _value: string): Promise<{ data: UserFact | null; error: string }> {
    // ========== SUPABASE COMMENTED ==========
    // try {
    //   const { data: session } = await supabase.auth.getSession()
    //   if (!session.session?.user) return { data: null, error: 'Not authenticated' }
    //   const { data: fact, error } = await supabase.from('user_facts')
    //     .upsert({ user_id: session.session.user.id, key, value, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' })
    //     .select().single()
    //   if (error) return { data: null, error: error.message }
    //   return { data: fact, error: '' }
    // } catch (error) {
    //   return { data: null, error: 'Failed to upsert user fact' }
    // }
    return { data: null, error: 'Supabase disabled - use FastAPI' }
  }
}

