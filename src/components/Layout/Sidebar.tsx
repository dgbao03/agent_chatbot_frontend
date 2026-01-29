import { useState, useEffect } from 'react'
import { conversationService } from '../../services/database'
import type { Conversation } from '../../types/database'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedConversationId?: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  selectedConversationId,
  onSelectConversation,
  onNewConversation
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    setIsLoading(true)
    const { data, error } = await conversationService.fetchConversations()
    if (error) {
      setError(error)
    } else {
      setConversations(data)
    }
    setIsLoading(false)
  }

  const handleNewChat = async () => {
    const { data, error } = await conversationService.createConversation({
      title: 'New Chat'
    })
    
    if (error) {
      console.error('Failed to create conversation:', error)
      return
    }

    if (data) {
      // Add to list and select it
      setConversations(prev => [data, ...prev])
      onNewConversation()
      onSelectConversation(data.id)
    }
  }

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    const { error } = await conversationService.deleteConversation(id)
    
    if (error) {
      console.error('Failed to delete conversation:', error)
      return
    }

    // Remove from list
    setConversations(prev => prev.filter(c => c.id !== id))
    
    // If deleted conversation was selected, clear selection
    if (selectedConversationId === id) {
      onSelectConversation('')
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative top-0 left-0 h-full
          bg-gray-50 border-r border-gray-200
          flex flex-col z-50 overflow-hidden
          ${isCollapsed ? 'w-[60px]' : 'w-[260px]'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-in-out'
        }}
      >
        {isCollapsed ? (
          /* Collapsed view - Icon buttons only */
          <div 
            className="flex flex-col items-center gap-3 p-3 animate-fade-in"
            style={{
              animation: 'fadeIn 0.3s ease-in-out 0.2s both'
            }}
          >
            {/* Expand button */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>

            {/* New chat button */}
            <button
              onClick={handleNewChat}
              className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
              title="New chat"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ) : (
          /* Expanded view - Full UI */
          <div 
            className="flex flex-col h-full"
            style={{
              animation: 'fadeIn 0.3s ease-in-out 0.2s both'
            }}
          >
            {/* Header with New Chat button and Collapse button */}
            <div className="p-3 border-b border-gray-200 space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={handleNewChat}
                  className="flex-1 flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium text-gray-900 whitespace-nowrap">New chat</span>
                </button>
                
                {/* Collapse button - only show on desktop */}
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden md:flex p-3 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                  title="Collapse sidebar"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={fetchConversations}
                    className="mt-2 text-sm text-gray-900 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-gray-600">No conversations yet</p>
                  <p className="text-xs text-gray-500 mt-1">Click "New chat" to start</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group flex items-center justify-between ${
                      selectedConversationId === conv.id
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm text-gray-900 truncate">{conv.title || 'New Chat'}</span>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded transition-opacity flex-shrink-0"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </button>
                ))
              )}
            </div>

            {/* Close button for mobile */}
            <button
              className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
              onClick={onClose}
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* CSS animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

