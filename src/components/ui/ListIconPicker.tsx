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
        {/* None option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          title="No icon"
          className="flex items-center justify-center rounded-lg transition-all"
          style={{
            width: 36, height: 36,
            background: value === null ? color + '20' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${value === null ? color + '60' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          <span className="text-[11px] text-text-muted font-medium">—</span>
        </button>

        {/* Icon options */}
        {LIST_ICON_KEYS.map((key) => {
          const Icon = LIST_ICON_MAP[key]
          const active = value === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              title={key}
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                width: 36, height: 36,
                background: active ? color + '20' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${active ? color + '60' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <Icon
                className="h-4 w-4"
                strokeWidth={1.75}
                style={{ color: active ? color : 'var(--color-text-muted)' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
