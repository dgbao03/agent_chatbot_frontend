import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Message, PageContent } from '../types'
import { chatService, slideService } from '../services/api'
import { messageService, conversationService } from '../services/database'
import { useSlideVersions } from '../hooks/useSlideVersions'
import { Header } from '../components/Layout/Header'
import { Sidebar } from '../components/Layout/Sidebar'
import { ChatContainer } from '../components/Chat/ChatContainer'
import { SlideViewer } from '../components/Slide/SlideViewer'
import { ErrorBanner } from '../components/Layout/ErrorBanner'

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [showSlide, setShowSlide] = useState(false)
  const [currentSlidePages, setCurrentSlidePages] = useState<PageContent[]>([])
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null)
  const [showChatOnMobile, setShowChatOnMobile] = useState(true)
  const [slideScale, setSlideScale] = useState(0.6)
  const [slideViewMode, setSlideViewMode] = useState<'slide' | 'code'>('slide')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [conversationError, setConversationError] = useState<string | null>(null)

  // Use the slide versions hook
  const {
    currentVersion,
    versions,
    isLoadingVersions,
    fetchSlideVersions,
    handlePrevVersion,
    handleNextVersion,
    getCurrentVersionIndex,
    resetVersions
  } = useSlideVersions()

  // Sync URL params with state and validate conversation
  useEffect(() => {
    if (conversationId) {
      // Validate conversation exists before setting it
      validateAndSetConversation(conversationId)
    } else {
      setSelectedConversationId(null)
      setConversationError(null)
    }
  }, [conversationId])

  const validateAndSetConversation = async (id: string) => {
    const { exists, error } = await conversationService.checkConversationExists(id)
    
    if (error || !exists) {
      setConversationError(`Unable to load conversation ${id}`)
      setSelectedConversationId(null)
      setMessages([])
    } else {
      setConversationError(null)
      setSelectedConversationId(id)
    }
  }

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
    } else {
      // Clear messages if no conversation selected
      setMessages([])
    }
  }, [selectedConversationId])

  const loadMessages = async (conversationId: string) => {
    setIsLoadingMessages(true)
    const { data, error } = await messageService.fetchMessages(conversationId)
    
    if (error) {
      console.error('Failed to load messages:', error)
      setMessages([])
    } else {
      // Convert database messages to UI Message format
      const uiMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        intent: msg.intent as 'PPTX' | 'GENERAL' | undefined,
        // Extract PPTX-specific fields from metadata
        pages: msg.metadata?.pages as PageContent[] | undefined,
        total_pages: msg.metadata?.total_pages as number | undefined,
        slide_id: msg.metadata?.slide_id as string | undefined,
      }))
      setMessages(uiMessages)
    }
    setIsLoadingMessages(false)
  }

  // Tự động hiển thị slide mới nhất khi có PPTX message mới được thêm vào
  useEffect(() => {
    const pptxMessages = messages.filter(msg => msg.intent === 'PPTX' && msg.pages && msg.pages.length > 0)
    const lastPptxMessage = pptxMessages.slice(-1)[0]
    
    if (lastPptxMessage && lastPptxMessage.pages) {
      // Chỉ tự động set nếu chưa có slide nào đang được hiển thị hoặc đây là slide mới nhất
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (currentSlidePages.length === 0 || JSON.stringify(lastPptxMessage.pages) !== JSON.stringify(currentSlidePages)) {
        setCurrentSlidePages(lastPptxMessage.pages)
        setShowSlide(true)
        
        // Fetch presentation_id và versions
        if (lastPptxMessage.slide_id) {
          setCurrentSlideId(lastPptxMessage.slide_id)
          fetchSlideVersions(lastPptxMessage.slide_id, null)
        } else if (selectedConversationId) {
          // Nếu không có presentation_id trong message, fetch active presentation
          slideService.fetchActivePresentationId(selectedConversationId).then(presentationId => {
            if (presentationId) {
              setCurrentSlideId(presentationId)
              fetchSlideVersions(presentationId, null)
            }
          })
        }
      }
    }
  }, [messages])

  // Trigger re-calculation của scale khi layout thay đổi
  useEffect(() => {
    if (showSlide) {
      // Reset scale để trigger re-calculation trong SlideContent
      // SlideContent sẽ tự động tính toán lại scale phù hợp với container size mới
      const timeoutId = setTimeout(() => {
        // Trigger resize event để SlideContent tính lại
        window.dispatchEvent(new Event('resize'))
      }, 150)
      
      return () => clearTimeout(timeoutId)
    }
  }, [showSlide, showChatOnMobile, slideViewMode])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !selectedConversationId) return

    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Add user message to UI (optimistic update)
      const userMessage: Message = {
        id: Date.now().toString(), // Temporary ID for UI
        role: 'user',
        content: userInput
      }
      setMessages(prev => [...prev, userMessage])

      // Backend will save both user and assistant messages
      const assistantMessage = await chatService.sendMessage(userInput, selectedConversationId)

      // Add assistant message to UI (backend already saved it)
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewSlide = async (message: Message) => {
    if (!message.pages) return
    
    const pagesToShow = message.pages
    setCurrentSlidePages(pagesToShow)
    setShowSlide(true)
    setShowChatOnMobile(false)
    
    // Tạo HTML string từ message.pages để match version
    const messageHtml = pagesToShow.map(p => p.html_content).join('')
    
    // Fetch presentation_id và versions
    if (message.slide_id) {
      setCurrentSlideId(message.slide_id)
      await fetchSlideVersions(message.slide_id, messageHtml)
    } else if (selectedConversationId) {
      // Fetch active presentation_id nếu không có trong message
      const presentationId = await slideService.fetchActivePresentationId(selectedConversationId)
      if (presentationId) {
        setCurrentSlideId(presentationId)
        await fetchSlideVersions(presentationId, messageHtml)
      }
    }
  }

  const handleCloseSlide = () => {
    setShowSlide(false)
    setCurrentSlidePages([])
    setCurrentSlideId(null)
    resetVersions()
  }

  const handlePrevVersionClick = () => {
    if (currentSlideId) {
      handlePrevVersion(currentSlideId, setCurrentSlidePages)
    }
  }

  const handleNextVersionClick = () => {
    if (currentSlideId) {
      handleNextVersion(currentSlideId, setCurrentSlidePages)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    // Navigate to conversation URL
    navigate(`/chat/${conversationId}`, { replace: false })
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false)
    // Reset slide states when switching conversations
    setShowSlide(false)
    setCurrentSlidePages([])
    setCurrentSlideId(null)
    resetVersions()
  }

  const handleNewConversation = () => {
    // Navigate to base chat URL (no conversation selected)
    navigate('/chat', { replace: false })
    setMessages([])
    // Reset slide states
    setShowSlide(false)
    setCurrentSlidePages([])
    setCurrentSlideId(null)
    resetVersions()
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Error Banner */}
      {conversationError && (
        <ErrorBanner
          message={conversationError}
          onClose={() => setConversationError(null)}
        />
      )}

      <Header 
        showSidebarToggle={true}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Main Content: Sidebar, Chat và Slide */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />

        {/* Chat Container */}
        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : !selectedConversationId ? (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center px-6">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No conversation selected</h2>
              <p className="text-gray-600">Select a conversation from the sidebar or start a new chat</p>
            </div>
          </div>
        ) : (
          <ChatContainer
            messages={messages}
            input={input}
            isLoading={isLoading}
            showSlide={showSlide}
            showChatOnMobile={showChatOnMobile}
            onInputChange={setInput}
            onSend={handleSend}
            onViewSlide={handleViewSlide}
          />
        )}

        {/* Slide Viewer */}
        {showSlide && (
          <SlideViewer
            pages={currentSlidePages}
            versions={versions}
            currentVersion={currentVersion}
            currentVersionIndex={getCurrentVersionIndex()}
            isLoadingVersions={isLoadingVersions}
            viewMode={slideViewMode}
            slideScale={slideScale}
            showChatOnMobile={showChatOnMobile}
            onPrevVersion={handlePrevVersionClick}
            onNextVersion={handleNextVersionClick}
            onViewModeChange={setSlideViewMode}
            onScaleChange={setSlideScale}
            onClose={handleCloseSlide}
          />
        )}
      </div>
    </div>
  )
}

