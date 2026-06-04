import {
  ListPlus,
  Pin,
  PinOff,
  XCircle,
  Copy,
  Trash2,
  RotateCcw,
  FolderInput,
} from 'lucide-react'
import type { MenuItem, SubmenuItem } from './TaskContextMenu'

export function buildTaskMenuItems(opts: {
  onAddSubtask?: () => void
  onMarkWontDo?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onRestore?: () => void
  onPin?: () => void
  isPinned?: boolean
  isTrash?: boolean
  sections?: { id: string; name: string }[]
  currentSectionId?: string | null
  onMoveTo?: (sectionId: string | null) => void
}): MenuItem[] {
  if (opts.isTrash) {
    return [
      { label: 'Restore',            icon: RotateCcw, onClick: opts.onRestore ?? (() => {}) },
      { label: 'Delete Permanently', icon: Trash2,    onClick: opts.onDelete ?? (() => {}), destructive: true, dividerBefore: true },
    ]
  }

  const moveToItems: SubmenuItem[] = []
  if (opts.sections && opts.onMoveTo) {
    if (opts.currentSectionId) {
      moveToItems.push({ label: 'No section', onClick: () => opts.onMoveTo!(null), muted: true })
    }
    for (const s of opts.sections) {
      if (s.id !== opts.currentSectionId) {
        moveToItems.push({ label: s.name, onClick: () => opts.onMoveTo!(s.id) })
      }
    }
  }

  const items: MenuItem[] = [
    { label: 'Add Subtask',                          icon: ListPlus,               onClick: opts.onAddSubtask ?? (() => {}) },
    { label: opts.isPinned ? 'Unpin' : 'Pin to top', icon: opts.isPinned ? PinOff : Pin, onClick: opts.onPin ?? (() => {}), disabled: !opts.onPin },
    { label: "Won't Do",                             icon: XCircle,                onClick: opts.onMarkWontDo ?? (() => {}) },
  ]

  if (moveToItems.length > 0) {
    items.push({ label: 'Move to section', icon: FolderInput, onClick: () => {}, submenuItems: moveToItems, dividerBefore: true })
  }

  items.push(
    { label: 'Duplicate', icon: Copy,   onClick: opts.onDuplicate ?? (() => {}), dividerBefore: !moveToItems.length },
    { label: 'Delete',    icon: Trash2, onClick: opts.onDelete ?? (() => {}), destructive: true, dividerBefore: true },
  )

  return items
}
