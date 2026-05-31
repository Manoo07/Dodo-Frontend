import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

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
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3 border-b border-border transition-colors',
        focused ? 'bg-bg-surface' : 'bg-bg-elevated',
      )}
    >
      <ChevronDown className="h-4 w-4 text-text-muted shrink-0" strokeWidth={1.75} />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Please enter the section name. Press Enter to create"
        className={cn(
          'flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none',
          'border-b-2 pb-1 transition-colors',
          focused ? 'border-accent' : 'border-transparent',
        )}
      />
    </div>
  )
}
