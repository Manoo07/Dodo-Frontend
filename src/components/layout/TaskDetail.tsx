import { useEffect, useRef, useState, useCallback } from 'react'
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

export default function TaskDetail() {
  const { selectedTaskId, setSelectedTaskId, setMobilePane } = useAppStore()
  const getTaskWithTree = useDataStore((s) => s.getTaskWithTree)
  const updateTask = useDataStore((s) => s.updateTask)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const deleteTask = useDataStore((s) => s.deleteTask)
  const markWontDo = useDataStore((s) => s.markWontDo)
  const createTask = useDataStore((s) => s.createTask)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [footerMenu, setFooterMenu] = useState<{ x: number; y: number } | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const saveDescriptionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const subtaskRef = useRef<HTMLInputElement>(null)
  const splitRef = useRef<HTMLDivElement>(null)

  const detailNotesHeight = useLayoutStore((s) => s.detailNotesHeight)
  const setDetailNotesHeight = useLayoutStore((s) => s.setDetailNotesHeight)

  const task = selectedTaskId ? getTaskWithTree(selectedTaskId) : undefined
  const breadcrumb = selectedTaskId ? buildBreadcrumb(selectedTaskId) : []

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
  }, [setDetailNotesHeight, selectedTaskId])

  const handleNotesResize = useCallback(
    (deltaY: number) => {
      const containerHeight = splitRef.current?.clientHeight ?? 0
      if (containerHeight <= 0) return
      setDetailNotesHeight(useLayoutStore.getState().detailNotesHeight + deltaY, containerHeight)
    },
    [setDetailNotesHeight],
  )

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description)
    }
  }, [task?.id, task?.title, task?.description])

  useEffect(() => {
    return () => {
      if (saveDescriptionTimer.current) clearTimeout(saveDescriptionTimer.current)
    }
  }, [])

  useEffect(() => {
    if (addingSubtask) subtaskRef.current?.focus()
  }, [addingSubtask])

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

  const isCompleted = task.status === 'completed'
  const isWontDo = task.status === 'wont_do'

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
          onClick={() => setMobilePane('list')}
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
          title="Set priority"
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
          <section className="flex-1 min-h-0">
            <h3 className="subtask-section-header">Subtasks</h3>
            {(task.children && task.children.length > 0) || addingSubtask ? (
              <>
                <ul className="space-y-0">
                  {task.children?.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(child.id)}
                      className="subtask-row"
                    >
                      <TaskCheckbox checked={child.status === 'completed'} size="sm" />
                      <span
                        className={cn(
                          'flex-1 truncate text-text-primary',
                          child.status === 'completed' && 'line-through text-text-muted',
                        )}
                      >
                        {child.title}
                      </span>
                    </button>
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

      <div className="flex items-center justify-between px-5 py-2 border-t border-border shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          {task.list ? (
            <>
              <ClipboardList className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate max-w-40">{task.list.name}</span>
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
            style={task.priority !== 'none' ? { color: PRIORITY_COLORS[task.priority] } : undefined}
          >
            <Flag
              className="nav-icon"
              strokeWidth={1.8}
              fill={task.priority !== 'none' ? PRIORITY_COLORS[task.priority] : 'none'}
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
