import { create } from 'zustand'
import { listsApi } from '../api/lists'
import { sectionsApi } from '../api/sections'
import { tagsApi } from '../api/tags'
import { tasksApi } from '../api/tasks'
import {
  mergeTask,
  normalizeFolder,
  normalizeList,
  normalizeSection,
  normalizeTag,
  normalizeTask,
} from '../api/normalize'
import type { Task, List, Tag, Folder, Section, Priority, TaskTag } from '../types'

function buildTree(flat: Task[], parentId: string | null): Task[] {
  return flat
    .filter((t) => t.parentId === parentId && t.status !== 'deleted')
    .sort((a, b) => a.order - b.order)
    .map((t) => ({ ...t, children: buildTree(flat, t.id) }))
}

function isToday(d: string | null): boolean {
  if (!d) return false
  const date = new Date(d)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function isWithin7Days(d: string | null): boolean {
  if (!d) return false
  const date = new Date(d)
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59)
  return date >= start && date <= end
}

function apiErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const res = (err as { response?: { data?: { error?: string } } }).response
    if (res?.data?.error) return res.data.error
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

interface DataState {
  hydrated: boolean
  loading: boolean
  error: string | null
  folders: Folder[]
  lists: List[]
  sections: Section[]
  tasks: Task[]
  tags: Tag[]
  hydrate: () => Promise<void>
  clearError: () => void
  createList: (p: { name: string; icon?: string; color?: string; folderId?: string | null }) => List
  updateList: (id: string, p: Partial<Pick<List, 'name' | 'icon' | 'color' | 'folderId' | 'order'>>) => void
  deleteList: (id: string) => void
  createSection: (p: { name: string; listId: string }) => Section
  getSectionsByList: (listId: string) => Section[]
  createTask: (p: {
    title: string
    listId: string
    parentId?: string | null
    sectionId?: string | null
    priority?: Priority
    dueDate?: string | null
    description?: string
  }) => Task
  updateTask: (
    id: string,
    p: Partial<
      Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'dueTime' | 'sectionId' | 'parentId' | 'isPinned' | 'status'>
    >,
  ) => void
  toggleComplete: (id: string) => void
  markWontDo: (id: string) => void
  deleteTask: (id: string) => void
  restoreTask: (id: string) => void
  permanentDeleteTask: (id: string) => void
  emptyTrash: () => void
  duplicateTask: (id: string) => Task | undefined
  toggleSection: (id: string) => void
  createTag: (name: string, color?: string) => Tag
  deleteTag: (id: string) => void
  addTagToTask: (taskId: string, tagName: string) => void
  removeTagFromTask: (taskId: string, tagId: string) => void
  getTasksByList: (listId: string) => Task[]
  getTaskById: (id: string) => Task | undefined
  getListById: (id: string) => List | undefined
  getTaskWithTree: (id: string) => Task | undefined
  getTasksForView: (view: string, listId?: string | null, tagId?: string | null) => Task[]
  searchTasks: (q: string) => Task[]
  getListTaskCount: (listId: string) => number
}

