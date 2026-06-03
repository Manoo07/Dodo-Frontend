import { useEffect, useRef, useState, useCallback } from 'react'
import TaskDetailSkeleton from './TaskDetailSkeleton'
import {
  ChevronRight,
  Calendar,
  Flag,
  MoreHorizontal,
  ArrowLeft,
  MessageSquare,
  AlignJustify,
  Plus,
  ClipboardList,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useDataStore } from '../../store/useDataStore'
import { useLayoutStore } from '../../store/useLayoutStore'
import TaskCheckbox from '../ui/TaskCheckbox'
import IconButton from '../ui/IconButton'
import DatePicker from '../ui/DatePicker'
import PanelResizer from './PanelResizer'
import TaskContextMenu from '../task/TaskContextMenu'
import { buildTaskMenuItems } from '../task/taskMenuBuilder'
import MarkdownEditor from '../ui/MarkdownEditor'
import { cn } from '../../lib/cn'
import type { Priority } from '../../types'

const PRIORITY_COLORS: Record<Priority, string> = {
  p1: 'var(--color-priority-p1)',
  p2: 'var(--color-priority-p2)',
  p3: 'var(--color-priority-p3)',
  none: 'var(--color-priority-p4)',
}

const PRIORITY_CYCLE: Priority[] = ['none', 'p1', 'p2', 'p3']

function buildBreadcrumb(taskId: string): { id: string; title: string }[] {
  const tasks = useDataStore.getState().tasks
  const chain: { id: string; title: string }[] = []
  let current = tasks.find((t) => t.id === taskId)

  while (current?.parentId) {
    const parent = tasks.find((t) => t.id === current!.parentId)
    if (!parent) break
    chain.unshift({ id: parent.id, title: parent.title })
    current = parent
  }

  return chain
}

// ── Shell: handles empty / not-found states, then mounts the real panel ──────
export default function TaskDetail() {
  const { selectedTaskId, setMobilePane } = useAppStore()
  const getTaskWithTree = useDataStore((s) => s.getTaskWithTree)
  const hydrated = useDataStore((s) => s.hydrated)
  const task = selectedTaskId ? getTaskWithTree(selectedTaskId) : undefined

  if (!hydrated) return <TaskDetailSkeleton />

  if (!selectedTaskId) {
    return (
      <main className="flex-1 flex flex-col bg-bg-primary">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl opacity-20">📝</span>
            <span className="text-sm text-text-muted">Select a task to view details</span>
          </div>
        </div>
      </main>
    )
  }

  if (!task) {
    return (
      <main className="flex-1 flex items-center justify-center bg-bg-primary">
        <span className="text-sm text-text-muted">Task not found</span>
      </main>
    )
  }

  // key={task.id} forces a full remount when task changes — all useState
  // initialisers re-run with fresh values, so stale description can never
  // bleed from a parent into a child task.
  return <TaskDetailContent key={task.id} task={task} onBack={() => setMobilePane('list')} />
}

