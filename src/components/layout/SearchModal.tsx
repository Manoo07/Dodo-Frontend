import { useEffect, useRef, useState } from 'react'
import { Search, X, Flag, ArrowUpDown, CornerDownLeft } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useDataStore } from '../../store/useDataStore'
import type { Task } from '../../types'

const PRIORITY_COLORS: Record<string, string> = {
  p1: '#e05252',
  p2: '#d4853a',
  p3: '#5b9bd5',
}

export default function SearchModal() {
  const isSearchOpen = useAppStore((s) => s.isSearchOpen)
  const searchTasks  = useDataStore((s) => s.searchTasks)

  const inputRef     = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLDivElement>(null)
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState<Task[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isSearchOpen])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setSelectedIndex(0); return }
    const t = setTimeout(() => { setResults(searchTasks(query)); setSelectedIndex(0) }, 150)
    return () => clearTimeout(t)
  }, [query, searchTasks])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  function selectTask(task: Task) {
    useAppStore.getState().navigateToList(task.listId)
    useAppStore.getState().setSelectedTaskId(task.id)
    useAppStore.getState().setIsSearchOpen(false)
  }

  function handleClose() { useAppStore.getState().setIsSearchOpen(false) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) selectTask(results[selectedIndex])
    }
  }

  if (!isSearchOpen) return null

  const hasQuery   = query.trim().length > 0
  const hasResults = results.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', paddingTop: '14vh', paddingLeft: 16, paddingRight: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 580,
          background: '#1e1e22',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        {/* ── Search input ── */}
        <div
          className="flex items-center gap-3"
          style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search className="h-5 w-5 text-text-muted shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks…"
            className="flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted/60"
            style={{ fontSize: 15 }}
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="shrink-0 h-6 w-6 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-white/6 transition-colors"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <kbd
              className="shrink-0 text-[11px] font-medium text-text-muted px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              ⌘K
            </kbd>
          )}
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
          {!hasQuery ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center" style={{ padding: '40px 24px' }}>
              <div
                className="flex items-center justify-center rounded-2xl mb-4"
                style={{
                  width: 52, height: 52,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Search className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-medium text-text-secondary">Search your tasks</p>
              <p className="text-[12.5px] text-text-muted mt-1">
                Search by title, description, or tag
              </p>
            </div>
          ) : !hasResults ? (
            /* No results */
            <div className="flex flex-col items-center justify-center" style={{ padding: '40px 24px' }}>
              <p className="text-[14px] font-medium text-text-secondary">No results</p>
              <p className="text-[12.5px] text-text-muted mt-1">
                No tasks matched &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            /* Results list */
            <div ref={listRef} style={{ padding: '6px 6px' }}>
              {results.map((task, idx) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => selectTask(task)}
                  className="w-full flex items-center gap-3 rounded-xl text-left transition-colors"
                  style={{
                    padding: '10px 12px',
                    background: idx === selectedIndex ? 'rgba(255,255,255,0.07)' : 'transparent',
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  {/* List colour dot */}
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: task.list?.color ?? '#636369' }}
                  />

                  {/* Title + breadcrumb */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate text-text-primary font-medium"
                      style={{ fontSize: 13.5, lineHeight: 1.3 }}
                    >
                      {task.title}
                    </p>
                    {task.list?.name && (
                      <p className="truncate text-text-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                        {task.list.name}
                      </p>
                    )}
                  </div>

                  {/* Priority flag */}
                  {task.priority !== 'none' && task.priority && (
                    <Flag
                      className="shrink-0 h-3.5 w-3.5"
                      strokeWidth={1.75}
                      style={{ color: PRIORITY_COLORS[task.priority], fill: PRIORITY_COLORS[task.priority] }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer keyboard hints ── */}
        <div
          className="flex items-center gap-4"
          style={{
            padding: '10px 18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
            <ArrowUpDown className="h-3 w-3" strokeWidth={2} />
            Navigate
          </span>
          <span className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
            <CornerDownLeft className="h-3 w-3" strokeWidth={2} />
            Open
          </span>
          <span className="flex items-center gap-1.5 text-[11.5px] text-text-muted ml-auto">
            <kbd
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  )
}
