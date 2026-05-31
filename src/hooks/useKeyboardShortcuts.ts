import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useAppStore.getState().setIsSearchOpen(true)
        return
      }

      if (isTyping) return

      if (e.key === '/') {
        e.preventDefault()
        useAppStore.getState().setIsSearchOpen(true)
        return
      }

      if (e.key.toLowerCase() === 'n' && !mod) {
        const addInput = document.querySelector<HTMLInputElement>('[data-add-task-input]')
        if (addInput) {
          e.preventDefault()
          addInput.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
