import { create } from 'zustand'
import type { NavView } from '../types'

export type MobilePane = 'sidebar' | 'list' | 'detail'

const VALID_VIEWS: NavView[] = ['today', 'next7days', 'inbox', 'completed', 'trash', 'list']

function readNavFromUrl(): {
  selectedView: NavView
  selectedListId: string | null
  selectedTagId: string | null
  selectedTaskId: string | null
} {
  try {
    const p = new URLSearchParams(window.location.search)
    const v    = p.get('v')
    const list = p.get('l')
    const tag  = p.get('t')
    const task = p.get('task')
    if (tag)
      return { selectedView: 'today', selectedListId: null, selectedTagId: tag, selectedTaskId: task }
    if (v === 'list' && list)
      return { selectedView: 'list', selectedListId: list, selectedTagId: null, selectedTaskId: task }
    if (v && VALID_VIEWS.includes(v as NavView))
      return { selectedView: v as NavView, selectedListId: null, selectedTagId: null, selectedTaskId: task }
  } catch {
    // SSR / non-browser env — fall through to defaults
  }
  return { selectedView: 'today', selectedListId: null, selectedTagId: null, selectedTaskId: null }
}

const urlNav = readNavFromUrl()

interface AppState {
  selectedView: NavView
  selectedListId: string | null
  selectedTaskId: string | null
  selectedTagId: string | null
  searchQuery: string
  isSearchOpen: boolean
  mobilePane: MobilePane
  setSelectedView: (view: NavView) => void
  setSelectedListId: (id: string | null) => void
  setSelectedTaskId: (id: string | null) => void
  setSelectedTagId: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setIsSearchOpen: (open: boolean) => void
  setMobilePane: (pane: MobilePane) => void
  navigateToList: (listId: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedView: urlNav.selectedView,
  selectedListId: urlNav.selectedListId,
  selectedTaskId: urlNav.selectedTaskId,
  selectedTagId: urlNav.selectedTagId,
  searchQuery: '',
  isSearchOpen: false,
  mobilePane: 'list',
  setSelectedView: (view) => set({ selectedView: view, selectedTaskId: null, selectedListId: null, selectedTagId: null, mobilePane: 'list' }),
  setSelectedListId: (id) => set({ selectedListId: id, selectedTaskId: null, mobilePane: 'list' }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id, mobilePane: id ? 'detail' : 'list' }),
  setSelectedTagId: (id) => set({ selectedTagId: id, selectedTaskId: null, selectedListId: null, mobilePane: 'list' }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  setMobilePane: (pane) => set({ mobilePane: pane }),
  navigateToList: (listId) => set({ selectedView: 'list', selectedListId: listId, selectedTaskId: null, selectedTagId: null, mobilePane: 'list' }),
}))
