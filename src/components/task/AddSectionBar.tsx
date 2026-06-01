import { useRef, useState } from 'react'
import { Hash } from 'lucide-react'

interface Props {
  onAdd: (name: string) => void
  onCancel?: () => void
  autoFocus?: boolean
}

export default function AddSectionBar({ onAdd, onCancel, autoFocus }: Props) {
  const [name, setName] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && name.trim()) {
      onAdd(name.trim())
      setName('')
    }
    if (e.key === 'Escape') {
      setName('')
      onCancel?.()
      inputRef.current?.blur()
    }
  }

  return (
    <div style={{ padding: '4px 12px 6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height: 36,
          padding: '0 12px',
          borderRadius: 8,
          border: `1.5px solid ${focused ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)'}`,
          background: focused ? 'var(--color-bg-surface)' : 'rgba(255,255,255,0.03)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <Hash
          style={{
            width: 14, height: 14, flexShrink: 0,
            color: focused ? 'var(--color-accent)' : 'var(--color-text-muted)',
            transition: 'color 0.15s',
          }}
          strokeWidth={2}
        />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            if (!name.trim()) onCancel?.()
          }}
          placeholder="Section name… Press Enter to create"
          style={{
            flex: 1,
            background: 'transparent',
            outline: 'none',
            fontSize: 13,
            color: 'var(--color-text-primary)',
          }}
          className="placeholder:text-text-muted/50"
        />
        {name.trim() && (
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.7, flexShrink: 0 }}>
            ↵
          </span>
        )}
      </div>
    </div>
  )
}
