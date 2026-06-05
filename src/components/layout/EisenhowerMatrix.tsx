import { useState } from 'react'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import { useDataStore } from '../../store/useDataStore'
import { useAppStore } from '../../store/useAppStore'
import TaskCheckbox from '../ui/TaskCheckbox'
import type { Task, Priority } from '../../types'
import { cn } from '../../lib/cn'

// ── Quadrant config ────────────────────────────────────────────────────────────

const QUADRANTS: {
  id: string
  priority: Priority
  label: string
  color: string
  bg: string
}[] = [
  { id: 'q1', priority: 'p1',   label: 'Urgent & Important',         color: '#e05252', bg: 'rgba(224,82,82,0.07)'   },
  { id: 'q2', priority: 'p2',   label: 'Not Urgent & Important',     color: '#d4853a', bg: 'rgba(212,133,58,0.07)'  },
  { id: 'q3', priority: 'p3',   label: 'Urgent & Unimportant',       color: '#5b9bd5', bg: 'rgba(91,155,213,0.07)'  },
  { id: 'q4', priority: 'none', label: 'Not Urgent & Unimportant',   color: '#10b981', bg: 'rgba(16,185,129,0.07)'  },
]

// ── Date grouping ──────────────────────────────────────────────────────────────

const DATE_ORDER = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Upcoming', 'No Date']

function getDateGroup(dueDate: string | null): string {
  if (!dueDate) return 'No Date'
  const d = new Date(dueDate)
  d.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const in7 = new Date(today); in7.setDate(in7.getDate() + 7)
  if (d < today)                         return 'Overdue'
  if (d.getTime() === today.getTime())   return 'Today'
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
  if (d <= in7)                          return 'This Week'
  return 'Upcoming'
}

function groupByDate(tasks: Task[]): { label: string; tasks: Task[] }[] {
  const active    = tasks.filter((t) => t.status === 'active')
  const done      = tasks.filter((t) => t.status !== 'active')
  const map = new Map<string, Task[]>()
  for (const t of active) {
    const g = getDateGroup(t.dueDate)
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(t)
  }
  const groups: { label: string; tasks: Task[] }[] = []
  for (const label of DATE_ORDER) {
    if (map.has(label)) groups.push({ label, tasks: map.get(label)! })
  }
  if (done.length > 0) groups.push({ label: 'Completed', tasks: done })
  return groups
}

// ── Collapsible date-group row ─────────────────────────────────────────────────

function DateGroupHeader({
  label,
  count,
  open,
  onToggle,
  isCompleted,
}: {
  label: string
  count: number
  open: boolean
  onToggle: () => void
  isCompleted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 py-1.5 px-3 text-left group hover:bg-white/4 transition-colors"
    >
      <ChevronDown
        className="h-3.5 w-3.5 text-text-muted shrink-0 transition-transform duration-150"
        style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        strokeWidth={1.75}
      />
      {isCompleted && (
        <CheckCircle2 className="h-3 w-3 text-text-muted shrink-0" strokeWidth={1.75} />
      )}
      <span className="text-[11.5px] font-semibold text-text-muted">{label}</span>
      <span className="text-[11px] text-text-muted opacity-60 ml-0.5">{count}</span>
    </button>
  )
}

// ── Single task row inside a quadrant ─────────────────────────────────────────

function MatrixTaskRow({
  task,
  isSelected,
  onSelect,
  onToggleComplete,
}: {
  task: Task
  isSelected: boolean
  onSelect: () => void
  onToggleComplete: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-0 cursor-pointer transition-colors',
        'hover:bg-white/5',
        isSelected && 'bg-white/7',
      )}
      style={{ height: 36, minHeight: 36 }}
      onClick={onSelect}
    >
      <TaskCheckbox
        checked={task.status === 'completed'}
        priority={task.priority}
        size="sm"
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id) }}
      />
      <span
        className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          task.status !== 'active' ? 'line-through text-text-muted' : 'text-text-primary',
        )}
      >
        {task.title}
      </span>
      {task.list && (
        <span className="shrink-0 text-[10.5px] text-text-muted opacity-60 flex items-center gap-0.5">
          {task.list.icon && <span>{task.list.icon}</span>}
          <span className="truncate max-w-[80px]">{task.list.name}</span>
        </span>
      )}
    </div>
  )
}

