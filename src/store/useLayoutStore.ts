import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const LAYOUT_LIMITS = {
  sidebar: { min: 220, max: 400, default: 320 },
  taskList: { min: 320, max: 680, default: 520 },
  detail: { min: 280 },
  detailNotes: { min: 160, max: 720, default: 280 },
  detailSubtasks: { min: 120 },
  iconRail: 64,
} as const

function getIconRailWidth(): number {
  if (typeof window === 'undefined') return 0
  return window.matchMedia('(min-width: 1280px)').matches ? LAYOUT_LIMITS.iconRail : 0
}

/** Space left for sidebar + task list after reserving detail min width and chrome. */
export function getAvailablePanelWidth(): number {
  if (typeof window === 'undefined') return 1200
  const chrome = getIconRailWidth() + 2
  return window.innerWidth - chrome - LAYOUT_LIMITS.detail.min
}

export function clampSidebarWidth(width: number, taskListWidth: number): number {
  const available = getAvailablePanelWidth()
  const max = Math.min(LAYOUT_LIMITS.sidebar.max, available - taskListWidth)
  return Math.round(Math.max(LAYOUT_LIMITS.sidebar.min, Math.min(max, width)))
}

export function clampTaskListWidth(width: number, sidebarWidth: number): number {
  const available = getAvailablePanelWidth()
  const max = Math.min(LAYOUT_LIMITS.taskList.max, available - sidebarWidth)
  return Math.round(Math.max(LAYOUT_LIMITS.taskList.min, Math.min(max, width)))
}

export function clampDetailNotesHeight(height: number, containerHeight: number): number {
  const maxByContainer = containerHeight - LAYOUT_LIMITS.detailSubtasks.min - 1
  const max = Math.min(LAYOUT_LIMITS.detailNotes.max, maxByContainer)
  return Math.round(Math.max(LAYOUT_LIMITS.detailNotes.min, Math.min(max, height)))
}

interface LayoutState {
  sidebarWidth: number
  taskListWidth: number
  detailNotesHeight: number
  setSidebarWidth: (width: number) => void
  setTaskListWidth: (width: number) => void
  setDetailNotesHeight: (height: number, containerHeight: number) => void
  clampToViewport: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      sidebarWidth: LAYOUT_LIMITS.sidebar.default,
      taskListWidth: LAYOUT_LIMITS.taskList.default,
      detailNotesHeight: LAYOUT_LIMITS.detailNotes.default,

      setSidebarWidth: (width) => {
        const { taskListWidth } = get()
        set({ sidebarWidth: clampSidebarWidth(width, taskListWidth) })
      },

      setTaskListWidth: (width) => {
        const { sidebarWidth } = get()
        set({ taskListWidth: clampTaskListWidth(width, sidebarWidth) })
      },

      setDetailNotesHeight: (height, containerHeight) => {
        set({ detailNotesHeight: clampDetailNotesHeight(height, containerHeight) })
      },

      clampToViewport: () => {
        const { sidebarWidth, taskListWidth } = get()
        set({
          sidebarWidth: clampSidebarWidth(sidebarWidth, taskListWidth),
          taskListWidth: clampTaskListWidth(taskListWidth, sidebarWidth),
        })
      },
    }),
    {
      name: 'tasknest-layout',
      partialize: (s) => ({
        sidebarWidth: s.sidebarWidth,
        taskListWidth: s.taskListWidth,
        detailNotesHeight: s.detailNotesHeight,
      }),
    },
  ),
)
