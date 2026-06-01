import { useState } from 'react'
import { ChevronRight, Flag, AlertCircle, Calendar, ListTree } from 'lucide-react'
import type { Task } from '../../types'
import TaskContextMenu from './TaskContextMenu'
import { buildTaskMenuItems } from './taskMenuBuilder'
import TaskCheckbox from '../ui/TaskCheckbox'
import { cn } from '../../lib/cn'

const PRIORITY_COLORS: Record<string, string> = {
  p1: 'var(--color-priority-p1)',
  p2: 'var(--color-priority-p2)',
  p3: 'var(--color-priority-p3)',
  none: 'var(--color-priority-p4)',
}

interface Props {
  task: Task
  depth?: number
  isSelected?: boolean
  onSelect: (task: Task) => void
  onToggleComplete: (id: string) => void
  onToggleExpand?: (id: string) => void
  isExpanded?: boolean
  onAddSubtask?: (task: Task) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onMarkWontDo?: (id: string) => void
  onRestore?: (id: string) => void
  onPin?: (id: string, isPinned: boolean) => void
  onSetDate?: (id: string, date: string | null) => void
  onSetPriority?: (id: string, priority: import('../../types').Priority) => void
}

export default function TaskItem({
  task,
  depth = 0,
  isSelected,
  onSelect,
  onToggleComplete,
  onToggleExpand,
  isExpanded,
  onAddSubtask,
  onDuplicate,
  onDelete,
  onMarkWontDo,
  onRestore,
  onPin,
  onSetDate,
  onSetPriority,
}: Props) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const hasChildren = !!(task.children && task.children.length > 0)
  const completedChildren = task.children?.filter((c) => c.status === 'completed').length ?? 0
  const totalChildren = task.children?.length ?? 0

  const isCompleted = task.status === 'completed'
  const isWontDo = task.status === 'wont_do'

  const dueDate = task.dueDate ? new Date(task.dueDate) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = dueDate && dueDate < today && !isCompleted
  const isDueToday =
    dueDate &&
    dueDate.getFullYear() === today.getFullYear() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getDate() === today.getDate()

  function formatDueDate(d: Date): string {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    if (d.getTime() === todayStart.getTime()) return 'Today'
    if (d.getTime() === tomorrowStart.getTime()) return 'Tomorrow'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const menuItems = buildTaskMenuItems({
    onAddSubtask: onAddSubtask ? () => onAddSubtask(task) : undefined,
    onMarkWontDo: onMarkWontDo ? () => onMarkWontDo(task.id) : undefined,
    onDuplicate: onDuplicate ? () => onDuplicate(task.id) : undefined,
    onDelete: onDelete ? () => onDelete(task.id) : undefined,
    onRestore: onRestore ? () => onRestore(task.id) : undefined,
    onPin: onPin ? () => onPin(task.id, task.isPinned) : undefined,
    isPinned: task.isPinned,
    isTrash: !!onRestore,
  })

  return (
    <>
      <div
        className={cn('task-row group', isSelected && 'task-row-selected')}
        style={{ paddingLeft: `${10 + depth * 20}px` }}
        onClick={() => onSelect(task)}
        onContextMenu={handleContextMenu}
      >
        <button
          type="button"
          className={cn(
            'h-4 w-4 flex items-center justify-center text-text-muted shrink-0 rounded',
            !hasChildren && 'invisible',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand?.(task.id)
          }}
        >
          <ChevronRight
            className={cn('h-4 w-4 transition-transform duration-150', isExpanded && 'rotate-90')}
            strokeWidth={2}
          />
        </button>

        <TaskCheckbox
          checked={isCompleted}
          priority={task.priority}
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(task.id)
          }}
        />

        <span
          className={cn(
            'flex-1 min-w-0 truncate',
            isCompleted || isWontDo ? 'line-through text-text-muted' : 'text-text-primary',
          )}
        >
          {task.title}
        </span>

        {dueDate && (
          <span
            className={cn(
              'shrink-0 inline-flex items-center gap-1 text-[11px] font-medium',
              isOverdue && 'text-priority-p1',
              isDueToday && !isOverdue && 'text-accent',
              !isOverdue && !isDueToday && 'text-text-muted opacity-70',
            )}
          >
            {isOverdue ? (
              <AlertCircle className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Calendar className="h-4 w-4" strokeWidth={2} />
            )}
            {formatDueDate(dueDate)}
          </span>
        )}

        {hasChildren && (
          <span className="nav-count-badge shrink-0 group-hover:opacity-100">
            {completedChildren}/{totalChildren}
          </span>
        )}

        {hasChildren && (
          <ListTree className="shrink-0 h-4 w-4 text-text-muted/50" strokeWidth={1.75} />
        )}

        {task.priority !== 'none' && (
          <Flag
            className="shrink-0 h-4 w-4"
            style={{ color: PRIORITY_COLORS[task.priority] }}
            strokeWidth={1.75}
            fill={PRIORITY_COLORS[task.priority]}
          />
        )}
      </div>

      {contextMenu && (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
          task={{ dueDate: task.dueDate, priority: task.priority }}
          onSetDate={onSetDate ? (d) => onSetDate(task.id, d) : undefined}
          onSetPriority={onSetPriority ? (p) => onSetPriority(task.id, p) : undefined}
        />
      )}
    </>
  )
}
