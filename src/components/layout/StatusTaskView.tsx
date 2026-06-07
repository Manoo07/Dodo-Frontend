import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Printer, Trash2, Menu, RefreshCw } from 'lucide-react'
import { useDataStore } from '../../store/useDataStore'
import { useAppStore } from '../../store/useAppStore'
import TaskCheckbox from '../ui/TaskCheckbox'
import { LIST_ICON_MAP } from '../ui/ListIconPicker'
import type { Task } from '../../types'
import { cn } from '../../lib/cn'

function ListIconSmall({ iconKey }: { iconKey: string }) {
  const Icon = LIST_ICON_MAP[iconKey]
  if (Icon) return <Icon className="h-3 w-3" strokeWidth={1.75} />
  return <span className="text-[12px] leading-none">{iconKey}</span>
}

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
    accentColor: '#22C55E',           // [Ticket #1] green per approved wireframe
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


// ── Recursive count helper (Ticket #5) ───────────────────────────────────────

function countAll(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + 1 + countAll(t.children ?? []), 0)
}


// ── Task row — recursive with expand/collapse (Tickets #2 #3 #4 #6 #9) ────────

function StatusTaskRow({ task, kind, depth = 0, selectedTaskId, onSelect, onAction }: {
  task: Task
  kind: StatusViewKind
  depth?: number
  selectedTaskId: string | null
  onSelect: (task: Task) => void
  onAction: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = !!(task.children && task.children.length > 0)
  const isSelected  = task.id === selectedTaskId

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 cursor-pointer transition-colors pr-4',
          'hover:bg-white/3',
          isSelected && 'bg-white/5',
        )}
        style={{ height: 40, paddingLeft: `${16 + depth * 24}px` }}
        onClick={() => onSelect(task)}
      >
        {/* [Ticket #4] Expand/collapse chevron for parent tasks */}
        <button
          type="button"
          className={cn(
            'shrink-0 flex items-center justify-center text-text-muted transition-all hover:text-text-secondary',
            !hasChildren && 'opacity-0 pointer-events-none',
          )}
          style={{ width: 18, height: 18 }}
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
        >
          <ChevronRight
            className={cn('h-3.5 w-3.5 transition-transform duration-150', expanded && 'rotate-90')}
            strokeWidth={1.75}
          />
        </button>

        <TaskCheckbox
          checked={kind !== 'trash'}
          priority={task.priority}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onAction(task.id) }}
        />

        {/* [Ticket #2] No strikethrough for completed — checkbox conveys done state */}
        <span className={cn(
          'flex-1 min-w-0 truncate text-[13px]',
          kind === 'wontdo' ? 'line-through opacity-45 text-text-secondary' :
          kind === 'trash'  ? 'text-text-primary' :
          'text-text-secondary opacity-80',
        )}>
          {task.title}
        </span>

        {/* [Ticket #6] List icon + name */}
        {task.list && (
          <span className="shrink-0 flex items-center gap-1 text-[11px] text-text-muted opacity-40 mr-1 max-w-25">
            {task.list.icon && <ListIconSmall iconKey={task.list.icon} />}
            <span className="truncate">{task.list.name}</span>
          </span>
        )}

        {/* [Ticket #9] Recurrence icon — shown when task.recurrence is set */}
        {task.recurrence && (
          <RefreshCw className="h-3 w-3 shrink-0 text-text-muted opacity-35" strokeWidth={1.75} />
        )}
      </div>

      {/* [Ticket #3] Children rendered with incremented depth */}
      {expanded && hasChildren && task.children!.map(child => (
        <StatusTaskRow
          key={child.id}
          task={child}
          kind={kind}
          depth={depth + 1}
          selectedTaskId={selectedTaskId}
          onSelect={onSelect}
          onAction={onAction}
        />
      ))}
    </>
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
  // [Ticket #5] Recursive count includes all descendants
  const total = countAll(tasks)

  return (
    // [Ticket #1] Left accent bar spans full group (header + rows)
    <div style={{ borderLeft: `3px solid ${accentColor}` }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 text-left px-4 py-4 transition-colors hover:bg-white/4"
      >
        <ChevronDown
          className="h-3.5 w-3.5 text-text-muted shrink-0 transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          strokeWidth={1.75}
        />
        <span className="flex-1 text-[13px] font-semibold text-text-primary">{label}</span>
        <span className="text-[12px] font-medium text-text-muted tabular-nums opacity-60">{total}</span>
      </button>

      {isOpen && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 2 }}>
          {tasks.map(task => (
            <StatusTaskRow
              key={task.id}
              task={task}
              kind={kind}
              depth={0}
              selectedTaskId={selectedTaskId}
              onSelect={onSelect}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────


export default function StatusTaskView({ kind }: { kind: StatusViewKind }) {
  const cfg = VIEW_CONFIG[kind]

  const tasks          = useDataStore((s) => s.tasks)
  const lists          = useDataStore((s) => s.lists)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const restoreTask    = useDataStore((s) => s.restoreTask)
  const emptyTrash     = useDataStore((s) => s.emptyTrash)
  const { selectedTaskId, setSelectedTaskId } = useAppStore()

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [initGroup,  setInitGroup]  = useState<string | null>(null)

  const filtered = useMemo(() =>
    tasks
      .filter((t) => t.status === cfg.taskStatus)
      .map((t) => ({ ...t, list: lists.find((l) => l.id === t.listId) })) as Task[],
  [tasks, lists, cfg.taskStatus])

  // [Ticket #5] Build parent-child tree from flat filtered list
  const rootTasks = useMemo(() => {
    const ids = new Set(filtered.map(t => t.id))
    const childrenByParent = new Map<string, Task[]>()
    for (const t of filtered) childrenByParent.set(t.id, [])

    const roots: Task[] = []
    for (const t of filtered) {
      if (t.parentId && ids.has(t.parentId)) {
        childrenByParent.get(t.parentId)!.push(t)
      } else {
        roots.push(t)
      }
    }

    function buildNode(task: Task): Task {
      return { ...task, children: (childrenByParent.get(task.id) ?? []).map(buildNode) }
    }

    return roots.map(buildNode)
  }, [filtered])

  const groups = useMemo(() => {
    const dateField = cfg.dateField
    const map = new Map<string, { tasks: Task[]; sortMs: number }>()
    for (const t of rootTasks) {
      const label = getGroupLabel(t[dateField])
      if (!map.has(label)) map.set(label, { tasks: [], sortMs: -(new Date(t[dateField] ?? 0).getTime()) })
      map.get(label)!.tasks.push(t)
    }
    return [...map.entries()]
      .sort((a, b) => a[1].sortMs - b[1].sortMs)
      .map(([label, { tasks }]) => ({ label, tasks }))
  }, [rootTasks, cfg.dateField])

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
    else if (kind === 'wontdo') toggleComplete(id)
    else if (kind === 'trash') restoreTask(id)
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">

      {/* [Ticket #8] Header: [≡] Title [action] */}
      <div className="panel-header flex items-center justify-between gap-2 px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger always visible (not just mobile) */}
          <button
            type="button"
            onClick={() => useAppStore.getState().setMobilePane('sidebar')}
            className="icon-btn shrink-0"
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


      {/* Groups */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        {groups.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <p className="text-[13px] text-text-muted opacity-50">{cfg.emptyMessage}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-7 pt-3">
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
          </div>
        )}
      </div>
    </div>
  )
}
