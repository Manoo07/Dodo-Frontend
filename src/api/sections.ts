import client from './client'
import type { Section } from '../types'

export const sectionsApi = {
  getAll: () =>
    client.get<Section[]>('/sections').then((r) => r.data),

  getByList: (listId: string) =>
    client.get<Section[]>('/sections', { params: { listId } }).then((r) => r.data),

  create: (payload: { name: string; listId: string; order?: number }) =>
    client.post<Section>('/sections', payload).then((r) => r.data),

  update: (id: string, payload: Partial<{ name: string; order: number; collapsed: boolean }>) =>
    client.put<Section>(`/sections/${id}`, payload).then((r) => r.data),

  delete: (id: string) => client.delete(`/sections/${id}`),
}
