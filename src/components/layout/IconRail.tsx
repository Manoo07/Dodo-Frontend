import {
  CheckSquare,
  Calendar,
  Clock,
  LayoutGrid,
  Target,
  Star,
  Search,
  RefreshCw,
  Bell,
  HelpCircle,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/cn'

type Action = 'tasks' | 'matrix' | 'search' | null

// Top 4 are navigable; rest are placeholders / not yet built
const NAV_ITEMS: { icon: typeof CheckSquare; label: string; action: Action; soon?: boolean }[] = [
  { icon: CheckSquare, label: 'Tasks',   action: 'tasks'  },
  { icon: Calendar,    label: 'Calendar', action: null, soon: true },
  { icon: Clock,       label: 'Focus',    action: null, soon: true },
  { icon: LayoutGrid,  label: 'Matrix',   action: 'matrix' },
  { icon: Target,      label: 'Habits',   action: null, soon: true },
  { icon: Star,        label: 'Premium',  action: null },
  { icon: Search,      label: 'Search',   action: 'search' },
]

const BOTTOM_ITEMS = [
  { icon: RefreshCw, label: 'Sync' },
  { icon: Bell,      label: 'Notifications' },
  { icon: HelpCircle, label: 'Help' },
]

function RailButton({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof CheckSquare
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150',
        active && 'bg-accent/15 text-accent',
        !active && !disabled && 'text-text-muted hover:bg-white/6 hover:text-text-secondary cursor-pointer',
        disabled && 'text-text-muted opacity-25 cursor-not-allowed',
      )}
    >
      {/* Active indicator — left accent bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
          style={{ width: 3, height: 22, background: 'var(--color-accent)' }}
        />
      )}
      <Icon className="nav-icon" strokeWidth={active ? 2 : 1.6} />
    </button>
  )
}

export default function IconRail() {
  const setIsSearchOpen = useAppStore((s) => s.setIsSearchOpen)
  const setSelectedView = useAppStore((s) => s.setSelectedView)
  const selectedView    = useAppStore((s) => s.selectedView)

  function handleClick(action: Action) {
    if (action === 'search') { setIsSearchOpen(true); return }
    if (action === 'matrix') { setSelectedView('matrix'); return }
    if (action === 'tasks')  { setSelectedView('today');  return }
  }

  return (
    <nav
      className="icon-rail flex flex-col items-center h-full bg-bg-sidebar border-r border-border shrink-0"
      aria-label="Main navigation"
    >
      <div
        className="icon-rail-avatar"
        style={{ background: 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)' }}
      >
        T
      </div>

      <div className="flex flex-col items-center gap-1 mt-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.action === 'matrix' ? selectedView === 'matrix' :
            item.action === 'tasks'  ? selectedView !== 'matrix' :
            false
          return (
            <RailButton
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={isActive}
              disabled={item.action === null}
              onClick={() => handleClick(item.action)}
            />
          )
        })}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-1 pb-4">
        {BOTTOM_ITEMS.map((item) => (
          <RailButton key={item.label} icon={item.icon} label={item.label} disabled />
        ))}
      </div>
    </nav>
  )
}
