import { useMemo, useState } from 'react'
import { ArrowUpDown, MoreHorizontal, Menu, ListTodo, Trash2, RotateCcw, GripVertical, CheckCircle2, ChevronDown, Plus } from 'lucide-react'
import TaskListSkeleton from './TaskListSkeleton'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import SortableItem from '../ui/SortableItem'
import { useAppStore } from '../../store/useAppStore'
import { useDataStore } from '../../store/useDataStore'
import TaskItem from '../task/TaskItem'
import AddTaskBar from '../task/AddTaskBar'
import AddSectionBar from '../task/AddSectionBar'
import SectionHeader from '../task/SectionHeader'
import EmptyState from '../ui/EmptyState'
import IconButton from '../ui/IconButton'
import type { Section, Task } from '../../types'

function flattenTree(tasks: Task[], depth = 0, expandedIds: Set<string>): { task: Task; depth: number }[] {
  const result: { task: Task; depth: number }[] = []
  for (const task of tasks) {
    result.push({ task, depth })
    if (task.children?.length && expandedIds.has(task.id)) {
      result.push(...flattenTree(task.children, depth + 1, expandedIds))
    }
  }
  return result
}

/** Recursively collect every task ID that has children (all depths). */
function collectExpandableIds(tasks: Task[], ids = new Set<string>()): Set<string> {
  for (const task of tasks) {
    if (task.children?.length) {
      ids.add(task.id)
      collectExpandableIds(task.children, ids)
    }
  }
  return ids
}

/** Return the list of ancestor IDs from root down to (but not including) targetId. */
function findAncestorIds(targetId: string, tasks: Task[], path: string[] = []): string[] | null {
  for (const task of tasks) {
    if (task.id === targetId) return path
    if (task.children?.length) {
      const found = findAncestorIds(targetId, task.children, [...path, task.id])
      if (found) return found
    }
  }
  return null
}

function getViewTitle(view: string, listName?: string, tagName?: string): string {
  if (tagName) return `#${tagName}`
  if (view === 'today') return 'Today'
  if (view === 'next7days') return 'Next 7 Days'
  if (view === 'inbox') return 'Inbox'
  if (view === 'completed') return 'Completed'
  if (view === 'trash') return 'Trash'
  return listName ?? 'Tasks'
}

interface TaskGroup {
  id: string
  name: string
  tasks: Task[]
}

function groupTasksBySection(tasks: Task[], sections: Section[]): TaskGroup[] {
  const groups: TaskGroup[] = []
  const unsectioned = tasks.filter((t) => !t.sectionId)
  if (unsectioned.length > 0 || sections.length === 0) {
    groups.push({ id: '__unsectioned', name: 'Not Sectioned', tasks: unsectioned })
  }
  for (const section of sections) {
    const sectionTasks = tasks.filter((t) => t.sectionId === section.id)
    groups.push({ id: section.id, name: section.name, tasks: sectionTasks })
  }
  return groups
}

