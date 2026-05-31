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

const NAV_ITEMS = [
  { icon: CheckSquare, label: 'Tasks', active: true, action: undefined },
  { icon: Calendar, label: 'Calendar', action: undefined },
  { icon: Clock, label: 'Focus', action: undefined },
  { icon: LayoutGrid, label: 'Matrix', action: undefined },
  { icon: Target, label: 'Habits', action: undefined },
  { icon: Star, label: 'Premium', action: undefined },
  { icon: Search, label: 'Search', action: 'search' as const },
]

const BOTTOM_ITEMS = [
  { icon: RefreshCw, label: 'Sync' },
  { icon: Bell, label: 'Notifications' },
  { icon: HelpCircle, label: 'Help' },
]

function RailButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof CheckSquare
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-bg-hover text-text-primary'
          : 'text-text-muted hover:bg-bg-surface hover:text-text-secondary',
      )}
    >
      <Icon className="nav-icon" strokeWidth={1.8} />
    </button>
  )
}

export default function IconRail() {
  const setIsSearchOpen = useAppStore((s) => s.setIsSearchOpen)

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

      <div className="flex flex-col items-center gap-0.5 mt-1">
        {NAV_ITEMS.map((item) => (
          <RailButton
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={item.active}
            onClick={item.action === 'search' ? () => setIsSearchOpen(true) : undefined}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-0.5 pb-3">
        {BOTTOM_ITEMS.map((item) => (
          <RailButton key={item.label} icon={item.icon} label={item.label} />
        ))}
      </div>
    </nav>
  )
}
