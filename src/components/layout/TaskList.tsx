import { useEffect, useMemo, useState } from 'react'
import { ArrowUpDown, MoreHorizontal, Menu, ListTodo, Trash2, RotateCcw } from 'lucide-react'
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
  const getTasksForView = useDataStore((s) => s.getTasksForView)
  const getSectionsByList = useDataStore((s) => s.getSectionsByList)
  const getListById = useDataStore((s) => s.getListById)
  const createTask = useDataStore((s) => s.createTask)
  const updateTask = useDataStore((s) => s.updateTask)
  const createSection = useDataStore((s) => s.createSection)
  const toggleComplete = useDataStore((s) => s.toggleComplete)
  const deleteTask = useDataStore((s) => s.deleteTask)
  const restoreTask = useDataStore((s) => s.restoreTask)
  const permanentDeleteTask = useDataStore((s) => s.permanentDeleteTask)
  const emptyTrash = useDataStore((s) => s.emptyTrash)
  const duplicateTask = useDataStore((s) => s.duplicateTask)
  const markWontDo = useDataStore((s) => s.markWontDo)
  const toggleSection = useDataStore((s) => s.toggleSection)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['__unsectioned']))
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null)

  const isListView = selectedView === 'list' && selectedListId && !selectedTagId
  const isTrashView = selectedView === 'trash' && !selectedTagId
  const isCompletedView = selectedView === 'completed' && !selectedTagId
  const isInboxView = selectedView === 'inbox' && !selectedTagId
  const canAddTasks = isListView || isInboxView

  const inboxList = lists.find((l) => l.name.toLowerCase() === 'inbox')
  const listInfo = selectedListId ? getListById(selectedListId) : undefined
  const tagInfo = tags.find((t) => t.id === selectedTagId)

  const tasks = useMemo(
    () => getTasksForView(selectedView, selectedListId, selectedTagId),
    [getTasksForView, selectedView, selectedListId, selectedTagId, tasksFlat],
  )

  const sections = useMemo(
    () => (selectedListId && isListView ? getSectionsByList(selectedListId) : []),
    [getSectionsByList, selectedListId, isListView, tasksFlat],
  )

  useEffect(() => {
    const ids = new Set<string>()
    for (const task of tasks) {
      if (task.children?.length) ids.add(task.id)
    }
    setExpandedIds(ids)
  }, [selectedView, selectedListId, selectedTagId, tasks])

  useEffect(() => {
    if (sections.length > 0) {
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
  }, [sections.length, selectedListId])

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

  const activeListId = isListView ? selectedListId! : inboxList?.id
  const flatTasks = flattenTree(tasks, 0, expandedIds)
  const title = getViewTitle(selectedView, listInfo?.name, tagInfo?.name)
  const taskGroups = isListView ? groupTasksBySection(tasks, sections) : null

  function renderTaskRows(groupTasks: Task[], baseDepth = 0) {
    return flattenTree(groupTasks, baseDepth, expandedIds).map(({ task, depth }) => (
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
    ))
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

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-0 pt-0.5 pb-4">
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
          taskGroups.map((group) => {
            const groupFlat = flattenTree(group.tasks, 0, expandedIds)
            const isExpanded = expandedSections.has(group.id)

            return (
              <div key={group.id}>
                <SectionHeader
                  name={group.name}
                  count={groupFlat.length}
                  isExpanded={isExpanded}
                  onToggle={() => handleToggleSection(group.id)}
                />
                {isExpanded && (
                  <div className="pb-1">
                    {group.tasks.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-text-muted">No tasks in this section</p>
                    ) : (
                      renderTaskRows(group.tasks)
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          renderTaskRows(tasks)
        )}
      </div>
    </div>
  )
}