export default function TaskList() {
  const {
    selectedView,
    selectedListId,
    selectedTagId,
    setSelectedTaskId,
    selectedTaskId,
    setMobilePane,
  } = useAppStore()

  const lists = useDataStore((s) => s.lists)
  const tags = useDataStore((s) => s.tags)
  const tasksFlat = useDataStore((s) => s.tasks)
  const sectionsFlat = useDataStore((s) => s.sections)
  const getTasksForView = useDataStore((s) => s.getTasksForView)
  const getListById = useDataStore((s) => s.getListById)
  const createTask = useDataStore((s) => s.createTask)
  const updateTask = useDataStore((s) => s.updateTask)
  const createSection = useDataStore((s) => s.createSection)
  const updateSection = useDataStore((s) => s.updateSection)
  const deleteSection = useDataStore((s) => s.deleteSection)
  const reorderSection = useDataStore((s) => s.reorderSection)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const deleteTask = useDataStore((s) => s.deleteTask)
  const restoreTask = useDataStore((s) => s.restoreTask)
  const permanentDeleteTask = useDataStore((s) => s.permanentDeleteTask)
  const emptyTrash = useDataStore((s) => s.emptyTrash)
  const duplicateTask = useDataStore((s) => s.duplicateTask)
  const markWontDo = useDataStore((s) => s.markWontDo)
  const toggleSection = useDataStore((s) => s.toggleSection)
  const reorderTask    = useDataStore((s) => s.reorderTask)
  const loadMoreTasks  = useDataStore((s) => s.loadMoreTasks)
  const tasksHasMore   = useDataStore((s) => s.tasksHasMore)
  const tasksTotal     = useDataStore((s) => s.tasksTotal)
  const hydrated       = useDataStore((s) => s.hydrated)

  // ── All useState / useSensors MUST come before any early return ──────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['__unsectioned']))
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [completedExpanded, setCompletedExpanded] = useState<Set<string>>(new Set())
  const [addingTaskInSectionId, setAddingTaskInSectionId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  // ── Computed values needed by useMemo / useEffect ─────────────────────────
  const isListView      = !!(selectedView === 'list' && selectedListId && !selectedTagId)
  const isTrashView     = selectedView === 'trash' && !selectedTagId
  const isCompletedView = selectedView === 'completed' && !selectedTagId
  const isInboxView     = selectedView === 'inbox' && !selectedTagId
  const canAddTasks     = isListView || isInboxView

  // ── useMemo / useEffect MUST be before any early return ───────────────────
  const tasks = useMemo(
    () => getTasksForView(selectedView, selectedListId, selectedTagId),
    [getTasksForView, selectedView, selectedListId, selectedTagId, tasksFlat],
  )

  const sections = useMemo(
    () =>
      selectedListId && isListView
        ? sectionsFlat.filter((s) => s.listId === selectedListId).sort((a, b) => a.order - b.order)
        : [],
    [sectionsFlat, selectedListId, isListView],
  )

  // ── Render-phase derived state (avoids cascading renders from setState-in-effect) ──
  // React re-renders immediately when setState is called during render, so there's
  // no extra paint cycle — unlike useEffect which always runs after the first paint.

  // Include hydration in the key so the block fires when data first loads,
  // not just when the user navigates (navKey alone is the same on hard refresh).
  const navKey   = `${selectedView}:${selectedListId ?? ''}:${selectedTagId ?? ''}`
  const expandKey = hydrated ? navKey : `__pending:${navKey}`
  const [prevExpandKey, setPrevExpandKey] = useState(expandKey)
  if (expandKey !== prevExpandKey) {
    setPrevExpandKey(expandKey)
    if (hydrated) {
      const ids = collectExpandableIds(tasks)
      // On first load, also expand every ancestor of the URL-restored selected task
      // so the user lands exactly where they left off.
      if (selectedTaskId) {
        const ancestors = findAncestorIds(selectedTaskId, tasks)
        if (ancestors) ancestors.forEach((id) => ids.add(id))
      }
      setExpandedIds(ids)
    }
  }

  const sectionsKey = `${selectedListId ?? ''}:${sections.length}`
  const [prevSectionsKey, setPrevSectionsKey] = useState(sectionsKey)
  if (sectionsKey !== prevSectionsKey && sections.length > 0) {
    setPrevSectionsKey(sectionsKey)
    setExpandedSections((prev) => {
      const next = new Set(prev)
      next.add('__unsectioned')
      sections.forEach((s) => {
        if (!s.collapsed) next.add(s.id)
        else next.delete(s.id)
      })
      return next
    })
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Skeleton — placed after every single hook in this component
  if (!hydrated) return <TaskListSkeleton />

  const inboxList = lists.find((l) => l.name.toLowerCase() === 'inbox')
  const listInfo  = selectedListId ? getListById(selectedListId) : undefined
  const tagInfo   = tags.find((t) => t.id === selectedTagId)

  function handleToggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleSection(id: string) {
    if (id === '__unsectioned') {
      setExpandedSections((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    } else {
      toggleSection(id)
    }
  }

  function handlePin(id: string, isPinned: boolean) {
    updateTask(id, { isPinned: !isPinned })
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveDragId(String(e.active.id))
  }

  function handleDragEnd(e: DragEndEvent, groupTasks: Task[]) {
    setActiveDragId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    const ids = groupTasks.map((t) => t.id)
    const oldIdx = ids.indexOf(String(active.id))
    const newIdx = ids.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return

    // Compute a float order between surrounding tasks
    const sorted = [...groupTasks].sort((a, b) => a.order - b.order)
    let newOrder: number
    if (newIdx === 0) {
      newOrder = sorted[0].order - 1
    } else if (newIdx >= sorted.length - 1) {
      newOrder = sorted[sorted.length - 1].order + 1
    } else {
      const before = sorted[newIdx < oldIdx ? newIdx - 1 : newIdx].order
      const after  = sorted[newIdx < oldIdx ? newIdx   : newIdx + 1].order
      newOrder = (before + after) / 2
    }

    reorderTask(String(active.id), newOrder)
  }

  function handleAddTask(
    title: string,
    listId: string,
    parentId?: string | null,
    sectionId?: string | null,
  ) {
    createTask({ title, listId, parentId, sectionId })
    if (parentId) {
      setExpandedIds((prev) => new Set(prev).add(parentId))
      setAddingSubtaskFor(null)
    }
  }

  function handleAddSection(name: string) {
    if (!selectedListId) return
    const section = createSection({ name, listId: selectedListId })
    setExpandedSections((prev) => new Set(prev).add(section.id))
    setShowAddSection(false)
  }

  function handleSectionDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = sections.map((s) => s.id)
    const oldIdx = ids.indexOf(String(active.id))
    const newIdx = ids.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    let newOrder: number
    if (newIdx === 0) {
      newOrder = sorted[0].order - 1
    } else if (newIdx >= sorted.length - 1) {
      newOrder = sorted[sorted.length - 1].order + 1
    } else {
      const before = sorted[newIdx < oldIdx ? newIdx - 1 : newIdx].order
      const after  = sorted[newIdx < oldIdx ? newIdx   : newIdx + 1].order
      newOrder = (before + after) / 2
    }
    reorderSection(String(active.id), newOrder)
  }

  const activeListId = isListView ? selectedListId! : inboxList?.id
  const flatTasks = flattenTree(tasks, 0, expandedIds)
  const title = getViewTitle(selectedView, listInfo?.name, tagInfo?.name)
  const taskGroups = isListView ? groupTasksBySection(tasks, sections) : null

  function renderTaskItem(task: Task, depth: number, dragHandleProps?: Record<string, unknown>) {
    return (
      <div key={task.id}>
        <TaskItem
          task={task}
          depth={depth}
          isSelected={selectedTaskId === task.id}
          isExpanded={expandedIds.has(task.id)}
          onSelect={(t) => setSelectedTaskId(t.id)}
          onToggleComplete={toggleComplete}
          onToggleExpand={handleToggleExpand}
          onAddSubtask={
            isTrashView || isCompletedView
              ? undefined
              : (t) => {
                  setExpandedIds((prev) => new Set(prev).add(t.id))
                  setAddingSubtaskFor(t.id)
                }
          }
          onDelete={(id) => (isTrashView ? permanentDeleteTask(id) : deleteTask(id))}
          onDuplicate={(id) => duplicateTask(id)}
          onMarkWontDo={isTrashView || isCompletedView ? undefined : markWontDo}
          onRestore={isTrashView ? restoreTask : undefined}
          onPin={isTrashView || isCompletedView ? undefined : handlePin}
          onSetDate={isTrashView || isCompletedView ? undefined : (id, date) => updateTask(id, { dueDate: date })}
          onSetPriority={isTrashView || isCompletedView ? undefined : (id, priority) => updateTask(id, { priority })}
          onMoveToSection={isListView && !isTrashView && !isCompletedView ? (id, sectionId) => updateTask(id, { sectionId }) : undefined}
          sections={isListView ? sections : undefined}
          dragHandleProps={dragHandleProps}
        />
        {addingSubtaskFor === task.id && isListView && (
          <div style={{ paddingLeft: `${10 + (depth + 1) * 20}px` }}>
            <AddTaskBar
              listId={selectedListId!}
              parentId={task.id}
              placeholder="Add subtask..."
              onAdd={(t, listId, parentId) => {
                handleAddTask(t, listId, parentId, task.sectionId)
                setAddingSubtaskFor(null)
              }}
            />
          </div>
        )}
      </div>
    )
  }

  /** Collapsible "Completed N" section header + task rows */
  function renderCompletedStrip(doneTasks: Task[], groupKey: string, depth = 0) {
    if (doneTasks.length === 0 || isTrashView || isCompletedView) return null
    const open = completedExpanded.has(groupKey)

    return (
      <div>
        {/* Section-header style toggle — matches the "Not Sectioned" / named section headers */}
        <button
          type="button"
          onClick={() =>
            setCompletedExpanded((prev) => {
              const next = new Set(prev)
              if (open) next.delete(groupKey); else next.add(groupKey)
              return next
            })
          }
          className="section-header-row group"
          style={{ paddingLeft: depth > 0 ? `${10 + depth * 28}px` : undefined }}
        >
          <ChevronDown
            className="h-4 w-4 text-text-muted shrink-0 transition-transform duration-150"
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            strokeWidth={1.75}
          />
          <span className="section-header-title flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            Completed
          </span>
          <span className="section-header-count">{doneTasks.length}</span>
        </button>

        {/* Completed task rows */}
        {open && (
          <div style={{ opacity: 0.55 }}>
            {doneTasks.map((task) => (
              <div key={task.id}>
                {renderTaskItem(task, depth)}
                {task.children && expandedIds.has(task.id) && (() => {
                  const lineLeft = 10 + depth * 28 + 8   // center of this depth's chevron
                  return (
                    <div className="relative">
                      <div
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{ left: lineLeft, width: 1.5, background: 'rgba(255,255,255,0.14)' }}
                      />
                      {flattenTree(task.children, depth + 1, expandedIds).map(({ task: child, depth: d }) =>
                        renderTaskItem(child, d)
                      )}
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /** Render active tasks with DnD + completed strip at the bottom */
  function renderSortableGroup(groupTasks: Task[], groupKey = '__default') {
    const activeTasks    = groupTasks.filter((t) => t.status === 'active')
    const completedTasks = groupTasks.filter((t) => t.status !== 'active')
    const ids = activeTasks.map((t) => t.id)

    return (
      <>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={(e) => handleDragEnd(e, activeTasks)}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {activeTasks.map((task) => (
              <SortableItem key={task.id} id={task.id} disabled={isTrashView || isCompletedView}>
                {(handleProps) => (
                  <>
                    {renderTaskItem(task, 0, handleProps)}
                    {task.children && expandedIds.has(task.id) && (() => {
                      const flat = flattenTree(task.children, 1, expandedIds)
                      const activeChildren = flat.filter(({ task: c }) => c.status === 'active')
                      const doneChildren   = flat.filter(({ task: c }) => c.status !== 'active')
                      const lineLeft = 18  // center of depth-0 expand chevron (paddingLeft 10 + half of 16px icon)
                      return (
                        <div className="relative">
                          {/* Vertical connector line */}
                          <div
                            className="absolute top-0 bottom-0 pointer-events-none"
                            style={{ left: lineLeft, width: 1.5, background: 'rgba(255,255,255,0.14)' }}
                          />
                          {activeChildren.map(({ task: child, depth }) => renderTaskItem(child, depth))}
                          {renderCompletedStrip(doneChildren.map((x) => x.task), `${task.id}_children`, 1)}
                        </div>
                      )
                    })()}
                  </>
                )}
              </SortableItem>
            ))}
          </SortableContext>
          <DragOverlay>
            {activeDragId ? (() => {
              const t = tasksFlat.find((x) => x.id === activeDragId)
              if (!t) return null
              return (
                <div
                  className="flex items-center gap-2 px-3 rounded-lg text-sm font-medium text-text-primary"
                  style={{
                    height: 36,
                    background: '#1e1e22',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    opacity: 0.95,
                    cursor: 'grabbing',
                  }}
                >
                  <GripVertical className="h-3.5 w-3.5 text-text-muted shrink-0" strokeWidth={2} />
                  <span className="flex-1 truncate">{t.title}</span>
                </div>
              )
            })() : null}
          </DragOverlay>
        </DndContext>

        {renderCompletedStrip(completedTasks, groupKey)}
      </>
    )
  }

  /** Non-DnD flat render (for non-list views) — active tasks first, completed collapsed at bottom */
  function renderTaskRows(groupTasks: Task[], baseDepth = 0) {
    if (isTrashView || isCompletedView) {
      return flattenTree(groupTasks, baseDepth, expandedIds).map(({ task, depth }) =>
        renderTaskItem(task, depth)
      )
    }
    const activeTasks    = groupTasks.filter((t) => t.status === 'active')
    const completedTasks = groupTasks.filter((t) => t.status !== 'active')
    return (
      <>
        {flattenTree(activeTasks, baseDepth, expandedIds).map(({ task, depth }) =>
          renderTaskItem(task, depth)
        )}
        {renderCompletedStrip(completedTasks, '__flat_view')}
      </>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-bg-primary overflow-hidden">
      <div className="panel-header flex items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobilePane('sidebar')}
            className="icon-btn lg:hidden shrink-0"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <h2 className="list-panel-title text-text-primary truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 relative">
          {isTrashView && flatTasks.length > 0 && (
            <button
              type="button"
              onClick={() => emptyTrash()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-priority-p1 hover:bg-bg-hover transition-colors mr-1"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Empty Trash
            </button>
          )}
          <IconButton icon={ArrowUpDown} label="Sort" size="sm" />
          <IconButton
            icon={MoreHorizontal}
            label="View options"
            size="sm"
            onClick={() => setShowViewMenu((v) => !v)}
          />

          {showViewMenu && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-50"
                aria-label="Close menu"
                onClick={() => setShowViewMenu(false)}
              />
              <div className="dropdown-menu absolute right-0 top-full mt-2 w-52 z-60">
                <p className="dropdown-menu-label">View</p>
                <button type="button" className="dropdown-menu-item dropdown-menu-item-active">
                  List view
                </button>
                <button type="button" className="dropdown-menu-item">
                  Hide completed
                </button>
                <button type="button" className="dropdown-menu-item">
                  Show details
                </button>
                {isListView && (
                  <>
                    <div className="dropdown-menu-divider" />
                    <button
                      type="button"
                      className="dropdown-menu-item"
                      onClick={() => {
                        setShowAddSection(true)
                        setShowViewMenu(false)
                      }}
                    >
                      Add section
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {canAddTasks && activeListId && (
        <>
          <AddTaskBar
            listId={activeListId}
            placeholder={
              isInboxView
                ? 'Add task to Inbox. Press Enter to save.'
                : `Add task to "${listInfo?.name}". Press Enter to save.`
            }
            onAdd={(t, listId) => handleAddTask(t, listId)}
          />
          {showAddSection && isListView && (
            <AddSectionBar
              autoFocus
              onAdd={handleAddSection}
              onCancel={() => setShowAddSection(false)}
            />
          )}
        </>
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-0 pt-2 pb-6">
        {flatTasks.length === 0 && !showAddSection ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <EmptyState
              icon={isTrashView ? Trash2 : isCompletedView ? RotateCcw : ListTodo}
              title={
                isTrashView
                  ? 'Trash is empty'
                  : isCompletedView
                    ? 'No completed tasks'
                    : isListView
                      ? 'No tasks yet'
                      : 'Nothing here'
              }
              description={
                isTrashView
                  ? 'Deleted tasks will appear here.'
                  : isListView || isInboxView
                    ? 'Add your first task using the input above.'
                    : 'No tasks match this view.'
              }
            />
          </div>
        ) : isListView && taskGroups ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {taskGroups.map((group) => {
                const isNamed = group.id !== '__unsectioned'
                const activeSectionTasks = group.tasks.filter((t) => t.status === 'active')
                const groupFlat = flattenTree(activeSectionTasks, 0, expandedIds)
                const isExpanded = expandedSections.has(group.id)

                return (
                  <SortableItem key={group.id} id={group.id} disabled={!isNamed}>
                    {(dragHandleProps) => (
                      <div>
                        <SectionHeader
                          name={group.name}
                          count={groupFlat.length}
                          isExpanded={isExpanded}
                          onToggle={() => handleToggleSection(group.id)}
                          onRename={isNamed ? (name) => updateSection(group.id, { name }) : undefined}
                          onDelete={isNamed ? () => deleteSection(group.id) : undefined}
                          dragHandleProps={isNamed ? dragHandleProps : undefined}
                        />
                        {isExpanded && (
                          <div className="pb-1">
                            {group.tasks.length === 0 && addingTaskInSectionId !== group.id && (
                              <p className="px-4 py-2 text-xs text-text-muted">No tasks in this section</p>
                            )}
                            {group.tasks.length > 0 && renderSortableGroup(group.tasks, group.id)}
                            {/* Per-section add task */}
                            {canAddTasks && isNamed && activeListId && (
                              addingTaskInSectionId === group.id ? (
                                <div className="px-2">
                                  <AddTaskBar
                                    listId={activeListId}
                                    placeholder={`Add task to "${group.name}"…`}
                                    onAdd={(t, lid) => {
                                      handleAddTask(t, lid, null, group.id)
                                      setAddingTaskInSectionId(null)
                                    }}
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAddingTaskInSectionId(group.id)}
                                  className="w-full flex items-center gap-1.5 px-4 py-1.5 text-[12px] font-medium text-text-muted hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                                  Add task
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </SortableItem>
                )
              })}
            </SortableContext>
          </DndContext>
        ) : (
          isListView ? renderSortableGroup(tasks, '__flat') : renderTaskRows(tasks)
        )}

        {/* ── Load more ── */}
        {tasksHasMore && (
          <div className="mx-2 mt-2 mb-3 px-2">
            {/* Progress track */}
            <div
              className="rounded-full mb-2.5 overflow-hidden"
              style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((tasks.length / tasksTotal) * 100)}%`,
                  background: 'var(--color-accent)',
                  opacity: 0.45,
                }}
              />
            </div>

            {/* Count + action row */}
            <div className="flex items-center justify-between">
              <span
                className="text-[11.5px] font-medium text-text-muted"
                style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.75 }}
              >
                {tasks.length} of {tasksTotal} tasks
              </span>
              <button
                type="button"
                onClick={() => void loadMoreTasks()}
                className="text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
              >
                Load more →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
