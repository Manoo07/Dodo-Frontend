import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Sun,
  CalendarRange,
  Inbox,
  Plus,
  CheckCircle2,
  Trash2,
  Filter,
  Tag,
  ChevronRight,
  Folder,
  LogOut,
  X,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useDataStore } from '../../store/useDataStore'
import { useAuthStore } from '../../store/useAuthStore'
import AddListModal from '../list/AddListModal'
import { SidebarSection, SidebarHint, SidebarDivider } from './SidebarSection'
import { cn } from '../../lib/cn'
import type { LucideIcon } from 'lucide-react'
import type { Folder as FolderType, List, NavView } from '../../types'

const NAV_ITEMS: { view: NavView; label: string; icon: LucideIcon }[] = [
  { view: 'today', label: 'Today', icon: Sun },
  { view: 'next7days', label: 'Next 7 Days', icon: CalendarRange },
  { view: 'inbox', label: 'Inbox', icon: Inbox },
]

function NavButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('nav-item', active ? 'nav-item-active' : 'nav-item-default')}
    >
      <Icon className="nav-icon" strokeWidth={1.8} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="nav-count-badge">{count}</span>
      )}
    </button>
  )
}

function ListButton({
  list,
  count,
  active,
  onClick,
  onDelete,
}: {
  list: List
  count: number
  active: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete()
    } else {
      setConfirmDelete(true)
      // Auto-reset after 3s if not confirmed
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div
      className={cn(
        'group nav-item relative',
        active ? 'nav-item-active' : 'nav-item-default',
      )}
      style={{ paddingRight: 6 }}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 flex-1 min-w-0"
        style={{ height: '100%' }}
      >
        {list.icon ? (
          <span className="shrink-0 text-sm leading-none">{list.icon}</span>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
        )}
        <span className="flex-1 truncate text-left">{list.name}</span>
      </button>

      {/* Task count — hidden when delete button shows */}
      {count > 0 && !confirmDelete && (
        <span className="nav-count-badge shrink-0 group-hover:hidden">{count}</span>
      )}

      {/* Delete button — appears on hover */}
      <button
        type="button"
        onClick={handleDelete}
        title={confirmDelete ? 'Click again to confirm delete' : 'Delete list'}
        className={cn(
          'shrink-0 flex items-center justify-center rounded-md transition-all',
          confirmDelete
            ? 'opacity-100 text-priority-p1 bg-priority-p1/10'
            : 'opacity-0 group-hover:opacity-100 text-text-muted hover:text-priority-p1 hover:bg-priority-p1/10',
        )}
        style={{ width: 22, height: 22 }}
      >
        {confirmDelete ? (
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        ) : (
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  )
}

function FolderGroup({
  folder,
  lists,
  getCount,
  selectedListId,
  onListClick,
  onDeleteList,
}: {
  folder: FolderType
  lists: List[]
  getCount: (listId: string) => number
  selectedListId: string | null
  onListClick: (id: string) => void
  onDeleteList: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const folderLists = lists.filter((l) => l.folderId === folder.id)

  if (folderLists.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="nav-item nav-item-default w-full"
      >
        <ChevronRight
          className={cn('nav-icon transition-transform', expanded && 'rotate-90')}
          strokeWidth={1.8}
        />
        <Folder className="nav-icon" strokeWidth={1.8} />
        <span className="flex-1 truncate">{folder.name}</span>
      </button>
      {expanded && (
        <div className="sidebar-folder-children space-y-0">
          {folderLists.map((list) => (
            <ListButton
              key={list.id}
              list={list}
              count={getCount(list.id)}
              active={selectedListId === list.id}
              onClick={() => onListClick(list.id)}
              onDelete={() => onDeleteList(list.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Sidebar() {
  const {
    selectedView,
    selectedListId,
    selectedTagId,
    setSelectedView,
    navigateToList,
    setMobilePane,
    setSelectedTagId,
  } = useAppStore()

  const lists = useDataStore((s) => s.lists)
  const folders = useDataStore((s) => s.folders)
  const tags = useDataStore((s) => s.tags)
  const tasks = useDataStore((s) => s.tasks)
  const getListTaskCount = useDataStore((s) => s.getListTaskCount)
  const deleteList = useDataStore((s) => s.deleteList)

  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [showAddList, setShowAddList] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const tagTaskCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const task of tasks) {
      if (task.status === 'deleted') continue
      for (const tt of task.tags) {
        map[tt.tagId] = (map[tt.tagId] ?? 0) + 1
      }
    }
    return map
  }, [tasks])

  const unfiledLists = lists.filter((l) => !l.folderId)

  function handleNavClick(view: NavView) {
    setSelectedView(view)
    setMobilePane('list')
  }

  function handleListClick(listId: string) {
    navigateToList(listId)
    setMobilePane('list')
  }

  function handleTagClick(tagId: string) {
    setSelectedTagId(tagId)
    setMobilePane('list')
  }

  const isNavActive = (view: NavView) =>
    selectedView === view && !selectedListId && !selectedTagId

  return (
    <>
      {/* aside has no overflow so top/bottom nav stay pinned; only the middle scrolls */}
      <aside className="bg-bg-sidebar border-r border-border flex flex-col h-full overflow-hidden">

        {/* ── Fixed top nav ── */}
        <nav className="sidebar-section pt-3 pb-1 space-y-0.5 shrink-0">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.view}
              icon={item.icon}
              label={item.label}
              active={isNavActive(item.view)}
              onClick={() => handleNavClick(item.view)}
            />
          ))}
        </nav>

        <SidebarDivider />

        {/* ── Scrollable middle ── */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          <SidebarSection
            label="Lists"
            className="pt-3 pb-2"
            action={
              <button
                type="button"
                onClick={() => setShowAddList(true)}
                className="icon-btn"
                title="New list"
                aria-label="New list"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            }
          >
            {lists.length === 0 ? (
              <SidebarHint>
                No lists yet. Click <span className="text-text-secondary font-semibold">+</span> to
                create your first list.
              </SidebarHint>
            ) : (
              <div className="space-y-0.5">
                {unfiledLists.map((list) => (
                  <ListButton
                    key={list.id}
                    list={list}
                    count={getListTaskCount(list.id)}
                    active={selectedView === 'list' && selectedListId === list.id}
                    onClick={() => handleListClick(list.id)}
                    onDelete={() => deleteList(list.id)}
                  />
                ))}
                {folders.map((folder) => (
                  <FolderGroup
                    key={folder.id}
                    folder={folder}
                    lists={lists}
                    getCount={getListTaskCount}
                    selectedListId={selectedListId}
                    onListClick={handleListClick}
                    onDeleteList={(id) => deleteList(id)}
                  />
                ))}
              </div>
            )}
          </SidebarSection>

          <SidebarDivider />

          <SidebarSection label="Filters" icon={Filter} className="pt-3 pb-2">
            <SidebarHint>Filter tasks by list, date, priority, tag, and more.</SidebarHint>
          </SidebarSection>

          <SidebarDivider />

          <SidebarSection label="Tags" icon={Tag} className="pt-3 pb-3">
            {tags.length === 0 ? (
              <SidebarHint>
                Type <span className="font-mono text-text-secondary">#</span> when adding a task to
                assign tags.
              </SidebarHint>
            ) : (
              <div className="space-y-0.5">
                {tags.map((tag) => {
                  const count = tagTaskCounts[tag.id] ?? 0
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagClick(tag.id)}
                      className={cn(
                        'nav-item',
                        selectedTagId === tag.id ? 'nav-item-active' : 'nav-item-default',
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 truncate">{tag.name}</span>
                      {count > 0 && <span className="nav-count-badge">{count}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </SidebarSection>

        </div>

        {/* ── Fixed bottom nav — always visible ── */}
        <div className="sidebar-section shrink-0" style={{ paddingTop: 12, paddingBottom: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Completed + Trash */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <NavButton
              icon={CheckCircle2}
              label="Completed"
              active={isNavActive('completed')}
              onClick={() => handleNavClick('completed')}
            />
            <NavButton
              icon={Trash2}
              label="Trash"
              active={isNavActive('trash')}
              onClick={() => handleNavClick('trash')}
            />
          </div>

          {/* Divider */}
          {user && (
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 4px' }} />
          )}

          {/* User row — always visible, no inline dialog */}
          {user && (
            <div style={{ padding: '0 4px' }}>
              <div
                className="flex items-center gap-3 rounded-xl group transition-colors hover:bg-white/4"
                style={{ padding: '8px 10px' }}
              >
                <div
                  className="shrink-0 select-none flex items-center justify-center rounded-full bg-accent text-white font-bold"
                  style={{ width: 30, height: 30, fontSize: 13 }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="truncate text-[13px] font-medium text-text-primary leading-none" style={{ marginBottom: 3 }}>
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-text-muted leading-none">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  title="Sign out"
                  className="icon-btn shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}
        </div>

      </aside>

      <AddListModal open={showAddList} onClose={() => setShowAddList(false)} />

      {/* ── Centered sign-out confirmation modal ── */}
      {confirmLogout && user && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', padding: 20 }}
          onClick={() => setConfirmLogout(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#1e1e22',
              border: '1px solid rgba(224,82,82,0.3)',
              borderRadius: 18,
              padding: '28px 24px 22px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(224,82,82,0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(224,82,82,0.12)',
              border: '1px solid rgba(224,82,82,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogOut style={{ width: 22, height: 22, color: 'var(--color-priority-p1)' }} strokeWidth={1.75} />
            </div>

            {/* Text */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p className="text-[16px] font-semibold text-text-primary">Sign out?</p>
              <p className="text-[13px] text-text-muted leading-relaxed">
                You'll be signed out of{' '}
                <span className="text-text-secondary font-medium">{user.name}</span>'s account.<br />
                You'll need to log in again to continue.
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="flex-1 rounded-xl text-[13.5px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                style={{ height: 42, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex-1 rounded-xl text-[13.5px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ height: 42, background: 'var(--color-priority-p1)' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
