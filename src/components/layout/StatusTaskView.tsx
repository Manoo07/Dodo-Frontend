import { useMemo, useState } from 'react'
import { ChevronDown, Printer, Trash2, Menu } from 'lucide-react'
import { useDataStore } from '../../store/useDataStore'
import { useAppStore } from '../../store/useAppStore'
import TaskCheckbox from '../ui/TaskCheckbox'
import type { Task } from '../../types'
import { cn } from '../../lib/cn'

// ── View configs ──────────────────────────────────────────────────────────────

export type StatusViewKind = 'completed' | 'wontdo' | 'trash'

const VIEW_CONFIG: Record<StatusViewKind, {
  title: string
  taskStatus: string
  dateField: 'completedAt' | 'updatedAt'
  accentColor: string
  emptyMessage: string
  showFilters: boolean
  actionIcon: 'print' | 'emptyTrash' | null
}> = {
  completed: {
    title: 'Completed',
    taskStatus: 'completed',
    dateField: 'completedAt',
    accentColor: 'var(--color-accent)',
    emptyMessage: 'No completed tasks yet',
    showFilters: true,
    actionIcon: 'print',
  },
  wontdo: {
    title: "Won't Do",
    taskStatus: 'wont_do',
    dateField: 'updatedAt',
    accentColor: '#636369',
    emptyMessage: "No tasks marked as Won't Do",
    showFilters: true,
    actionIcon: null,
  },
  trash: {
    title: 'Trash',
    taskStatus: 'deleted',
    dateField: 'updatedAt',
    accentColor: '#e05252',
    emptyMessage: 'Trash is empty',
    showFilters: false,
    actionIcon: 'emptyTrash',
  },
}

// ── Date helpers ───────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function toMidnight(d: Date): Date {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c
}

