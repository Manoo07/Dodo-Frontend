import client from './client'
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types'

export const tasksApi = {
  getAll: (page = 0, limit = 20) =>
    client.get<{ tasks: Task[]; total: number; page: number; hasMore: boolean }>(
      '/tasks/all', { params: { page, limit } },
    ).then((r) => r.data),

  getByList: (listId: string) =>
    client.get<Task[]>(`/lists/${listId}/tasks`).then((r) => r.data),

  getToday: () =>
    client.get<Task[]>('/tasks/today').then((r) => r.data),

  getNext7Days: () =>
    client.get<Task[]>('/tasks/next7days').then((r) => r.data),

  getOverdue: () =>
    client.get<Task[]>('/tasks/overdue').then((r) => r.data),

  getCompleted: (listId?: string) =>
    client
      .get<Task[]>('/tasks', { params: { status: 'completed', ...(listId && { listId }) } })
      .then((r) => r.data),

  getInbox: () =>
    client.get<Task[]>('/tasks/inbox').then((r) => r.data),

  getTrash: () =>
    client.get<Task[]>('/tasks/trash').then((r) => r.data),

  getById: (id: string) =>
    client.get<Task>(`/tasks/${id}`).then((r) => r.data),

  search: (q: string) =>
    client.get<Task[]>('/tasks/search', { params: { q } }).then((r) => r.data),

  create: (payload: CreateTaskPayload) =>
    client.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: string, payload: UpdateTaskPayload) =>
    client.put<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  toggleComplete: (id: string) =>
    client.patch<Task>(`/tasks/${id}/complete`).then((r) => r.data),

  markWontDo: (id: string) =>
    client.patch<Task>(`/tasks/${id}/wont-do`).then((r) => r.data),

  reorder: (id: string, order: number, parentId?: string | null) =>
    client.patch<Task>(`/tasks/${id}/reorder`, { order, parentId }).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/tasks/${id}`),

  restore: (id: string) =>
    client.patch<Task>(`/tasks/${id}/restore`).then((r) => r.data),

  permanentDelete: (id: string) =>
    client.delete(`/tasks/${id}/permanent`),

  emptyTrash: () =>
    client.delete('/tasks/trash/empty'),

  duplicate: (id: string) =>
    client.post<Task>(`/tasks/${id}/duplicate`).then((r) => r.data),
}
