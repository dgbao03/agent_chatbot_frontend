// ========== SUPABASE COMMENTED ==========
// Database types matching Supabase schema (Supabase disabled - use FastAPI)

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  active_presentation_id: string | null
  next_presentation_id_counter: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent: 'PPTX' | 'GENERAL' | null
  is_in_working_memory: boolean
  summarized_at: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface ConversationSummary {
  id: string
  conversation_id: string
  version: number
  summary_content: string
  created_at: string
}

export interface UserFact {
  id: string
  user_id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

// API types
export interface CreateConversationData {
  title?: string
}

export interface CreateMessageData {
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  intent?: 'PPTX' | 'GENERAL'
  metadata?: Record<string, any>
}

export interface UpdateConversationData {
  title?: string
  active_presentation_id?: string | null
}