function getGroupLabel(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const d   = toMidnight(new Date(dateStr))
  const now = toMidnight(new Date())
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000)
  const day  = DAY_NAMES[d.getDay()]
  if (diff === 0) return `${day}, Today`
  if (diff === 1) return `${day}, Yesterday`
  return `${day}, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

function passesDateFilter(dateStr: string | null, filter: string): boolean {
  if (filter === 'all' || !dateStr) return true
  const d = new Date(dateStr); const now = new Date()
  if (filter === 'today') return d.toDateString() === now.toDateString()
  if (filter === 'week')  { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w }
  if (filter === 'month') { const m = new Date(now); m.setMonth(m.getMonth() - 1); return d >= m }
  return true
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

function FilterDropdown({ value, options, onChange }: {
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
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {current?.label}
        <ChevronDown className="h-3.5 w-3.5 text-text-muted" strokeWidth={2} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1 z-50 py-1 rounded-xl overflow-hidden"
            style={{ minWidth: 140, background: '#26262b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={cn('w-full text-left px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:bg-white/6', o.value === value ? 'text-accent' : 'text-text-primary')}
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

function StatusTaskRow({ task, isSelected, onSelect, onAction, kind }: {
  task: Task
  isSelected: boolean
  onSelect: () => void
  onAction: (id: string) => void
  kind: StatusViewKind
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 cursor-pointer transition-colors px-5',
        'hover:bg-white/4',
        isSelected && 'bg-white/6',
      )}
      style={{ minHeight: 48, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      onClick={onSelect}
    >
      <TaskCheckbox
        checked={kind !== 'trash'}
        priority={task.priority}
        size="md"
        onClick={(e) => { e.stopPropagation(); onAction(task.id) }}
      />
      <span className={cn(
        'flex-1 min-w-0 truncate text-[14px]',
        kind !== 'trash' ? 'line-through text-text-muted' : 'text-text-primary',
      )}>
        {task.title}
      </span>
      {task.list && (
        <span className="shrink-0 flex items-center gap-1 text-[12px] text-text-muted opacity-60">
          {task.list.icon && <span>{task.list.icon}</span>}
          <span className="truncate max-w-30">{task.list.name}</span>
        </span>
      )}
    </div>
  )
}

// ── Date group ────────────────────────────────────────────────────────────────

function DateGroup({ label, tasks, isOpen, onToggle, accentColor, selectedTaskId, onSelect, onAction, kind }: {
  label: string
  tasks: Task[]
  isOpen: boolean
  onToggle: () => void
  accentColor: string
  selectedTaskId: string | null
  onSelect: (t: Task) => void
  onAction: (id: string) => void
  kind: StatusViewKind
}) {
  return (
    <div className="mb-1">
      {/* Header — plain white, no accent tint */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 text-left px-5 py-3 transition-colors hover:bg-white/4"
      >
        <ChevronDown
          className="h-4 w-4 text-text-muted shrink-0 transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          strokeWidth={2}
        />
        <span className="flex-1 text-[14px] font-bold text-text-primary">{label}</span>
        <span className="text-[13px] font-medium text-text-muted tabular-nums">{tasks.length}</span>
      </button>

      {/* Task rows — left border here only */}
      {isOpen && (
        <div style={{ borderLeft: `4px solid ${accentColor}` }}>
          {tasks.map((task) => (
            <StatusTaskRow
              key={task.id}
              task={task}
              kind={kind}
              isSelected={selectedTaskId === task.id}
              onSelect={() => onSelect(task)}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const DATE_FILTER_OPTIONS = [
  { value: 'all',   label: 'All Dates'  },
  { value: 'today', label: 'Today'      },
  { value: 'week',  label: 'This Week'  },
  { value: 'month', label: 'This Month' },
]

export default function StatusTaskView({ kind }: { kind: StatusViewKind }) {
  const cfg = VIEW_CONFIG[kind]

  const tasks          = useDataStore((s) => s.tasks)
  const lists          = useDataStore((s) => s.lists)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const restoreTask    = useDataStore((s) => s.restoreTask)
  const emptyTrash     = useDataStore((s) => s.emptyTrash)
  const { selectedTaskId, setSelectedTaskId } = useAppStore()

  // Default to 'week' for filtered views so the list isn't overwhelming on first load.
  // Trash shows everything (no date filter).
  const [dateFilter, setDateFilter] = useState(cfg.showFilters ? 'week' : 'all')
  const [listFilter, setListFilter] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [initGroup,  setInitGroup]  = useState<string | null>(null)

  const effectiveDateFilter = showAll ? 'all' : dateFilter

  const listOptions = useMemo(() => {
    const usedIds = new Set(tasks.filter((t) => t.status === cfg.taskStatus).map((t) => t.listId))
    return [
      { value: 'all', label: 'All Lists' },
      ...lists.filter((l) => usedIds.has(l.id)).map((l) => ({ value: l.id, label: `${l.icon ?? ''} ${l.name}`.trim() })),
    ]
  }, [tasks, lists, cfg.taskStatus])

  // All matching tasks (no date/list filter) — used to compute the hidden count
  const allMatchingCount = useMemo(() =>
    tasks.filter((t) => t.status === cfg.taskStatus).length,
  [tasks, cfg.taskStatus])

  const filtered = useMemo(() => {
    const dateField = cfg.dateField
    return tasks
      .filter((t) =>
        t.status === cfg.taskStatus &&
        passesDateFilter(t[dateField], effectiveDateFilter) &&
        (listFilter === 'all' || t.listId === listFilter),
      )
      .map((t) => ({ ...t, list: lists.find((l) => l.id === t.listId) })) as Task[]
  }, [tasks, lists, cfg, effectiveDateFilter, listFilter])

  const groups = useMemo(() => {
    const dateField = cfg.dateField
    const map = new Map<string, { tasks: Task[]; sortMs: number }>()
    for (const t of filtered) {
      const label = getGroupLabel(t[dateField])
      if (!map.has(label)) map.set(label, { tasks: [], sortMs: -(new Date(t[dateField] ?? 0).getTime()) })
      map.get(label)!.tasks.push(t)
    }
    return [...map.entries()].sort((a, b) => a[1].sortMs - b[1].sortMs).map(([label, { tasks }]) => ({ label, tasks }))
  }, [filtered, cfg.dateField])

  const hiddenCount = allMatchingCount - filtered.length

  function isOpen(label: string): boolean {
    const first = groups[0]?.label
    if (openGroups.size === 0 && initGroup === null) return label === first
    return openGroups.has(label)
  }

  function toggleGroup(label: string) {
    if (openGroups.size === 0 && initGroup === null) {
      const first = groups[0]?.label
      setInitGroup(first ?? null)
      const s = new Set<string>()
      if (first && first !== label) s.add(first)
      if (label !== first) s.add(label)
      else {/* first was open, now closing it — leave empty */}
      setOpenGroups(s)
    } else {
      setOpenGroups((prev) => {
        const next = new Set(prev)
        if (next.has(label)) next.delete(label)
        else next.add(label)
        return next
      })
    }
  }

  function handleAction(id: string) {
    if (kind === 'completed') toggleComplete(id)
    else if (kind === 'wontdo') toggleComplete(id) // re-activates the task
    else if (kind === 'trash') restoreTask(id)
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
      {/* Header */}
      <div className="panel-header flex items-center justify-between gap-2 px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => useAppStore.getState().setMobilePane('sidebar')}
            className="icon-btn lg:hidden shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <h2 className="list-panel-title text-text-primary">{cfg.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          {cfg.actionIcon === 'print' && (
            <button type="button" className="icon-btn text-text-muted" title="Print" onClick={() => window.print()}>
              <Printer className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
          {cfg.actionIcon === 'emptyTrash' && filtered.length > 0 && (
            <button
              type="button"
              onClick={() => emptyTrash()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-priority-p1 hover:bg-priority-p1/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {cfg.showFilters && (
        <div className="flex items-center gap-3 px-5 py-3 shrink-0">
          <FilterDropdown value={dateFilter} options={DATE_FILTER_OPTIONS} onChange={setDateFilter} />
          <FilterDropdown value={listFilter} options={listOptions} onChange={setListFilter} />
        </div>
      )}

      {/* Groups */}
      <div className="flex-1 overflow-y-auto min-h-0 pt-1 pb-6">
        {groups.length === 0 && hiddenCount === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-[13px] text-text-muted opacity-50">{cfg.emptyMessage}</p>
          </div>
        ) : (
          <>
            {groups.map((group) => (
              <DateGroup
                key={group.label}
                label={group.label}
                tasks={group.tasks}
                isOpen={isOpen(group.label)}
                onToggle={() => toggleGroup(group.label)}
                accentColor={cfg.accentColor}
                selectedTaskId={selectedTaskId}
                onSelect={(t) => setSelectedTaskId(t.id)}
                onAction={handleAction}
                kind={kind}
              />
            ))}

            {/* Load more — shown when older tasks are hidden */}
            {hiddenCount > 0 && !showAll && (
              <div className="flex items-center justify-between px-5 py-3 mt-1">
                <span className="text-[12px] text-text-muted opacity-60">
                  {hiddenCount} older {hiddenCount === 1 ? 'task' : 'tasks'} not shown
                </span>
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  Load more →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
