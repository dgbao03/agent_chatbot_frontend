export interface PageContent {
  page_number: number
  html_content: string
  page_title?: string | null
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: 'GENERAL' | 'PPTX'
  pages?: PageContent[]
  total_pages?: number
  slide_id?: string
}

export interface VersionInfo {
  version: number
  timestamp: string
  user_request: string
  is_current?: boolean
}

