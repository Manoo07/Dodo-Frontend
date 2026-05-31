import client from './client'
import type { Tag, Task } from '../types'

export const tagsApi = {
  getAll: () =>
    client.get<Tag[]>('/tags').then((r) => r.data),

  getTasks: (tagId: string) =>
    client.get<Task[]>(`/tags/${tagId}/tasks`).then((r) => r.data),

  create: (payload: { name: string; color?: string }) =>
    client.post<Tag>('/tags', payload).then((r) => r.data),

  update: (id: string, payload: Partial<{ name: string; color: string }>) =>
    client.put<Tag>(`/tags/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/tags/${id}`),
}