export const useDataStore = create<DataState>()((set, get) => ({
  hydrated: false,
  loading: false,
  error: null,
  folders: [],
  lists: [],
  sections: [],
  tasks: [],
  tags: [],

  hydrate: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const [foldersRaw, listsRaw, tagsRaw, sectionsRaw, tasksRaw] = await Promise.all([
        listsApi.getFolders(),
        listsApi.getAll(),
        tagsApi.getAll(),
        sectionsApi.getAll(),
        tasksApi.getAll(),
      ])

      set({
        folders: foldersRaw.map((f) => normalizeFolder(f as unknown as Record<string, unknown>)),
        lists: listsRaw.map((l) => normalizeList(l as unknown as Record<string, unknown>)),
        tags: tagsRaw.map((t) => normalizeTag(t as unknown as Record<string, unknown>)),
        sections: sectionsRaw.map((s) => normalizeSection(s as unknown as Record<string, unknown>)),
        tasks: tasksRaw.map((t) => normalizeTask(t as unknown as Record<string, unknown>)),
        hydrated: true,
        loading: false,
      })
    } catch (err) {
      set({
        loading: false,
        hydrated: false,
        error: apiErrorMessage(err),
      })
    }
  },

  clearError: () => set({ error: null }),

  createList: (p) => {
    const temp: List = {
      id: `temp-${Date.now()}`,
      name: p.name,
      icon: p.icon ?? '📋',
      color: p.color ?? '#636369',
      folderId: p.folderId ?? null,
      order: get().lists.length,
    }
    set((s) => ({ lists: [...s.lists, temp] }))

    void listsApi
      .create({
        name: p.name,
        icon: p.icon,
        color: p.color,
        folderId: p.folderId ?? undefined,
      })
      .then((list) => {
        const normalized = normalizeList(list as unknown as Record<string, unknown>)
        set((s) => ({
          lists: s.lists.map((l) => (l.id === temp.id ? normalized : l)),
        }))
      })
      .catch((err) => {
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== temp.id),
          error: apiErrorMessage(err),
        }))
      })

    return temp
  },

  updateList: (id, p) => {
    const prev = get().lists.find((l) => l.id === id)
    set((s) => ({ lists: s.lists.map((l) => (l.id === id ? { ...l, ...p } : l)) }))
    void listsApi.update(id, p).catch((err) => {
      if (prev) set((s) => ({ lists: s.lists.map((l) => (l.id === id ? prev : l)), error: apiErrorMessage(err) }))
    })
  },

  deleteList: (id) => {
    const prevLists = get().lists
    const prevTasks = get().tasks
    set((s) => ({
      lists: s.lists.filter((l) => l.id !== id),
      tasks: s.tasks.filter((t) => t.listId !== id),
    }))
    void listsApi.delete(id).catch((err) => {
      set({ lists: prevLists, tasks: prevTasks, error: apiErrorMessage(err) })
    })
  },

  createSection: (p) => {
    const temp: Section = {
      id: `temp-${Date.now()}`,
      name: p.name,
      listId: p.listId,
      order: get().sections.filter((s) => s.listId === p.listId).length,
      collapsed: false,
    }
    set((s) => ({ sections: [...s.sections, temp] }))

    void sectionsApi
      .create({ name: p.name, listId: p.listId })
      .then((section) => {
        const normalized = normalizeSection(section as unknown as Record<string, unknown>)
        set((s) => ({
          sections: s.sections.map((sec) => (sec.id === temp.id ? normalized : sec)),
        }))
      })
      .catch((err) => {
        set((s) => ({
          sections: s.sections.filter((sec) => sec.id !== temp.id),
          error: apiErrorMessage(err),
        }))
      })

    return temp
  },

  getSectionsByList: (listId) =>
    get()
      .sections.filter((s) => s.listId === listId)
      .sort((a, b) => a.order - b.order),

  createTask: (p) => {
    const count = get().tasks.filter(
      (t) => t.parentId === (p.parentId ?? null) && t.listId === p.listId,
    ).length
    const ts = new Date().toISOString()
    const temp: Task = {
      id: `temp-${Date.now()}`,
      title: p.title,
      description: p.description ?? '',
      parentId: p.parentId ?? null,
      listId: p.listId,
      sectionId: p.sectionId ?? null,
      status: 'active',
      priority: p.priority ?? 'none',
      dueDate: p.dueDate ?? null,
      dueTime: null,
      recurrence: null,
      order: count,
      isPinned: false,
      createdAt: ts,
      updatedAt: ts,
      completedAt: null,
      tags: [],
      reminders: [],
    }
    set((s) => ({ tasks: [...s.tasks, temp] }))

    void tasksApi
      .create({
        title: p.title,
        listId: p.listId,
        parentId: p.parentId,
        sectionId: p.sectionId,
        priority: p.priority,
        dueDate: p.dueDate,
        description: p.description,
        order: count,
      })
      .then((task) => {
        const normalized = normalizeTask(task as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === temp.id ? normalized : t)),
        }))
      })
      .catch((err) => {
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== temp.id),
          error: apiErrorMessage(err),
        }))
      })

    return temp
  },

  updateTask: (id, p) => {
    const prev = get().tasks.find((t) => t.id === id)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...p, updatedAt: new Date().toISOString() } : t,
      ),
    }))
    void tasksApi
      .update(id, p)
      .then((task) => {
        const normalized = normalizeTask(task as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? mergeTask(t, normalized) : t)),
        }))
      })
      .catch((err) => {
        if (prev) set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? prev : t)), error: apiErrorMessage(err) }))
      })
  },

  toggleComplete: (id) => {
    const prev = get().tasks.find((t) => t.id === id)
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t
        const completing = t.status !== 'completed'
        return {
          ...t,
          status: completing ? ('completed' as const) : ('active' as const),
          completedAt: completing ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
    void tasksApi
      .toggleComplete(id)
      .then((task) => {
        const normalized = normalizeTask(task as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? mergeTask(t, normalized) : t)),
        }))
      })
      .catch((err) => {
        if (prev) set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? prev : t)), error: apiErrorMessage(err) }))
      })
  },

  markWontDo: (id) => {
    const prev = get().tasks.find((t) => t.id === id)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: 'wont_do' as const, updatedAt: new Date().toISOString() } : t,
      ),
    }))
    void tasksApi
      .markWontDo(id)
      .then((task) => {
        const normalized = normalizeTask(task as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? mergeTask(t, normalized) : t)),
        }))
      })
      .catch((err) => {
        if (prev) set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? prev : t)), error: apiErrorMessage(err) }))
      })
  },

  deleteTask: (id) => {
    const prev = get().tasks.find((t) => t.id === id)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: 'deleted' as const, updatedAt: new Date().toISOString() } : t,
      ),
    }))
    void tasksApi.delete(id).catch((err) => {
      if (prev) set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? prev : t)), error: apiErrorMessage(err) }))
    })
  },

  restoreTask: (id) => {
    const prev = get().tasks.find((t) => t.id === id)
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: 'active' as const, updatedAt: new Date().toISOString() } : t,
      ),
    }))
    void tasksApi
      .restore(id)
      .then((task) => {
        const normalized = normalizeTask(task as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? mergeTask(t, normalized) : t)),
        }))
      })
      .catch((err) => {
        if (prev) set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? prev : t)), error: apiErrorMessage(err) }))
      })
  },

  permanentDeleteTask: (id) => {
    const prev = get().tasks
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    void tasksApi.permanentDelete(id).catch((err) => {
      set({ tasks: prev, error: apiErrorMessage(err) })
    })
  },

  emptyTrash: () => {
    const prev = get().tasks
    set((s) => ({ tasks: s.tasks.filter((t) => t.status !== 'deleted') }))
    void tasksApi.emptyTrash().catch((err) => {
      set({ tasks: prev, error: apiErrorMessage(err) })
    })
  },

  duplicateTask: (id) => {
    const original = get().tasks.find((t) => t.id === id)
    if (!original) return undefined

    void tasksApi
      .duplicate(id)
      .then((task) => {
        const normalized = normalizeTask(task as unknown as Record<string, unknown>)
        set((s) => ({ tasks: [...s.tasks, normalized] }))
      })
      .catch((err) => set({ error: apiErrorMessage(err) }))

    return original
  },

  toggleSection: (id) => {
    const section = get().sections.find((s) => s.id === id)
    if (!section) return
    const next = !section.collapsed
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === id ? { ...sec, collapsed: next } : sec)),
    }))
    void sectionsApi.update(id, { collapsed: next }).catch(() => {
      set((s) => ({
        sections: s.sections.map((sec) => (sec.id === id ? { ...sec, collapsed: !next } : sec)),
      }))
    })
  },

  createTag: (name, color) => {
    const n = name.toLowerCase().trim()
    const existing = get().tags.find((t) => t.name === n)
    if (existing) return existing

    const temp: Tag = { id: `temp-${Date.now()}`, name: n, color: color ?? '#5b9bd5' }
    set((s) => ({ tags: [...s.tags, temp] }))

    void tagsApi
      .create({ name: n, color: color ?? '#5b9bd5' })
      .then((tag) => {
        const normalized = normalizeTag(tag as unknown as Record<string, unknown>)
        set((s) => ({
          tags: s.tags.map((t) => (t.id === temp.id ? normalized : t)),
        }))
      })
      .catch((err) => {
        set((s) => ({
          tags: s.tags.filter((t) => t.id !== temp.id),
          error: apiErrorMessage(err),
        }))
      })

    return temp
  },

  deleteTag: (id) => {
    const prevTags = get().tags
    const prevTasks = get().tasks
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      tasks: s.tasks.map((t) => ({ ...t, tags: t.tags.filter((tt) => tt.tagId !== id) })),
    }))
    void tagsApi.delete(id).catch((err) => {
      set({ tags: prevTags, tasks: prevTasks, error: apiErrorMessage(err) })
    })
  },

  addTagToTask: (taskId, tagName) => {
    const tag = get().createTag(tagName)
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task || task.tags.some((tt) => tt.tagId === tag.id)) return

    const nextTags = [...task.tags, { tagId: tag.id, tag } as TaskTag]
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, tags: nextTags } : t)),
    }))

    void tasksApi
      .update(taskId, { tags: nextTags.map((tt) => tt.tagId) })
      .then((updated) => {
        const normalized = normalizeTask(updated as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? mergeTask(t, normalized) : t)),
        }))
      })
      .catch((err) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? task : t)),
          error: apiErrorMessage(err),
        }))
      })
  },

  removeTagFromTask: (taskId, tagId) => {
    const task = get().tasks.find((t) => t.id === taskId)
    if (!task) return
    const nextTags = task.tags.filter((tt) => tt.tagId !== tagId)

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, tags: nextTags } : t)),
    }))

    void tasksApi
      .update(taskId, { tags: nextTags.map((tt) => tt.tagId) })
      .then((updated) => {
        const normalized = normalizeTask(updated as unknown as Record<string, unknown>)
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? mergeTask(t, normalized) : t)),
        }))
      })
      .catch((err) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? task : t)),
          error: apiErrorMessage(err),
        }))
      })
  },

  getTasksByList: (listId) => buildTree(get().tasks.filter((t) => t.listId === listId), null),

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  getListById: (id) => get().lists.find((l) => l.id === id),

  getTaskWithTree: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return undefined
    const all = get().tasks
    const lists = get().lists
    const addChildren = (t: Task): Task => ({
      ...t,
      children: all
        .filter((c) => c.parentId === t.id && c.status !== 'deleted')
        .sort((a, b) => a.order - b.order)
        .map(addChildren),
      list: lists.find((l) => l.id === t.listId) as List,
      parent: t.parentId
        ? (() => {
            const p = all.find((x) => x.id === t.parentId)
            return p ? { id: p.id, title: p.title, parentId: p.parentId } : null
          })()
        : null,
    })
    return addChildren(task)
  },

  getTasksForView: (view, listId, tagId) => {
    const { tasks, lists } = get()
    const withList = (t: Task) => ({
      ...t,
      list: lists.find((l) => l.id === t.listId) as List,
    })
    if (tagId)
      return tasks
        .filter((t) => t.status !== 'deleted' && t.tags.some((tt) => tt.tagId === tagId))
        .map(withList)
    if (view === 'list' && listId)
      return buildTree(tasks.filter((t) => t.listId === listId && t.status !== 'deleted'), null)
    if (view === 'today')
      return tasks.filter((t) => t.status !== 'deleted' && isToday(t.dueDate)).map(withList)
    if (view === 'next7days')
      return tasks.filter((t) => t.status !== 'deleted' && isWithin7Days(t.dueDate)).map(withList)
    if (view === 'inbox') {
      const inbox = lists.find((l) => l.name.toLowerCase() === 'inbox')
      return inbox
        ? tasks
            .filter((t) => t.listId === inbox.id && t.status !== 'deleted' && !t.parentId)
            .map(withList)
        : []
    }
    if (view === 'completed') return tasks.filter((t) => t.status === 'completed').map(withList)
    if (view === 'trash') return tasks.filter((t) => t.status === 'deleted').map(withList)
    return []
  },

  searchTasks: (q) => {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return get()
      .tasks.filter(
        (t) =>
          t.status !== 'deleted' &&
          (t.title.toLowerCase().includes(lower) ||
            t.description.toLowerCase().includes(lower) ||
            t.tags.some((tt) => tt.tag.name.includes(lower))),
      )
      .slice(0, 50)
      .map((t) => ({ ...t, list: get().lists.find((l) => l.id === t.listId) as List }))
  },

  getListTaskCount: (listId) =>
    get().tasks.filter((t) => t.listId === listId && t.status !== 'deleted').length,
}))
