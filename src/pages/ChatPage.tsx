import { useState, useEffect } from 'react'
import type { Message, PageContent } from '../types'
import { chatService, slideService } from '../services/api'
import { messageService } from '../services/database'
import { useSlideVersions } from '../hooks/useSlideVersions'
import { Header } from '../components/Layout/Header'
import { Sidebar } from '../components/Layout/Sidebar'
import { ChatContainer } from '../components/Chat/ChatContainer'
import { SlideViewer } from '../components/Slide/SlideViewer'

export function ChatPage() {
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
        // Add other fields from metadata if needed
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
        
        // Fetch slide_id và versions
        if (lastPptxMessage.slide_id) {
          setCurrentSlideId(lastPptxMessage.slide_id)
          fetchSlideVersions(lastPptxMessage.slide_id, null)
        } else {
          // Nếu không có slide_id trong message, fetch active slide
          slideService.fetchActiveSlideId().then(slideId => {
            if (slideId) {
              setCurrentSlideId(slideId)
              fetchSlideVersions(slideId, null)
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
      // Save user message to database
      const { data: userMsgData, error: userError } = await messageService.createMessage({
        conversation_id: selectedConversationId,
        role: 'user',
        content: userInput,
        intent: 'GENERAL'
      })

      if (userError || !userMsgData) {
        throw new Error(userError || 'Failed to save user message')
      }

      // Add user message to UI
      const userMessage: Message = {
        id: userMsgData.id,
        role: 'user',
        content: userInput
      }
      setMessages(prev => [...prev, userMessage])

      // Get assistant response from backend
      const assistantMessage = await chatService.sendMessage(userInput)

      // Save assistant message to database
      const { data: assistantMsgData, error: assistantError } = await messageService.createMessage({
        conversation_id: selectedConversationId,
        role: 'assistant',
        content: assistantMessage.content,
        intent: assistantMessage.intent as 'PPTX' | 'GENERAL' | undefined,
        metadata: {
          pages: assistantMessage.pages || null,
          slide_id: assistantMessage.slide_id || null
        }
      })

      if (assistantError || !assistantMsgData) {
        throw new Error(assistantError || 'Failed to save assistant message')
      }

      // Add assistant message to UI
      setMessages(prev => [...prev, {
        ...assistantMessage,
        id: assistantMsgData.id
      }])
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
    
    // Fetch slide_id và versions
    if (message.slide_id) {
      setCurrentSlideId(message.slide_id)
      await fetchSlideVersions(message.slide_id, null)
    } else {
      // Fetch active slide_id nếu không có trong message
      const slideId = await slideService.fetchActiveSlideId()
      if (slideId) {
        setCurrentSlideId(slideId)
        await fetchSlideVersions(slideId, null)
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
    setSelectedConversationId(conversationId)
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false)
  }

  const handleNewConversation = () => {
    setSelectedConversationId(null)
    setMessages([])
  }

  return (
    <div className="flex flex-col h-screen bg-white">
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
              <p className="text-gray-600 mb-4">Select a conversation from the sidebar or start a new chat</p>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Open Sidebar
              </button>
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

