import { useState, useEffect } from 'react'
import type { Message, PageContent } from '../types'
import { chatService, slideService } from '../services/api'
import { useSlideVersions } from '../hooks/useSlideVersions'
import { Header } from '../components/Layout/Header'
import { Sidebar } from '../components/Layout/Sidebar'
import { ChatContainer } from '../components/Chat/ChatContainer'
import { SlideViewer } from '../components/Slide/SlideViewer'

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! How can I help you?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    const userInput = input.trim()
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const assistantMessage = await chatService.sendMessage(userInput)
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
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
        />

        {/* Chat Container */}
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