// ── Single quadrant panel ─────────────────────────────────────────────────────

function Quadrant({
  priority,
  label,
  color,
  bg,
  tasks,
  selectedTaskId,
  onSelect,
  onToggleComplete,
}: {
  priority: Priority
  label: string
  color: string
  bg: string
  tasks: Task[]
  selectedTaskId: string | null
  onSelect: (t: Task) => void
  onToggleComplete: (id: string) => void
}) {
  const groups = groupByDate(tasks)
  const activeCount = tasks.filter((t) => t.status === 'active').length
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  function toggleGroup(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      style={{ background: bg, borderRadius: 0 }}
    >
      {/* Quadrant header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${color}30` }}
      >
        {/* Colored indicator */}
        <span
          className="inline-flex items-center justify-center rounded-md shrink-0"
          style={{
            width: 22,
            height: 22,
            background: color + '28',
            border: `1.5px solid ${color}60`,
          }}
        >
          {priority === 'p1' && <span style={{ fontSize: 11, lineHeight: 1 }}>!!!</span>}
          {priority === 'p2' && <span style={{ fontSize: 11, lineHeight: 1 }}>!!</span>}
          {priority === 'p3' && <span style={{ fontSize: 11, lineHeight: 1 }}>!</span>}
          {priority === 'none' && <span style={{ fontSize: 10, lineHeight: 1 }}>–</span>}
        </span>
        <span className="text-[13.5px] font-semibold" style={{ color }}>{label}</span>
        <span
          className="ml-auto text-[11px] font-medium"
          style={{ color: color + 'aa' }}
        >
          {activeCount}
        </span>
      </div>

      {/* Task groups */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {groups.length === 0 ? (
          <p className="px-4 py-3 text-[12px] text-text-muted opacity-50">No tasks</p>
        ) : (
          groups.map((group) => {
            const open = !collapsed.has(group.label)
            return (
              <div key={group.label}>
                <DateGroupHeader
                  label={group.label}
                  count={group.tasks.length}
                  open={open}
                  onToggle={() => toggleGroup(group.label)}
                  isCompleted={group.label === 'Completed'}
                />
                {open && (
                  <div style={{ opacity: group.label === 'Completed' ? 0.5 : 1 }}>
                    {group.tasks.map((task) => (
                      <MatrixTaskRow
                        key={task.id}
                        task={task}
                        isSelected={selectedTaskId === task.id}
                        onSelect={() => onSelect(task)}
                        onToggleComplete={onToggleComplete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Main EisenhowerMatrix component ──────────────────────────────────────────

export default function EisenhowerMatrix() {
  const getTasksForView = useDataStore((s) => s.getTasksForView)
  const toggleComplete  = useDataStore((s) => s.toggleComplete)
  const { selectedTaskId, setSelectedTaskId } = useAppStore()

  const allTasks = getTasksForView('matrix', null, null)

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="panel-header flex items-center gap-2 px-5 shrink-0">
        <h2 className="list-panel-title text-text-primary">Eisenhower Matrix</h2>
      </div>

      {/* 2×2 grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 min-h-0 overflow-hidden divide-x divide-y divide-white/5">
        {QUADRANTS.map((q) => {
          const tasks = allTasks.filter((t) => t.priority === q.priority)
          return (
            <Quadrant
              key={q.id}
              {...q}
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelect={(t) => setSelectedTaskId(t.id)}
              onToggleComplete={toggleComplete}
            />
          )
        })}
      </div>
    </div>
  )
}
