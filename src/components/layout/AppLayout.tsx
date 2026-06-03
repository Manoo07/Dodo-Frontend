import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useDataStore } from '../../store/useDataStore'
import { cn } from '../../lib/cn'
import Sidebar from './Sidebar'
import TaskList from './TaskList'
import TaskDetail from './TaskDetail'
import IconRail from './IconRail'
import SearchModal from './SearchModal'
import PanelResizer from './PanelResizer'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useDefaultListView } from '../../hooks/useDefaultListView'
import ToastContainer from '../ui/ToastContainer'

export default function AppLayout() {
  const { mobilePane } = useAppStore()
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth)
  const taskListWidth = useLayoutStore((s) => s.taskListWidth)
  const setSidebarWidth = useLayoutStore((s) => s.setSidebarWidth)
  const setTaskListWidth = useLayoutStore((s) => s.setTaskListWidth)
  const clampToViewport = useLayoutStore((s) => s.clampToViewport)
  const hydrated = useDataStore((s) => s.hydrated)
  const error = useDataStore((s) => s.error)
  const hydrate = useDataStore((s) => s.hydrate)
  const clearError = useDataStore((s) => s.clearError)

  useKeyboardShortcuts()
  useDefaultListView()

  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    clampToViewport()
    const onResize = () => clampToViewport()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampToViewport])

  const handleSidebarResize = useCallback(
    (deltaX: number) => {
      setSidebarWidth(useLayoutStore.getState().sidebarWidth + deltaX)
    },
    [setSidebarWidth],
  )

  const handleTaskListResize = useCallback(
    (deltaX: number) => {
      setTaskListWidth(useLayoutStore.getState().taskListWidth + deltaX)
    },
    [setTaskListWidth],
  )

  if (error && !hydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-primary px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <span className="text-4xl opacity-30">⚠️</span>
          <p className="text-sm text-text-primary">Could not connect to the Dodo API.</p>
          <p className="text-xs leading-relaxed text-text-muted">{error}</p>
          <p className="text-xs leading-relaxed text-text-muted">
            Start PostgreSQL and the backend:{' '}
            <code className="text-text-secondary">docker compose up -d</code> then{' '}
            <code className="text-text-secondary">cd tasknest-backend && npm run dev</code>
          </p>
          <button
            type="button"
            onClick={() => {
              clearError()
              void hydrate()
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg-primary">
      {/* Icon rail — desktop xl+ only */}
      <div className="hidden xl:flex shrink-0">
        <IconRail />
      </div>

      {/* Sidebar — drawer on mobile, resizable column on lg+ */}
      <div
        style={isDesktop ? { width: sidebarWidth } : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 ease-out lg:relative lg:translate-x-0 lg:z-0 lg:shrink-0',
          'w-[min(100vw,320px)] lg:w-auto',
          mobilePane === 'sidebar' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <Sidebar />
      </div>

      {mobilePane === 'sidebar' && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => useAppStore.getState().setMobilePane('list')}
        />
      )}

      {/* Resizer: sidebar ↔ task list (desktop only) */}
      <PanelResizer
        className="hidden lg:block"
        label="Resize sidebar"
        onDrag={handleSidebarResize}
      />

      {/* Task list — resizable on desktop */}
      <div
        style={isDesktop ? { width: taskListWidth } : undefined}
        className={cn(
          'flex flex-col min-w-0 h-full',
          'w-full lg:w-auto lg:shrink-0',
          mobilePane === 'list' ? 'flex' : 'hidden lg:flex',
        )}
      >
        <TaskList />
      </div>

      {/* Resizer: task list ↔ detail (desktop only) */}
      <PanelResizer
        className="hidden lg:block"
        label="Resize task list"
        onDrag={handleTaskListResize}
      />

      {/* Task detail — fills remaining space */}
      <div
        className={cn(
          'flex flex-col min-w-0 h-full flex-1',
          mobilePane === 'detail' ? 'flex' : 'hidden lg:flex',
        )}
        style={{ minWidth: 0 }}
      >
        <TaskDetail />
      </div>

      <SearchModal />
      <ToastContainer />
    </div>
  )
}
