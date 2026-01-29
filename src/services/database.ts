import { supabase } from '../lib/supabase'
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
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: '' }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return { data: [], error: 'Failed to fetch conversations' }
    }
  },

  // Create new conversation
  async createConversation(data: CreateConversationData): Promise<{ data: Conversation | null; error: string }> {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user) {
        return { data: null, error: 'Not authenticated' }
      }

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: session.session.user.id,
          title: data.title || 'New Chat',
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return { data: null, error: error.message }
      }

      return { data: conversation, error: '' }
    } catch (error) {
      console.error('Error creating conversation:', error)
      return { data: null, error: 'Failed to create conversation' }
    }
  },

  // Update conversation
  async updateConversation(
    id: string,
    data: UpdateConversationData
  ): Promise<{ data: Conversation | null; error: string }> {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating conversation:', error)
        return { data: null, error: error.message }
      }

      return { data: conversation, error: '' }
    } catch (error) {
      console.error('Error updating conversation:', error)
      return { data: null, error: 'Failed to update conversation' }
    }
  },

  // Delete conversation
  async deleteConversation(id: string): Promise<{ error: string }> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting conversation:', error)
        return { error: error.message }
      }

      return { error: '' }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      return { error: 'Failed to delete conversation' }
    }
  }
}

// ============================================
// MESSAGES
// ============================================

export const messageService = {
  // Fetch messages for a conversation
  async fetchMessages(conversationId: string): Promise<{ data: Message[]; error: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: '' }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { data: [], error: 'Failed to fetch messages' }
    }
  },

  // Fetch working memory messages only
  async fetchWorkingMemoryMessages(conversationId: string): Promise<{ data: Message[]; error: string }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_in_working_memory', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching working memory messages:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: '' }
    } catch (error) {
      console.error('Error fetching working memory messages:', error)
      return { data: [], error: 'Failed to fetch working memory messages' }
    }
  },

  // Create new message
  async createMessage(data: CreateMessageData): Promise<{ data: Message | null; error: string }> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: data.conversation_id,
          role: data.role,
          content: data.content,
          intent: data.intent || null,
          metadata: data.metadata || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating message:', error)
        return { data: null, error: error.message }
      }

      return { data: message, error: '' }
    } catch (error) {
      console.error('Error creating message:', error)
      return { data: null, error: 'Failed to create message' }
    }
  },

  // Mark messages as summarized
  async markAsSummarized(messageIds: string[]): Promise<{ error: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_in_working_memory: false,
          summarized_at: new Date().toISOString()
        })
        .in('id', messageIds)

      if (error) {
        console.error('Error marking messages as summarized:', error)
        return { error: error.message }
      }

      return { error: '' }
    } catch (error) {
      console.error('Error marking messages as summarized:', error)
      return { error: 'Failed to mark messages as summarized' }
    }
  }
}

// ============================================
// SUMMARIES
// ============================================

export const summaryService = {
  // Fetch summaries for a conversation
  async fetchSummaries(conversationId: string): Promise<{ data: ConversationSummary[]; error: string }> {
    try {
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('version', { ascending: true })

      if (error) {
        console.error('Error fetching summaries:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: '' }
    } catch (error) {
      console.error('Error fetching summaries:', error)
      return { data: [], error: 'Failed to fetch summaries' }
    }
  },

  // Create new summary
  async createSummary(
    conversationId: string,
    summaryContent: string
  ): Promise<{ data: ConversationSummary | null; error: string }> {
    try {
      // Get latest version
      const { data: latestSummary } = await supabase
        .from('conversation_summaries')
        .select('version')
        .eq('conversation_id', conversationId)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      const nextVersion = latestSummary ? latestSummary.version + 1 : 1

      const { data: summary, error } = await supabase
        .from('conversation_summaries')
        .insert({
          conversation_id: conversationId,
          version: nextVersion,
          summary_content: summaryContent
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating summary:', error)
        return { data: null, error: error.message }
      }

      return { data: summary, error: '' }
    } catch (error) {
      console.error('Error creating summary:', error)
      return { data: null, error: 'Failed to create summary' }
    }
  }
}

// ============================================
// USER FACTS
// ============================================

export const userFactsService = {
  // Fetch all user facts
  async fetchUserFacts(): Promise<{ data: UserFact[]; error: string }> {
    try {
      const { data, error } = await supabase
        .from('user_facts')
        .select('*')
        .order('key', { ascending: true })

      if (error) {
        console.error('Error fetching user facts:', error)
        return { data: [], error: error.message }
      }

      return { data: data || [], error: '' }
    } catch (error) {
      console.error('Error fetching user facts:', error)
      return { data: [], error: 'Failed to fetch user facts' }
    }
  },

  // Upsert user fact (insert or update)
  async upsertUserFact(key: string, value: string): Promise<{ data: UserFact | null; error: string }> {
    try {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session?.user) {
        return { data: null, error: 'Not authenticated' }
      }

      const { data: fact, error } = await supabase
        .from('user_facts')
        .upsert({
          user_id: session.session.user.id,
          key,
          value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key'
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting user fact:', error)
        return { data: null, error: error.message }
      }

      return { data: fact, error: '' }
    } catch (error) {
      console.error('Error upserting user fact:', error)
      return { data: null, error: 'Failed to upsert user fact' }
    }
  }
}

