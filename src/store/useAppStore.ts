import { create } from 'zustand'
import type { NavView } from '../types'

export type MobilePane = 'sidebar' | 'list' | 'detail'

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
  selectedView: 'today',
  selectedListId: null,
  selectedTaskId: null,
  selectedTagId: null,
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
