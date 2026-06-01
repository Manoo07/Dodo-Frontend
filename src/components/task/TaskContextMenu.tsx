import { useEffect, useRef } from 'react'
import {
  ListPlus,
  Pin,
  PinOff,
  XCircle,
  Copy,
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

  const activeItems = items.filter((i) => !i.disabled)
  const menuWidth = 220
  const itemHeight = 34
  const menuHeight = activeItems.length * itemHeight + 16
  const left = Math.min(x, window.innerWidth - menuWidth - 12)
  const top = Math.min(y, window.innerHeight - menuHeight - 12)

  return (
    <div
      ref={ref}
      className="fixed z-50 py-1.5"
      style={{
        left,
        top,
        width: menuWidth,
        background: '#1e1e22',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
      }}
    >
      {activeItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label}>
            {item.dividerBefore && (
              <div className="my-1 mx-2" style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
            )}
            <button
              type="button"
              onClick={() => { item.onClick(); onClose() }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-left transition-colors rounded-lg mx-auto',
                'focus:outline-none',
                item.destructive
                  ? 'text-priority-p1 hover:bg-priority-p1/10'
                  : 'text-text-primary hover:bg-white/6',
              )}
              style={{ width: 'calc(100% - 8px)', marginLeft: 4 }}
            >
              {Icon && (
                <Icon
                  className={cn('h-4 w-4 shrink-0', item.destructive ? 'text-priority-p1' : 'text-text-muted')}
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
      label: opts.isPinned ? 'Unpin' : 'Pin to top',
      icon: opts.isPinned ? PinOff : Pin,
      onClick: opts.onPin ?? (() => {}),
      disabled: !opts.onPin,
    },
    { label: "Won't Do", icon: XCircle, onClick: opts.onMarkWontDo ?? (() => {}) },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: opts.onDuplicate ?? (() => {}),
      dividerBefore: true,
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: opts.onDelete ?? (() => {}),
      destructive: true,
      dividerBefore: true,
    },
  ]
}
