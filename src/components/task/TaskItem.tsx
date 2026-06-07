import { useState } from 'react'
import { ChevronRight, Flag, AlertCircle, Calendar, Clock, ListTree, GripVertical } from 'lucide-react'
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
  onMoveToSection?: (id: string, sectionId: string | null) => void
  sections?: { id: string; name: string }[]
  dragHandleProps?: Record<string, unknown>
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
  onMoveToSection,
  sections,
  dragHandleProps,
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
    sections,
    currentSectionId: task.sectionId,
    onMoveTo: onMoveToSection ? (sectionId) => onMoveToSection(task.id, sectionId) : undefined,
  })

  return (
    <>
      <div
        className={cn('task-row group', isSelected && 'task-row-selected')}
        style={{ paddingLeft: `${10 + depth * 28}px` }}
        onClick={() => onSelect(task)}
        onContextMenu={handleContextMenu}
      >
        {/* Drag handle — visible on hover when dragging is enabled */}
        {dragHandleProps && (
          <button
            type="button"
            className="h-4 w-4 flex items-center justify-center text-text-muted/30 hover:text-text-muted shrink-0 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
            {...(dragHandleProps as Record<string, unknown>)}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}

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
          size={depth > 0 ? 'sm' : 'md'}
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

        {task.tags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none"
              style={{
                backgroundColor: task.tags[0].tag.color + '22',
                color: task.tags[0].tag.color,
              }}
            >
              {task.tags[0].tag.name}
            </span>
            {task.tags.length > 1 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium leading-none bg-bg-surface text-text-muted">
                +{task.tags.length - 1}
              </span>
            )}
          </div>
        )}

        {dueDate && (
          isCompleted || isWontDo ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-text-muted opacity-35">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatDueDate(dueDate)}
            </span>
          ) : isOverdue ? (
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11.5px] font-semibold text-priority-p1 bg-priority-p1/12 border border-priority-p1/25">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              {formatDueDate(dueDate)}
            </span>
          ) : isDueToday ? (
            <span
              className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11.5px] font-semibold"
              style={{ color: '#f97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Today
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] text-text-muted opacity-70">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formatDueDate(dueDate)}
            </span>
          )
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
