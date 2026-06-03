import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'
import type { Toast } from '../../store/useToastStore'

const STYLES = {
  success: {
    border:  'rgba(52,199,89,0.3)',
    bg:      'rgba(52,199,89,0.1)',
    icon:    CheckCircle2,
    color:   '#34c759',
  },
  error: {
    border:  'rgba(224,82,82,0.35)',
    bg:      'rgba(224,82,82,0.1)',
    icon:    XCircle,
    color:   '#e05252',
  },
  info: {
    border:  'rgba(91,155,213,0.3)',
    bg:      'rgba(91,155,213,0.1)',
    icon:    Info,
    color:   '#5b9bd5',
  },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const s = STYLES[toast.type]
  const Icon = s.icon

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderRadius: 12,
        background: '#1e1e22',
        border: `1px solid ${s.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: 260,
        maxWidth: 380,
        animation: 'toast-in 0.2s ease-out',
      }}
    >
      <Icon style={{ width: 17, height: 17, color: s.color, flexShrink: 0 }} strokeWidth={2} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        type="button"
        onClick={onRemove}
        style={{ flexShrink: 0, opacity: 0.5, transition: 'opacity 0.15s', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
      >
        <X style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return createPortal(
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </>,
    document.body,
  )
}
