interface HeaderProps {
  onToggleSidebar?: () => void
  showSidebarToggle?: boolean
}

export function Header({ onToggleSidebar, showSidebarToggle = false }: HeaderProps) {

  return (
    <header className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            Chat Assistant
          </h1>
        </div>
      </div>
    </header>
  )
}

