import {
  Briefcase, BookOpen, Star, Home, Heart, Rocket, Target, Music,
  Coffee, Globe, Code, Zap, Flag, Bell, Inbox, Archive,
  Folder, Tag, Users, ShoppingCart, Calendar, Clipboard, Clock,
  Layers, Lightbulb, Microscope, Plane, Shield, Wrench, Dumbbell,
  type LucideIcon,
} from 'lucide-react'

export const LIST_ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, BookOpen, Star, Home, Heart, Rocket, Target, Music,
  Coffee, Globe, Code, Zap, Flag, Bell, Inbox, Archive,
  Folder, Tag, Users, ShoppingCart, Calendar, Clipboard, Clock,
  Layers, Lightbulb, Microscope, Plane, Shield, Wrench, Dumbbell,
}

export const LIST_ICON_KEYS = Object.keys(LIST_ICON_MAP)

interface Props {
  value: string | null
  onChange: (key: string | null) => void
  color?: string
}

export default function ListIconPicker({ value, onChange, color = '#5b9bd5' }: Props) {
  return (
    <div>
      <p className="text-[11.5px] font-semibold text-text-muted uppercase tracking-widest mb-3">
        Icon
      </p>
      <div className="flex flex-wrap gap-1.5">

        {/* None / Clear option */}
        <IconCell
          active={value === null}
          color={color}
          onClick={() => onChange(null)}
          title="No icon"
        >
          <span className="text-[11px] font-semibold" style={{ color: value === null ? color : 'var(--color-text-muted)' }}>
            —
          </span>
        </IconCell>

        {/* Icon grid */}
        {LIST_ICON_KEYS.map((key) => {
          const Icon = LIST_ICON_MAP[key]
          const active = value === key
          return (
            <IconCell key={key} active={active} color={color} onClick={() => onChange(key)} title={key}>
              <Icon
                className="h-4 w-4"
                strokeWidth={active ? 2 : 1.75}
                style={{ color: active ? color : 'var(--color-text-muted)' }}
              />
            </IconCell>
          )
        })}
      </div>
    </div>
  )
}

// ── Reusable cell with proper active / hover states ───────────────────────────

function IconCell({
  active,
  color,
  onClick,
  title,
  children,
}: {
  active: boolean
  color: string
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-lg transition-all"
      style={{
        width: 36,
        height: 36,
        // Active: tinted background + solid border in list colour + slight scale
        background: active
          ? `${color}26`                      // ~15 % opacity tint
          : 'rgba(255,255,255,0.05)',
        border: active
          ? `1.5px solid ${color}`            // full-colour border when selected
          : '1.5px solid rgba(255,255,255,0.08)',
        transform: active ? 'scale(1.08)' : 'scale(1)',
        boxShadow: active ? `0 0 0 3px ${color}22` : 'none',  // soft glow
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
          e.currentTarget.style.border     = '1.5px solid rgba(255,255,255,0.18)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.border     = '1.5px solid rgba(255,255,255,0.08)'
        }
      }}
    >
      {children}
    </button>
  )
}
