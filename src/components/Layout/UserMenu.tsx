import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface UserMenuProps {
  isCollapsed?: boolean
}

export function UserMenu({ isCollapsed = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user: authUser, signOut } = useAuth()

  // ========== SUPABASE COMMENTED ==========
  // Get user data from Supabase Auth (now from useAuth/context)
  const getUserData = () => {
    if (!authUser) {
      return {
        name: 'User',
        email: '',
        initials: 'U'
      }
    }

    const email = authUser.email || ''
    const name = authUser.name || authUser.user_metadata?.name || email.split('@')[0] || 'User'
    
    // Generate initials from name
    const getInitials = (nameStr: string): string => {
      const parts = nameStr.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2)
      }
      return nameStr.slice(0, 2).toUpperCase()
    }
    
    const initials = getInitials(name)

    return {
      name,
      email,
      initials
    }
  }

  const user = getUserData()

  const handleProfileClick = () => {
    setIsOpen(false) // Close menu
    setShowProfileModal(true) // Show profile modal
  }

  const handleLogoutClick = () => {
    setIsOpen(false) // Close menu
    setShowLogoutModal(true) // Show logout confirmation modal
  }

  const handleConfirmLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleCancelLogout = () => {
    setShowLogoutModal(false)
  }

  const handleCloseProfile = () => {
    setShowProfileModal(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (isCollapsed) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center hover:bg-gray-200 rounded-lg transition-colors"
          title={user.name}
        >
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-purple-600">{user.initials}</span>
          </div>
        </button>

        {/* Dropdown Menu for collapsed view */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
            {/* Menu Items */}
            <div className="py-2">
              <button 
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-900">Profile</span>
              </button>

              <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-sm text-gray-900">Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-purple-600">{user.initials}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Menu Items */}
          <div className="py-2">
            <button 
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-sm text-gray-900">Profile</span>
            </button>

            <button 
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="text-sm text-gray-900">Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal - Using Portal to render outside sidebar */}
      {showProfileModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseProfile}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-[450px] p-6">
            {/* Close Button */}
            <button
              onClick={handleCloseProfile}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-6 pr-8">
              Profile
            </h2>
            
            {/* User Info */}
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  Name
                </label>
                <p className="text-base text-gray-900">{user.name}</p>
              </div>
              
              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                  Email
                </label>
                <p className="text-base text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Confirmation Modal - Using Portal to render outside sidebar */}
      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancelLogout}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-[400px] p-6">
            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Are you sure you want to log out?
            </h2>
            
            {/* Confirmation Text */}
            <p className="text-sm text-gray-700 mb-6">
              Log out of ... as {user.email}?
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col gap-3">
              {/* Log out button */}
              <button
                onClick={handleConfirmLogout}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg border border-blue-500 hover:bg-gray-800 transition-colors font-medium"
              >
                Log out
              </button>
              
              {/* Cancel button */}
              <button
                onClick={handleCancelLogout}
                className="w-full px-4 py-2.5 bg-white text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

