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

  useEffect(() => {
    if (conversationId) {
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

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
      setPendingMessages([])
      setIsCreatingConversation(false)
    } else {
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
      const uiMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        intent: msg.intent as 'PPTX' | 'GENERAL' | undefined,
        pages: msg.metadata?.pages as PageContent[] | undefined,
        total_pages: msg.metadata?.total_pages as number | undefined,
        slide_id: msg.metadata?.slide_id as string | undefined,
      }))
      setMessages(uiMessages)
    }
    setIsLoadingMessages(false)
  }

  useEffect(() => {
    const pptxMessages = messages.filter(msg => msg.intent === 'PPTX' && msg.pages && msg.pages.length > 0)
    const lastPptxMessage = pptxMessages.slice(-1)[0]
    
    if (lastPptxMessage && lastPptxMessage.pages) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      if (currentSlidePages.length === 0 || JSON.stringify(lastPptxMessage.pages) !== JSON.stringify(currentSlidePages)) {
        setCurrentSlidePages(lastPptxMessage.pages)
        setShowSlide(true)
        
        if (lastPptxMessage.slide_id) {
          setCurrentSlideId(lastPptxMessage.slide_id)
          fetchSlideVersions(lastPptxMessage.slide_id, null)
        } else if (selectedConversationId) {
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

  useEffect(() => {
    if (showSlide) {
      const timeoutId = setTimeout(() => {
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
      if (!selectedConversationId) {
        const tempUserMsg: Message = {
          id: 'temp-user-' + Date.now(),
          role: 'user',
          content: userInput
        }
        setPendingMessages([tempUserMsg])
        setIsCreatingConversation(true)

        const response = await chatService.sendMessage(userInput, null)

        if (response.conversation_id) {
          navigate(`/chat/${response.conversation_id}`, { replace: true })
          
          setPendingMessages([])
          setIsCreatingConversation(false)
          
          window.dispatchEvent(new CustomEvent('conversationCreated', {
            detail: { conversationId: response.conversation_id, title: response.title }
          }))
        } else {
          setPendingMessages([])
          setIsCreatingConversation(false)
          throw new Error('Failed to create conversation')
        }
      } else {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: userInput
        }
        setMessages(prev => [...prev, userMessage])

        const assistantMessage = await chatService.sendMessage(userInput, selectedConversationId)

        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      
      if (!selectedConversationId) {
        setPendingMessages([])
        setIsCreatingConversation(false)
      } else {
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
    
    const messageHtml = pagesToShow.map(p => p.html_content).join('')
    
    if (message.slide_id) {
      setCurrentSlideId(message.slide_id)
      await fetchSlideVersions(message.slide_id, messageHtml)
    } else if (selectedConversationId) {
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
    navigate(`/chat/${conversationId}`, { replace: false })
    setIsSidebarOpen(false)
    setShowSlide(false)
    setCurrentSlidePages([])
    setCurrentSlideId(null)
    resetVersions()
  }

  const handleNewConversation = () => {
    navigate('/chat', { replace: false })
    setMessages([])
    setPendingMessages([])
    setIsCreatingConversation(false)
    setShowSlide(false)
    setCurrentSlidePages([])
    setCurrentSlideId(null)
    resetVersions()
  }

  return (
    <div className="flex flex-col h-screen bg-white">
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
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />

        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : !selectedConversationId ? (
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
