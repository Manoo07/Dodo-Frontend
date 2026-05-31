import { useState, useRef } from 'react'
import { Plus, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

interface Props {
  listId: string
  parentId?: string | null
  placeholder?: string
  onAdd: (title: string, listId: string, parentId?: string | null) => void
}

export default function AddTaskBar({ listId, parentId, placeholder, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && title.trim()) {
      onAdd(title.trim(), listId, parentId ?? null)
      setTitle('')
    }
    if (e.key === 'Escape') {
      setTitle('')
      inputRef.current?.blur()
    }
  }

  return (
    <div className="add-task-bar-wrap">
      <div
        className={cn(
          'add-task-bar-inner',
          focused ? 'bg-bg-surface/80' : 'bg-bg-surface/30 hover:bg-bg-surface/50',
        )}
      >
        <Plus
          className={cn('h-4 w-4 shrink-0', focused ? 'text-accent' : 'text-text-muted')}
          strokeWidth={2}
        />
        <input
          ref={inputRef}
          data-add-task-input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || 'Add a task. Press Enter to save.'}
          className="flex-1 h-full bg-transparent text-sm font-normal text-text-primary placeholder:text-text-muted outline-none"
        />
        {title && (
          <span className="shrink-0 text-[11px] text-text-muted opacity-70 select-none">↵</span>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" className="icon-btn" title="Set due date">
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button type="button" className="icon-btn" title="More options">
            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
