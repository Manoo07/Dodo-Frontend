import { useEffect, useRef } from 'react'
import {
  ListPlus,
  Pin,
  XCircle,
  Tag,
  Paperclip,
  Timer,
  Activity,
  FileText,
  Copy,
  Link,
  StickyNote,
  FileOutput,
  Printer,
  Trash2,
  RotateCcw,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'

export interface MenuItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  destructive?: boolean
  dividerBefore?: boolean
  hasSubmenu?: boolean
  disabled?: boolean
}

interface TaskContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export default function TaskContextMenu({ x, y, items, onClose }: TaskContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const menuWidth = 240
  const itemHeight = 36
  const menuHeight = items.length * itemHeight + 20
  const left = Math.min(x, window.innerWidth - menuWidth - 12)
  const top = Math.min(y, window.innerHeight - menuHeight - 12)

  return (
    <div
      ref={ref}
      className="fixed z-50 w-60 py-1.5 bg-bg-elevated border border-border rounded-xl shadow-2xl"
      style={{ left, top }}
    >
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label}>
            {item.dividerBefore && <div className="my-1 mx-2.5 border-t border-border" />}
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  onClose()
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2 text-sm font-medium text-left transition-colors',
                item.destructive
                  ? 'text-priority-p1 hover:bg-bg-hover'
                  : 'text-text-primary hover:bg-bg-hover',
                item.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    item.destructive ? 'text-priority-p1' : 'text-text-muted',
                  )}
                  strokeWidth={1.75}
                />
              )}
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && (
                <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function buildTaskMenuItems(opts: {
  onAddSubtask?: () => void
  onMarkWontDo?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onRestore?: () => void
  onPin?: () => void
  isPinned?: boolean
  isTrash?: boolean
}): MenuItem[] {
  if (opts.isTrash) {
    return [
      { label: 'Restore', icon: RotateCcw, onClick: opts.onRestore ?? (() => {}) },
      {
        label: 'Delete Permanently',
        icon: Trash2,
        onClick: opts.onDelete ?? (() => {}),
        destructive: true,
        dividerBefore: true,
      },
    ]
  }

  return [
    { label: 'Add Subtask', icon: ListPlus, onClick: opts.onAddSubtask ?? (() => {}) },
    {
      label: opts.isPinned ? 'Unpin' : 'Pin',
      icon: Pin,
      onClick: opts.onPin ?? (() => {}),
      disabled: !opts.onPin,
    },
    { label: "Won't Do", icon: XCircle, onClick: opts.onMarkWontDo ?? (() => {}) },
    { label: 'Tags', icon: Tag, onClick: () => {}, disabled: true },
    { label: 'Upload Attachment', icon: Paperclip, onClick: () => {}, disabled: true },
    { label: 'Start Focus', icon: Timer, onClick: () => {}, hasSubmenu: true, disabled: true },
    { label: 'Task Activities', icon: Activity, onClick: () => {}, dividerBefore: true, disabled: true },
    { label: 'Save as Template', icon: FileText, onClick: () => {}, disabled: true },
    { label: 'Duplicate', icon: Copy, onClick: opts.onDuplicate ?? (() => {}) },
    { label: 'Copy Link', icon: Link, onClick: () => {}, disabled: true },
    { label: 'Open as Sticky Note', icon: StickyNote, onClick: () => {}, disabled: true },
    { label: 'Convert to Note', icon: FileOutput, onClick: () => {}, disabled: true },
    { label: 'Print', icon: Printer, onClick: () => {}, disabled: true },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: opts.onDelete ?? (() => {}),
      destructive: true,
      dividerBefore: true,
    },
  ]
}
