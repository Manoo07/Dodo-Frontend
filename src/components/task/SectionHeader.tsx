import { useEffect, useRef, useState } from 'react'
import { ChevronRight, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'

interface SectionHeaderProps {
  name: string
  count: number
  isExpanded: boolean
  onToggle: () => void
  onRename?: (name: string) => void
  onDelete?: () => void
  dragHandleProps?: Record<string, unknown>
}

export default function SectionHeader({
  name,
  count,
  isExpanded,
  onToggle,
  onRename,
  onDelete,
  dragHandleProps,
}: SectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(name)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const canManage = !!(onRename || onDelete)

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  useEffect(() => {
    if (!showMenu) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showMenu])

  function startEdit() {
    setEditValue(name)
    setIsEditing(true)
    setShowMenu(false)
  }

  function commitRename() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== name) onRename?.(trimmed)
    else setEditValue(name)
    setIsEditing(false)
  }

  return (
    <div className="section-header-row group">
      {/* Drag handle — only for named sections */}
      {dragHandleProps ? (
        <button
          type="button"
          className="h-4 w-4 flex items-center justify-center text-text-muted/30 hover:text-text-muted shrink-0 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder section"
          {...(dragHandleProps as Record<string, unknown>)}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : (
        <span className="h-4 w-4 shrink-0" />
      )}

      {/* Expand / collapse chevron */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-center shrink-0"
        aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 text-text-muted transition-transform duration-150',
            isExpanded && 'rotate-90',
          )}
          strokeWidth={1.75}
        />
      </button>

      {/* Title — editable or static */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename() }
            if (e.key === 'Escape') { setEditValue(name); setIsEditing(false) }
          }}
          onClick={(e) => e.stopPropagation()}
          className="section-header-title flex-1 bg-transparent outline-none border-b border-accent"
        />
      ) : (
        <button
          type="button"
          onClick={onToggle}
          onDoubleClick={onRename ? startEdit : undefined}
          className="section-header-title flex-1 text-left truncate"
        >
          {name}
        </button>
      )}

      <span className="section-header-count">{count}</span>

      {/* ··· options button */}
      {canManage && (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowMenu((v) => !v) }}
            className="h-5 w-5 flex items-center justify-center rounded text-text-muted opacity-0 group-hover:opacity-60 hover:opacity-100! hover:bg-white/8 transition-opacity"
            aria-label="Section options"
          >
            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          {showMenu && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close menu"
                onClick={(e) => { e.stopPropagation(); setShowMenu(false) }}
              />
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 z-50 w-40"
                style={{
                  background: '#1e1e22',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  padding: '4px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {onRename && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-text-primary hover:bg-white/6 transition-colors"
                    style={{ padding: '7px 10px' }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-text-muted shrink-0" strokeWidth={1.75} />
                    Rename
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => { onDelete(); setShowMenu(false) }}
                    className="w-full flex items-center gap-2.5 rounded-lg text-[13px] font-medium text-priority-p1 hover:bg-priority-p1/10 transition-colors"
                    style={{ padding: '7px 10px' }}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
