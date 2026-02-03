import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { conversationService } from '../../services/database'
import type { Conversation } from '../../types/database'
import { UserMenu } from './UserMenu'

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
  const navigate = useNavigate()
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null)
  const [deleteConversationTitle, setDeleteConversationTitle] = useState<string>('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Sync selectedConversationId with URL
  const currentConversationId = urlConversationId || selectedConversationId || null

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // Listen for conversation created event
  useEffect(() => {
    const handleConversationCreated = () => {
      // Refresh conversations list
      fetchConversations()
    }

    window.addEventListener('conversationCreated', handleConversationCreated)
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated)
    }
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

  const handleNewChat = () => {
    // Chỉ navigate, không tạo conversation
    // Conversation sẽ được tạo khi user gửi message đầu tiên
    navigate('/chat', { replace: false })
    onNewConversation()
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId]
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null)
        }
      }
    }

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const handleMenuToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === id ? null : id)
  }

  const handleRenameClick = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(null)
    setEditingId(conv.id)
    setEditTitle(conv.title || 'New Chat')
  }

  const handleRenameSave = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null)
      return
    }

    const { error } = await conversationService.updateConversation(id, {
      title: editTitle.trim()
    })

    if (error) {
      console.error('Failed to rename conversation:', error)
      alert('Failed to rename conversation')
    } else {
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c)
      )
    }

    setEditingId(null)
    setEditTitle('')
  }

  const handleRenameCancel = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDeleteClick = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuId(null)
    setDeleteConversationId(conv.id)
    setDeleteConversationTitle(conv.title || 'New Chat')
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConversationId) return

    const { error } = await conversationService.deleteConversation(deleteConversationId)
    
    if (error) {
      console.error('Failed to delete conversation:', error)
      alert('Failed to delete conversation')
      setShowDeleteModal(false)
      setDeleteConversationId(null)
      setDeleteConversationTitle('')
      return
    }

    // Remove from list
    setConversations(prev => prev.filter(c => c.id !== deleteConversationId))
    
    // If deleted conversation was selected, navigate to base chat URL
    if (currentConversationId === deleteConversationId) {
      navigate('/chat', { replace: true })
      onNewConversation()
    }

    setShowDeleteModal(false)
    setDeleteConversationId(null)
    setDeleteConversationTitle('')
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setDeleteConversationId(null)
    setDeleteConversationTitle('')
  }

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase().trim()
    return conversations.filter(conv => {
      const title = (conv.title || 'New Chat').toLowerCase()
      return title.includes(query)
    })
  }, [conversations, searchQuery])

  // Handle search loading state
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      // Simulate a small delay to show loading indicator
      const timer = setTimeout(() => {
        setIsSearching(false)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setIsSearching(false)
    }
  }, [searchQuery])

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed md:relative top-0 left-0 h-full
          bg-gray-50 border-r border-gray-200
          flex flex-col z-50 overflow-hidden flex-shrink-0
          ${isCollapsed ? 'w-[60px]' : 'w-[260px]'}
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-in-out',
          minWidth: isCollapsed ? '60px' : '260px',
          maxWidth: isCollapsed ? '60px' : '260px'
        }}
      >
        {isCollapsed ? (
          /* Collapsed view - Icon buttons only */
          <div 
            className="flex flex-col h-full"
            style={{
              animation: 'fadeIn 0.3s ease-in-out 0.2s both'
            }}
          >
            <div className="flex-1 flex flex-col items-center gap-3 p-3 overflow-y-auto">
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

            {/* Search button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="p-3 hover:bg-gray-200 rounded-lg transition-colors"
              title="Search chat"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            </div>

            {/* User Menu - Fixed at bottom */}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-gray-50 flex items-center justify-center">
              <UserMenu isCollapsed={true} />
            </div>
          </div>
        ) : (
          /* Expanded view - Full UI */
          <div 
            className="flex flex-col h-full"
            style={{
              animation: 'fadeIn 0.3s ease-in-out 0.2s both'
            }}
          >
            {/* Header with Message icon, Collapse button, Search button, and New Chat button */}
            <div className="p-3 border-b border-gray-200 space-y-2 flex-shrink-0">
              {/* Message icon and Collapse button */}
              <div className="flex items-center justify-between">
                {/* Message icon - Left */}
                <button
                  onClick={() => {
                    navigate('/chat', { replace: false })
                    onNewConversation()
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Messages"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                
                {/* Collapse/Close button - Right */}
                <button
                  onClick={() => {
                    // Mobile: Close sidebar, Desktop: Collapse sidebar
                    if (window.innerWidth < 768) {
                      onClose()
                    } else {
                      setIsCollapsed(true)
                    }
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Collapse sidebar"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              
              {/* Search button */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm text-gray-900 whitespace-nowrap">Search chat</span>
              </button>
              
              {/* New Chat button */}
              <button 
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-gray-900 whitespace-nowrap">New chat</span>
              </button>
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
                  <div
                    key={conv.id}
                    className="relative"
                  >
                    {editingId === conv.id ? (
                      <div className="px-3 py-2.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleRenameSave(conv.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSave(conv.id)
                            } else if (e.key === 'Escape') {
                              handleRenameCancel()
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (editingId !== conv.id) {
                            onSelectConversation(conv.id)
                          }
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group flex items-center justify-between ${
                          currentConversationId === conv.id
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
                        <div className="relative flex-shrink-0">
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded transition-opacity"
                            onClick={(e) => handleMenuToggle(conv.id, e)}
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          
                          {openMenuId === conv.id && (
                            <div
                              ref={(el) => {
                                if (el) {
                                  menuRefs.current[conv.id] = el
                                }
                              }}
                              className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]"
                            >
                              <button
                                onClick={(e) => handleRenameClick(conv, e)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded-t-lg transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Rename
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(conv, e)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* User Menu - Fixed at bottom */}
            <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-gray-50">
              <UserMenu isCollapsed={false} />
            </div>
          </div>
        )}
      </div>

      {/* Search Modal - Using Portal to render outside sidebar */}
      {showSearchModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowSearchModal(false)
              setSearchQuery('')
              setIsSearching(false)
            }}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-[600px] h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Search chat
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false)
                  setSearchQuery('')
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* New Chat Button */}
            <div className="px-6 py-4 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowSearchModal(false)
                  setSearchQuery('')
                  setIsSearching(false)
                  handleNewChat()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">New chat</span>
              </button>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              {searchQuery.trim() ? (
                isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.length > 0 ? (
                      filteredConversations.map(conv => (
                        <button
                          key={conv.id}
                        onClick={() => {
                          setShowSearchModal(false)
                          setSearchQuery('')
                          setIsSearching(false)
                          onSelectConversation(conv.id)
                        }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${
                            currentConversationId === conv.id
                              ? 'bg-gray-200'
                              : 'hover:bg-gray-200'
                          }`}
                        >
                          <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="text-sm text-gray-900 truncate">{conv.title || 'New Chat'}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm text-gray-600">No conversations found</p>
                        <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                  <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm text-gray-600">Type to search conversations</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal - Using Portal to render outside sidebar */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-[450px] p-6">
            {/* Close Button */}
            <button
              onClick={handleDeleteCancel}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pr-8">
              Delete conversation
            </h2>

            {/* Message */}
            <p className="text-base text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-900">"{deleteConversationTitle}"</span>? This action cannot be undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
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

