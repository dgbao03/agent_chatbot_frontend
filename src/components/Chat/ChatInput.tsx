import { useRef, useEffect } from 'react'

interface ChatInputProps {
  input: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSend: () => void
}

export function ChatInput({ input, isLoading, onInputChange, onSend }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = '52px'
      const scrollHeight = textarea.scrollHeight
      if (scrollHeight > 52) {
        textarea.style.height = `${Math.min(scrollHeight, 200)}px`
      }
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="px-6 py-4 bg-white flex-shrink-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-3 items-center">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            rows={1}
            disabled={isLoading}
            className="
              flex-1
              px-4 py-3
              border border-gray-300
              rounded-2xl
              resize-none
              focus:outline-none
              focus:ring-2
              focus:ring-gray-900
              focus:border-transparent
              text-gray-900
              placeholder-gray-500
              leading-[26px]
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            style={{
              minHeight: '52px',
              maxHeight: '200px',
            }}
          />

          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="
              h-[52px]
              px-6
              bg-gray-900
              text-white
              rounded-2xl
              font-medium
              hover:bg-gray-800
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition-colors
              flex items-center justify-center
              flex-shrink-0
            "
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

