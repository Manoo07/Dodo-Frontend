import type { Task, List, Folder, Section, Tag } from '../types'

function toIso(value: unknown): string | null {
  if (value == null) return null
  return new Date(String(value)).toISOString()
}

export function normalizeTag(raw: Record<string, unknown>): Tag {
  return {
    id: String(raw.id),
    name: String(raw.name),
    color: String(raw.color ?? '#5b9bd5'),
  }
}

export function normalizeFolder(raw: Record<string, unknown>): Folder {
  return {
    id: String(raw.id),
    name: String(raw.name),
    order: Number(raw.order ?? 0),
  }
}

export function normalizeList(raw: Record<string, unknown>): List {
  const folder = raw.folder as Record<string, unknown> | null | undefined
  return {
    id: String(raw.id),
    name: String(raw.name),
    icon: String(raw.icon ?? '📋'),
    color: String(raw.color ?? '#636369'),
    folderId: raw.folderId != null ? String(raw.folderId) : folder?.id ? String(folder.id) : null,
    order: Number(raw.order ?? 0),
    _count: raw._count as List['_count'],
  }
}

export function normalizeSection(raw: Record<string, unknown>): Section {
  return {
    id: String(raw.id),
    name: String(raw.name),
    listId: String(raw.listId),
    order: Number(raw.order ?? 0),
    collapsed: Boolean(raw.collapsed),
    _count: raw._count as Section['_count'],
  }
}

export function normalizeTask(raw: Record<string, unknown>): Task {
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tt) => {
        const row = tt as Record<string, unknown>
        const tag = row.tag as Record<string, unknown> | undefined
        return {
          tagId: String(row.tagId ?? tag?.id ?? ''),
          tag: normalizeTag((tag ?? row) as Record<string, unknown>),
        }
      })
    : []

  const reminders = Array.isArray(raw.reminders)
    ? raw.reminders.map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: String(row.id),
          minutesBefore: Number(row.minutesBefore),
        }
      })
    : []

  const list = raw.list as Record<string, unknown> | null | undefined
  const section = raw.section as Record<string, unknown> | null | undefined
  const parent = raw.parent as Record<string, unknown> | null | undefined

  return {
    id: String(raw.id),
    title: String(raw.title),
    description: String(raw.description ?? ''),
    parentId: raw.parentId != null ? String(raw.parentId) : null,
    listId: String(raw.listId),
    sectionId: raw.sectionId != null ? String(raw.sectionId) : null,
    status: raw.status as Task['status'],
    priority: raw.priority as Task['priority'],
    dueDate: toIso(raw.dueDate),
    dueTime: raw.dueTime != null ? String(raw.dueTime) : null,
    recurrence: (raw.recurrence as Task['recurrence']) ?? null,
    order: Number(raw.order ?? 0),
    isPinned: Boolean(raw.isPinned),
    createdAt: toIso(raw.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(raw.updatedAt) ?? new Date().toISOString(),
    completedAt: toIso(raw.completedAt),
    tags,
    reminders,
    list: list
      ? {
          id: String(list.id),
          name: String(list.name),
          icon: String(list.icon ?? '📋'),
          color: String(list.color ?? '#636369'),
        }
      : undefined,
    section: section
      ? { id: String(section.id), name: String(section.name) }
      : raw.section === null
        ? null
        : undefined,
    parent: parent
      ? {
          id: String(parent.id),
          title: String(parent.title),
          parentId: parent.parentId != null ? String(parent.parentId) : null,
        }
      : raw.parent === null
        ? null
        : undefined,
  }
}

export function mergeTask(existing: Task, updated: Task): Task {
  return {
    ...existing,
    ...updated,
    tags: updated.tags.length > 0 ? updated.tags : existing.tags,
    reminders: updated.reminders.length > 0 ? updated.reminders : existing.reminders,
    list: updated.list ?? existing.list,
    section: updated.section !== undefined ? updated.section : existing.section,
    parent: updated.parent !== undefined ? updated.parent : existing.parent,
  }
}
