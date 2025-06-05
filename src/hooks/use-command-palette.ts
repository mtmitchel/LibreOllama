import { useState, useEffect, useCallback } from 'react'

interface UseCommandPaletteOptions {
  onToggleFocusMode?: () => void
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const [isOpen, setIsOpen] = useState(false)

  // Open command palette
  const openPalette = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Close command palette
  const closePalette = useCallback(() => {
    setIsOpen(false)
  }, [])

  // Toggle command palette
  const togglePalette = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // Global keyboard shortcuts handler
  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    // Command palette trigger: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      togglePalette()
      return
    }

    // Alternative trigger: F1
    if (event.key === 'F1') {
      event.preventDefault()
      togglePalette()
      return
    }

    // Focus mode toggle: Ctrl+Shift+F
    if (event.ctrlKey && event.shiftKey && event.key === 'F') {
      event.preventDefault()
      options.onToggleFocusMode?.()
      return
    }

    // Don't handle other shortcuts if command palette is open
    if (isOpen) {
      return
    }

    // Global navigation shortcuts (only when palette is closed)
    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
      const numberKey = parseInt(event.key)
      if (numberKey >= 1 && numberKey <= 9) {
        event.preventDefault()
        // These will be handled by the command palette's workflow change function
        // when integrated into UnifiedWorkspace
        const workflowMap: Record<number, string> = {
          1: 'chat',
          2: 'agents', 
          3: 'notes',
          4: 'folders',
          5: 'analytics',
          6: 'n8n',
          7: 'mcp',
          8: 'models',
          9: 'settings'
        }
        
        // Dispatch custom event for workflow change
        const workflowEvent = new CustomEvent('workflow-shortcut', {
          detail: { workflow: workflowMap[numberKey] }
        })
        window.dispatchEvent(workflowEvent)
      }
    }
  }, [isOpen, togglePalette, options.onToggleFocusMode])

  // Set up global keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [handleGlobalKeyDown])

  // Prevent body scroll when palette is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return {
    isOpen,
    openPalette,
    closePalette,
    togglePalette
  }
}