// ── Real content panel — remounts on every task.id change ────────────────────
function TaskDetailContent({
  task,
  onBack,
}: {
  task: NonNullable<ReturnType<ReturnType<typeof useDataStore.getState>['getTaskWithTree']>>
  onBack: () => void
}) {
  const { setSelectedTaskId } = useAppStore()
  const updateTask    = useDataStore((s) => s.updateTask)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const deleteTask    = useDataStore((s) => s.deleteTask)
  const restoreTask   = useDataStore((s) => s.restoreTask)
  const markWontDo    = useDataStore((s) => s.markWontDo)
  const createTask    = useDataStore((s) => s.createTask)

  // Initialise from task — correct because this component remounts per task.id
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('')
  const [footerMenu, setFooterMenu] = useState<{ x: number; y: number } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const saveDescriptionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subtaskRef = useRef<HTMLInputElement>(null)
  const editingSubtaskRef = useRef<HTMLInputElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)

  const detailNotesHeight = useLayoutStore((s) => s.detailNotesHeight)
  const setDetailNotesHeight = useLayoutStore((s) => s.setDetailNotesHeight)

  // Re-read live task data (children, tags, etc.) — but use local state for editing fields
  const getTaskWithTree = useDataStore((s) => s.getTaskWithTree)
  const liveTask = getTaskWithTree(task.id) ?? task
  const breadcrumb = buildBreadcrumb(task.id)

  useEffect(() => {
    const el = splitRef.current
    if (!el) return

    const clampNotes = () => {
      const h = el.clientHeight
      if (h > 0) {
        setDetailNotesHeight(useLayoutStore.getState().detailNotesHeight, h)
      }
    }

    clampNotes()
    const ro = new ResizeObserver(clampNotes)
    ro.observe(el)
    return () => ro.disconnect()
  }, [setDetailNotesHeight, task.id])

  const handleNotesResize = useCallback(
    (deltaY: number) => {
      const containerHeight = splitRef.current?.clientHeight ?? 0
      if (containerHeight <= 0) return
      setDetailNotesHeight(useLayoutStore.getState().detailNotesHeight + deltaY, containerHeight)
    },
    [setDetailNotesHeight],
  )


  useEffect(() => {
    return () => {
      if (saveDescriptionTimer.current) clearTimeout(saveDescriptionTimer.current)
    }
  }, [])

  useEffect(() => {
    if (addingSubtask) subtaskRef.current?.focus()
  }, [addingSubtask])

  // Re-focus editing input when tab becomes visible again (cursor persistence)
  useEffect(() => {
    function onVisibilityChange() {
      if (!document.hidden && editingSubtaskId) {
        editingSubtaskRef.current?.focus()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [editingSubtaskId])

  function startEditSubtask(id: string, title: string) {
    setEditingSubtaskId(id)
    setEditingSubtaskTitle(title)
    setAddingSubtask(false)
  }

  function saveSubtaskEdit(id: string) {
    const trimmed = editingSubtaskTitle.trim()
    if (trimmed) updateTask(id, { title: trimmed })
    setEditingSubtaskId(null)
  }

  function saveTitle() {
    if (!task || title.trim() === task.title) return
    updateTask(task.id, { title: title.trim() })
  }

  function saveDescription() {
    if (!task || description === task.description) return
    updateTask(task.id, { description })
  }

  function handleDescriptionChange(next: string) {
    setDescription(next)
    if (saveDescriptionTimer.current) clearTimeout(saveDescriptionTimer.current)
    saveDescriptionTimer.current = setTimeout(() => {
      if (task && next !== task.description) updateTask(task.id, { description: next })
    }, 600)
  }

  function handleDescriptionBlur() {
    if (saveDescriptionTimer.current) {
      clearTimeout(saveDescriptionTimer.current)
      saveDescriptionTimer.current = null
    }
    saveDescription()
  }

  function cyclePriority() {
    if (!task) return
    const idx = PRIORITY_CYCLE.indexOf(task.priority)
    const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]
    updateTask(task.id, { priority: next })
  }

  function formatDueLabel(d: string | null): string {
    if (!d) return 'Due Date'
    const date = new Date(d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const due = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    if (due.getTime() === today.getTime()) return 'Today'
    if (due.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function commitSubtask() {
    if (!task) return
    if (subtaskTitle.trim()) {
      createTask({ title: subtaskTitle.trim(), listId: task.listId, parentId: task.id })
      setSubtaskTitle('')
      setAddingSubtask(false)
    } else {
      setAddingSubtask(false)
    }
  }

  const isCompleted = liveTask.status === 'completed'
  const isWontDo    = liveTask.status === 'wont_do'

  const footerMenuItems = buildTaskMenuItems({
    onAddSubtask: () => setAddingSubtask(true),
    onMarkWontDo: () => markWontDo(task.id),
    onPin: () => updateTask(task.id, { isPinned: !task.isPinned }),
    isPinned: task.isPinned,
    onDelete: () => {
      deleteTask(task.id)
      setSelectedTaskId(null)
    },
  })

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-bg-primary overflow-hidden">
      <div className="detail-toolbar">
        <button
          type="button"
          onClick={onBack}
          className="icon-btn lg:hidden shrink-0"
          aria-label="Back to task list"
        >
          <ArrowLeft className="nav-icon" strokeWidth={1.8} />
        </button>

        <TaskCheckbox
          checked={isCompleted}
          priority={task.priority}
          onClick={() => toggleComplete(task.id)}
        />

        <div className="w-px h-4 bg-border shrink-0" />

        <div className="relative flex items-center h-full">
          <button
            type="button"
            onClick={() => setShowDatePicker((v) => !v)}
            className={cn(
              'detail-due-btn',
              task.dueDate ? 'text-accent' : 'text-text-muted hover:text-text-primary',
            )}
          >
            <Calendar className="nav-icon" strokeWidth={1.8} />
            <span>{formatDueLabel(task.dueDate)}</span>
          </button>
          {showDatePicker && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40"
                aria-label="Close date picker"
                onClick={() => setShowDatePicker(false)}
              />
              <div className="absolute left-0 top-full mt-2 z-50">
                <DatePicker
                  value={task.dueDate}
                  onChange={(iso) => updateTask(task.id, { dueDate: iso })}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          title={
            task.priority === 'none' ? 'Set priority'
            : task.priority === 'p1' ? 'Priority: High — click to change'
            : task.priority === 'p2' ? 'Priority: Medium — click to change'
            : 'Priority: Low — click to change'
          }
          onClick={cyclePriority}
          className="icon-btn"
          style={task.priority !== 'none' ? { color: PRIORITY_COLORS[task.priority] } : undefined}
        >
          <Flag
            className="nav-icon"
            strokeWidth={1.8}
            fill={task.priority !== 'none' ? PRIORITY_COLORS[task.priority] : 'none'}
          />
        </button>
      </div>

      <div ref={splitRef} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top pane: title, tags, markdown description */}
        <div
          className="detail-notes-pane detail-panel-content flex flex-col"
          style={{ height: detailNotesHeight }}
        >
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 mb-3 text-xs text-text-muted flex-wrap">
              {breadcrumb.map((item, i) => (
                <span key={item.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTaskId(item.id)}
                    className="hover:text-accent transition-colors truncate max-w-40 font-medium"
                  >
                    {item.title}
                  </button>
                  {i < breadcrumb.length - 1 && (
                    <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2} />
                  )}
                </span>
              ))}
              <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2} />
            </nav>
          )}

          <div className="flex items-center gap-2">
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  titleRef.current?.blur()
                }
              }}
              rows={1}
              className={cn(
                'detail-panel-title flex-1 bg-transparent outline-none resize-none overflow-hidden',
                isCompleted || isWontDo ? 'line-through text-text-muted' : 'text-text-primary',
              )}
            />
            <IconButton icon={AlignJustify} label="Notes" size="sm" className="shrink-0" />
          </div>

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {task.tags.map((tt) => (
                <span
                  key={tt.tagId}
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: tt.tag.color + '22', color: tt.tag.color }}
                >
                  #{tt.tag.name}
                </span>
              ))}
            </div>
          )}

          <MarkdownEditor
            editorKey={task.id}
            value={description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
          />
        </div>

        <PanelResizer
          orientation="horizontal"
          label="Resize description area"
          onDrag={handleNotesResize}
        />

        {/* Bottom pane: subtasks */}
        <div className="detail-subtasks-pane detail-panel-content">
          <section>
            <h3 className="subtask-section-header">Subtasks</h3>
            {(task.children && task.children.length > 0) || addingSubtask ? (
              <>
                <ul className="space-y-1 relative">
                  {/* Vertical connector line at checkbox column */}
                  {task.children && task.children.length > 0 && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none"
                      style={{ left: 6, width: 1, background: 'rgba(255,255,255,0.08)' }}
                    />
                  )}
                  {task.children?.map((child) => (
                    <li key={child.id}>
                      {editingSubtaskId === child.id ? (
                        /* ── Inline edit mode ── */
                        <div className="subtask-row">
                          <TaskCheckbox
                            checked={child.status === 'completed'}
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleComplete(child.id) }}
                          />
                          <input
                            ref={editingSubtaskRef}
                            autoFocus
                            value={editingSubtaskTitle}
                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                            onBlur={() => saveSubtaskEdit(child.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); saveSubtaskEdit(child.id) }
                              if (e.key === 'Escape') setEditingSubtaskId(null)
                            }}
                            className="flex-1 bg-transparent text-sm text-text-primary outline-none border-b border-accent"
                          />
                        </div>
                      ) : (
                        /* ── Normal view mode ── */
                        <div className="subtask-row group">
                          <TaskCheckbox
                            checked={child.status === 'completed'}
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); toggleComplete(child.id) }}
                          />
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => startEditSubtask(child.id, child.title)}
                            onKeyDown={(e) => e.key === 'Enter' && startEditSubtask(child.id, child.title)}
                            className={cn(
                              'flex-1 truncate text-sm cursor-text select-none',
                              child.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary',
                            )}
                          >
                            {child.title}
                          </span>
                          {/* Open subtask detail */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedTaskId(child.id) }}
                            className="icon-btn shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
                            title="Open subtask"
                          >
                            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                          {/* Delete subtask */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteTask(child.id) }}
                            className="icon-btn shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity text-priority-p1 hover:bg-priority-p1/10"
                            title="Delete subtask"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
              </ul>

              {addingSubtask && (
                <div className="subtask-row mt-0.5">
                  <TaskCheckbox size="sm" />
                  <input
                    ref={subtaskRef}
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitSubtask()
                      if (e.key === 'Escape') {
                        setSubtaskTitle('')
                        setAddingSubtask(false)
                      }
                    }}
                    onBlur={commitSubtask}
                    placeholder="Subtask title…"
                    className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted placeholder:opacity-45 outline-none"
                  />
                </div>
              )}
              </>
            ) : null}
          </section>

          <button type="button" onClick={() => setAddingSubtask(true)} className="add-subtask-link shrink-0">
            <Plus className="nav-icon" strokeWidth={1.8} />
            Add Subtask
          </button>
        </div>
      </div>

      {/* Footer — shows Restore/Delete for completed tasks, normal actions for active */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-border shrink-0">
        {isCompleted || isWontDo ? (
          /* ── Completed / Won't Do footer ── */
          <>
            <button
              type="button"
              onClick={() => {
                restoreTask(liveTask.id)
                toggleComplete(liveTask.id)
              }}
              className="flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-accent transition-colors"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
              Restore
            </button>
            <button
              type="button"
              title="Delete permanently"
              onClick={() => {
                deleteTask(liveTask.id)
                setSelectedTaskId(null)
              }}
              className="icon-btn text-text-muted hover:text-priority-p1 transition-colors"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </>
        ) : (
          /* ── Active task footer ── */
          <>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              {liveTask.list ? (
                <>
                  <ClipboardList className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate max-w-40">{liveTask.list.name}</span>
                </>
              ) : (
                <ClipboardList className="h-3.5 w-3.5 shrink-0 opacity-50" strokeWidth={1.75} />
              )}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                title="Set priority"
                onClick={cyclePriority}
                className="icon-btn"
                style={liveTask.priority !== 'none' ? { color: PRIORITY_COLORS[liveTask.priority] } : undefined}
              >
                <Flag
                  className="nav-icon"
                  strokeWidth={1.8}
                  fill={liveTask.priority !== 'none' ? PRIORITY_COLORS[liveTask.priority] : 'none'}
                />
              </button>
              <IconButton icon={MessageSquare} label="Comments" size="sm" />
              <button
                type="button"
                title="More options"
                className="icon-btn"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setFooterMenu({ x: rect.left, y: rect.top - 10 })
                }}
              >
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </>
        )}
      </div>

      {footerMenu && (
        <TaskContextMenu
          x={footerMenu.x}
          y={footerMenu.y}
          items={footerMenuItems}
          onClose={() => setFooterMenu(null)}
        />
      )}
    </main>
  )
}
