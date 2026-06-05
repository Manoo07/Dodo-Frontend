import { useMemo, useState } from 'react'
import { ChevronDown, Printer } from 'lucide-react'
import { useDataStore } from '../../store/useDataStore'
import { useAppStore } from '../../store/useAppStore'
import TaskCheckbox from '../ui/TaskCheckbox'
import type { Task } from '../../types'
import { cn } from '../../lib/cn'

// ── Date helpers ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function toMidnight(d: Date): Date {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function getGroupLabel(completedAt: string | null): string {
  if (!completedAt) return 'Unknown'
  const d   = toMidnight(new Date(completedAt))
  const now = toMidnight(new Date())
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000)
  const day  = DAY_NAMES[d.getDay()]
  if (diff === 0) return `${day}, Today`
  if (diff === 1) return `${day}, Yesterday`
  return `${day}, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

function getGroupSortKey(completedAt: string | null): number {
  if (!completedAt) return 0
  return -new Date(completedAt).getTime()  // most recent first
}

function passesDateFilter(completedAt: string | null, filter: string): boolean {
  if (filter === 'all' || !completedAt) return true
  const d   = new Date(completedAt)
  const now = new Date()
  if (filter === 'today') {
    return d.toDateString() === now.toDateString()
  }
  if (filter === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }
  if (filter === 'month') {
    const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1)
    return d >= monthAgo
  }
  return true
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {current?.label}
        <ChevronDown className="h-3 w-3 text-text-muted" strokeWidth={2} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <div
            className="absolute left-0 top-full mt-1 z-50 py-1 rounded-xl overflow-hidden"
            style={{
              minWidth: 140,
              background: '#26262b',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white/6',
                  o.value === value ? 'text-accent' : 'text-text-primary',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Task row ──────────────────────────────────────────────────────────────────

function CompletedTaskRow({
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
        'flex items-center gap-2 px-4 cursor-pointer transition-colors hover:bg-white/4',
        isSelected && 'bg-white/6',
      )}
      style={{ height: 38, minHeight: 38 }}
      onClick={onSelect}
    >
      <TaskCheckbox
        checked
        priority={task.priority}
        size="sm"
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id) }}
      />
      <span className="flex-1 min-w-0 truncate text-[13.5px] line-through text-text-muted">
        {task.title}
      </span>
      {task.list && (
        <span className="shrink-0 flex items-center gap-1 text-[11px] text-text-muted opacity-60">
          {task.list.icon && <span>{task.list.icon}</span>}
          <span className="truncate max-w-[100px]">{task.list.name}</span>
          {task.children && task.children.length > 0 && (
            <span className="opacity-60">⊟</span>
          )}
        </span>
      )}
    </div>
  )
}

// ── Date group ────────────────────────────────────────────────────────────────

const GROUP_ACCENT = 'var(--color-accent)'

function DateGroup({
  label,
  tasks,
  isOpen,
  onToggle,
  selectedTaskId,
  onSelect,
  onToggleComplete,
}: {
  label: string
  tasks: Task[]
  isOpen: boolean
  onToggle: () => void
  selectedTaskId: string | null
  onSelect: (t: Task) => void
  onToggleComplete: (id: string) => void
}) {
  return (
    <div className="mb-1">
      {/* Group header with accent left border */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/4 transition-colors group"
        style={{ borderLeft: `2.5px solid ${GROUP_ACCENT}` }}
      >
        <ChevronDown
          className="h-3.5 w-3.5 text-text-muted shrink-0 transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          strokeWidth={1.75}
        />
        <span className="text-[13px] font-semibold text-text-primary flex-1">{label}</span>
        <span className="text-[11.5px] font-medium text-text-muted">{tasks.length}</span>
      </button>

      {/* Task rows indented to align with header text */}
      {isOpen && (
        <div style={{ borderLeft: `2.5px solid rgba(255,255,255,0.06)`, marginLeft: 0 }}>
          {tasks.map((task) => (
            <CompletedTaskRow
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
}

// ── Main component ────────────────────────────────────────────────────────────

const DATE_FILTER_OPTIONS = [
  { value: 'all',   label: 'All Dates'   },
  { value: 'today', label: 'Today'       },
  { value: 'week',  label: 'This Week'   },
  { value: 'month', label: 'This Month'  },
]

export default function CompletedView() {
  const tasks          = useDataStore((s) => s.tasks)
  const lists          = useDataStore((s) => s.lists)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const { selectedTaskId, setSelectedTaskId } = useAppStore()

  const [dateFilter, setDateFilter] = useState('all')
  const [listFilter, setListFilter] = useState('all')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  // Build list filter options from lists that have completed tasks
  const listOptions = useMemo(() => {
    const usedIds = new Set(
      tasks.filter((t) => t.status === 'completed').map((t) => t.listId)
    )
    const opts = [{ value: 'all', label: 'All Lists' }]
    for (const l of lists) {
      if (usedIds.has(l.id)) {
        opts.push({ value: l.id, label: `${l.icon ?? ''} ${l.name}`.trim() })
      }
    }
    return opts
  }, [tasks, lists])

  // Filter + enrich tasks
  const filtered = useMemo(() => {
    return tasks
      .filter((t) =>
        t.status === 'completed' &&
        passesDateFilter(t.completedAt, dateFilter) &&
        (listFilter === 'all' || t.listId === listFilter)
      )
      .map((t) => ({
        ...t,
        list: lists.find((l) => l.id === t.listId),
      })) as Task[]
  }, [tasks, lists, dateFilter, listFilter])

  // Group by completion date
  const groups = useMemo(() => {
    const map = new Map<string, { tasks: Task[]; sortKey: number }>()
    for (const t of filtered) {
      const label = getGroupLabel(t.completedAt)
      if (!map.has(label)) {
        map.set(label, { tasks: [], sortKey: getGroupSortKey(t.completedAt) })
      }
      map.get(label)!.tasks.push(t)
    }
    return [...map.entries()]
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .map(([label, { tasks }]) => ({ label, tasks }))
  }, [filtered])

  // Auto-expand first group on initial render
  const firstGroupLabel = groups[0]?.label
  const resolvedOpenGroups = useMemo(() => {
    if (openGroups.size > 0) return openGroups
    if (firstGroupLabel) return new Set([firstGroupLabel])
    return openGroups
  }, [openGroups, firstGroupLabel])

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(
        resolvedOpenGroups.size === 0 && firstGroupLabel
          ? [firstGroupLabel]
          : prev
      )
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="panel-header flex items-center justify-between gap-2 px-5">
        <h2 className="list-panel-title text-text-primary">Completed</h2>
        <button
          type="button"
          className="icon-btn text-text-muted"
          title="Print"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-5 py-2 shrink-0">
        <FilterDropdown
          value={dateFilter}
          options={DATE_FILTER_OPTIONS}
          onChange={setDateFilter}
        />
        <FilterDropdown
          value={listFilter}
          options={listOptions}
          onChange={setListFilter}
        />
      </div>

      {/* Task groups */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-6">
        {groups.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-[13px] text-text-muted opacity-60">No completed tasks</p>
          </div>
        ) : (
          groups.map((group) => (
            <DateGroup
              key={group.label}
              label={group.label}
              tasks={group.tasks}
              isOpen={resolvedOpenGroups.has(group.label)}
              onToggle={() => toggleGroup(group.label)}
              selectedTaskId={selectedTaskId}
              onSelect={(t) => setSelectedTaskId(t.id)}
              onToggleComplete={toggleComplete}
            />
          ))
        )}
      </div>
    </div>
  )
}
