import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /** Render as full-screen centered overlay (high z-index, portaled to body) */
  fullscreen?: boolean
}

export default function Modal({
  open,
  onClose,
  children,
  className,
  fullscreen = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center z-50',
        fullscreen ? 'p-6 sm:p-10' : 'p-6 sm:p-8',
      )}
    >
      {/* Backdrop — div not button so it never intercepts inner button clicks */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full',
          fullscreen ? 'max-w-180' : 'max-w-170',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
