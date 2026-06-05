export interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
  digestHour: number             // local hour (0-23) chosen by user
  digestTimezoneOffset: number   // raw getTimezoneOffset() in minutes
}

export type TaskStatus = 'active' | 'completed' | 'wont_do' | 'deleted'
export type Priority = 'p1' | 'p2' | 'p3' | 'none'

export interface Tag {
  id: string
  name: string
  color: string
}

export interface TaskTag {
  tagId: string
  tag: Tag
}

export interface Reminder {
  id: string
  minutesBefore: number
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  daysOfWeek?: number[]
  endDate?: string
}

export interface Task {
  id: string
  title: string
  description: string
  parentId: string | null
  listId: string
  sectionId: string | null
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  dueTime: string | null
  recurrence: RecurrenceRule | null
  order: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
  completedAt: string | null
  tags: TaskTag[]
  reminders: Reminder[]
  children?: Task[]
  parent?: { id: string; title: string; parentId: string | null } | null
  list?: { id: string; name: string; icon: string; color: string }
  section?: { id: string; name: string } | null
}

export interface Folder {
  id: string
  name: string
  order: number
  lists?: List[]
}

export interface List {
  id: string
  name: string
  icon: string
  color: string
  folderId: string | null
  order: number
  _count?: { tasks: number }
}

export interface Section {
  id: string
  name: string
  listId: string
  order: number
  collapsed: boolean
  _count?: { tasks: number }
}

export type NavView = 'today' | 'next7days' | 'inbox' | 'completed' | 'wontdo' | 'trash' | 'list' | 'matrix'

export interface CreateTaskPayload {
  title: string
  listId: string
  parentId?: string | null
  sectionId?: string | null
  priority?: Priority
  dueDate?: string | null
  description?: string
  order?: number
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  priority?: Priority
  dueDate?: string | null
  dueTime?: string | null
  sectionId?: string | null
  parentId?: string | null
  isPinned?: boolean
  tags?: string[]
}
