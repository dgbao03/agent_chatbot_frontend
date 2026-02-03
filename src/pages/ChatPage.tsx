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
  const [pendingMessages, setPendingMessages] = useState<Message[]>([])
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

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
      // Clear pending messages khi conversation được chọn
      setPendingMessages([])
      setIsCreatingConversation(false)
    } else {
      // Clear messages if no conversation selected
      setMessages([])
      setPendingMessages([])
      setIsCreatingConversation(false)
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
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // CASE 1: Chưa có conversation (new chat)
      if (!selectedConversationId) {
        // Optimistic update: Add to pending messages
        const tempUserMsg: Message = {
          id: 'temp-user-' + Date.now(),
          role: 'user',
          content: userInput
        }
        setPendingMessages([tempUserMsg])
        setIsCreatingConversation(true)

        // Call backend với conversation_id = null
        const response = await chatService.sendMessage(userInput, null)

        // Backend trả về conversation_id và title nếu tạo mới
        if (response.conversation_id) {
          // Navigate đến conversation mới
          navigate(`/chat/${response.conversation_id}`, { replace: true })
          
          // Clear pending messages
          setPendingMessages([])
          setIsCreatingConversation(false)
          
          // Trigger sidebar refresh để hiển thị conversation mới
          window.dispatchEvent(new CustomEvent('conversationCreated', {
            detail: { conversationId: response.conversation_id, title: response.title }
          }))
          
          // Load messages từ DB (sẽ được trigger bởi useEffect khi selectedConversationId thay đổi)
        } else {
          // Fallback: nếu không có conversation_id, rollback
          setPendingMessages([])
          setIsCreatingConversation(false)
          throw new Error('Failed to create conversation')
        }
      }
      // CASE 2: Đã có conversation (existing chat)
      else {
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      
      // Rollback optimistic update
      if (!selectedConversationId) {
        setPendingMessages([])
        setIsCreatingConversation(false)
      } else {
        // Remove last user message if error
        setMessages(prev => prev.slice(0, -1))
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`
      }
      
      if (selectedConversationId) {
        setMessages(prev => [...prev, errorMsg])
      } else {
        setPendingMessages(prev => [...prev, errorMsg])
      }
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
    setPendingMessages([])
    setIsCreatingConversation(false)
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
          // New chat - hiển thị chat interface với pendingMessages
          <ChatContainer
            messages={pendingMessages}
            input={input}
            isLoading={isLoading || isCreatingConversation}
            showSlide={showSlide}
            showChatOnMobile={showChatOnMobile}
            onInputChange={setInput}
            onSend={handleSend}
            onViewSlide={handleViewSlide}
          />
        ) : (
          // Existing chat - hiển thị messages từ DB
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

