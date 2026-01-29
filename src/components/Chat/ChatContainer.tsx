import type { Message } from '../../types'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

interface ChatContainerProps {
  messages: Message[]
  input: string
  isLoading: boolean
  showSlide: boolean
  showChatOnMobile: boolean
  onInputChange: (value: string) => void
  onSend: () => void
  onViewSlide?: (message: Message) => void
}

export function ChatContainer({
  messages,
  input,
  isLoading,
  showSlide,
  showChatOnMobile,
  onInputChange,
  onSend,
  onViewSlide
}: ChatContainerProps) {
  return (
    <div className={`flex flex-col ${showSlide ? 'w-full md:w-1/2' : 'w-full'} ${showSlide && !showChatOnMobile ? 'hidden md:flex' : 'flex'} transition-all duration-300 border-r border-gray-200`}>
      <MessageList 
        messages={messages}
        isLoading={isLoading}
        onViewSlide={onViewSlide}
      />
      <ChatInput 
        input={input}
        isLoading={isLoading}
        onInputChange={onInputChange}
        onSend={onSend}
      />
    </div>
  )
}

