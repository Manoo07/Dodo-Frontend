import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { NavView } from '../types'

function buildSearch(
  view: NavView,
  listId: string | null,
  tagId: string | null,
  taskId: string | null,
): string {
  const p = new URLSearchParams()
  if (tagId) {
    p.set('v', 'tag')
    p.set('t', tagId)
  } else if (view === 'list' && listId) {
    p.set('v', 'list')
    p.set('l', listId)
  } else {
    p.set('v', view)
  }
  if (taskId) p.set('task', taskId)
  return '?' + p.toString()
}

export function useUrlSync() {
  const selectedView   = useAppStore((s) => s.selectedView)
  const selectedListId = useAppStore((s) => s.selectedListId)
  const selectedTagId  = useAppStore((s) => s.selectedTagId)
  const selectedTaskId = useAppStore((s) => s.selectedTaskId)

  useEffect(() => {
    const search = buildSearch(selectedView, selectedListId, selectedTagId, selectedTaskId)
    if (window.location.search !== search) {
      window.history.replaceState(null, '', search)
    }
  }, [selectedView, selectedListId, selectedTagId, selectedTaskId])
}
