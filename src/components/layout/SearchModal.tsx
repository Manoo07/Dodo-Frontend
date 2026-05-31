import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useDataStore } from '../../store/useDataStore'
import { cn } from '../../lib/cn'
import type { Task } from '../../types'

export default function SearchModal() {
  const isSearchOpen = useAppStore((s) => s.isSearchOpen)
  const searchTasks = useDataStore((s) => s.searchTasks)

  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Task[]>([])
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
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }
    const timer = setTimeout(() => {
      setResults(searchTasks(query))
      setSelectedIndex(0)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, searchTasks])

  function selectTask(task: Task) {
    useAppStore.getState().navigateToList(task.listId)
    useAppStore.getState().setSelectedTaskId(task.id)
    useAppStore.getState().setIsSearchOpen(false)
  }

  function handleClose() {
    useAppStore.getState().setIsSearchOpen(false)
  }

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
      if (results[selectedIndex]) {
        selectTask(results[selectedIndex])
      }
    }
  }

  if (!isSearchOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="w-full max-w-lg bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-text-muted shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks…"
            className="text-sm flex-1 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 h-6 w-6 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!query.trim() ? (
            <p className="text-sm text-text-muted py-8 text-center">Type to search tasks…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-text-muted py-8 text-center">
              No tasks found for &lsquo;{query}&rsquo;
            </p>
          ) : (
            results.map((task, idx) => (
              <button
                key={task.id}
                type="button"
                onClick={() => selectTask(task)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-bg-hover transition-colors text-left',
                  idx === selectedIndex && 'bg-bg-active',
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: task.list?.color ?? '#636369' }}
                />
                <span className="text-sm text-text-primary truncate flex-1">{task.title}</span>
                {task.list?.name && (
                  <span className="text-xs text-text-muted max-w-24 truncate shrink-0">
                    {task.list.name}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
