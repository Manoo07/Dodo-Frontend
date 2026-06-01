import {
  ListPlus,
  Pin,
  PinOff,
  XCircle,
  Copy,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import type { MenuItem } from './TaskContextMenu'

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
      { label: 'Restore',            icon: RotateCcw, onClick: opts.onRestore ?? (() => {}) },
      { label: 'Delete Permanently', icon: Trash2,    onClick: opts.onDelete ?? (() => {}), destructive: true, dividerBefore: true },
    ]
  }

  return [
    { label: 'Add Subtask',                          icon: ListPlus,               onClick: opts.onAddSubtask ?? (() => {}) },
    { label: opts.isPinned ? 'Unpin' : 'Pin to top', icon: opts.isPinned ? PinOff : Pin, onClick: opts.onPin ?? (() => {}), disabled: !opts.onPin },
    { label: "Won't Do",                             icon: XCircle,                onClick: opts.onMarkWontDo ?? (() => {}) },
    { label: 'Duplicate',                            icon: Copy,                   onClick: opts.onDuplicate ?? (() => {}), dividerBefore: true },
    { label: 'Delete',                               icon: Trash2,                 onClick: opts.onDelete ?? (() => {}), destructive: true, dividerBefore: true },
  ]
}
