import client from './client'
import type { List, Folder } from '../types'

export const listsApi = {
  getAll: () =>
    client.get<List[]>('/lists').then((r) => r.data),

  getFolders: () =>
    client.get<Folder[]>('/lists/folders/all').then((r) => r.data),

  getById: (id: string) =>
    client.get<List>(`/lists/${id}`).then((r) => r.data),

  create: (payload: { name: string; icon?: string; color?: string; folderId?: string }) =>
    client.post<List>('/lists', payload).then((r) => r.data),

  update: (id: string, payload: Partial<{ name: string; icon: string; color: string; folderId: string | null; order: number }>) =>
    client.put<List>(`/lists/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/lists/${id}`),
}
