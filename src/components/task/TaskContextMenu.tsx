import { useEffect, useRef, useState } from 'react'
import {
  Sun,
  Sunrise,
  CalendarDays,
  X,
  Flag,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Priority } from '../../types'

export interface SubmenuItem {
  label: string
  onClick: () => void
  muted?: boolean
}

export interface MenuItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  destructive?: boolean
  dividerBefore?: boolean
  disabled?: boolean
  submenuItems?: SubmenuItem[]
}

interface TaskContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
  task?: { dueDate?: string | null; priority?: Priority }
  onSetDate?: (date: string | null) => void
  onSetPriority?: (priority: Priority) => void
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateISO(d: Date): string {
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

function isSameDay(a: string | null | undefined, b: Date): boolean {
  if (!a) return false
  const da = new Date(a)
  return da.getFullYear() === b.getFullYear() && da.getMonth() === b.getMonth() && da.getDate() === b.getDate()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-muted mb-2 px-1">
      {children}
    </p>
  )
}

function QuickDateBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 transition-all text-[10.5px] font-medium"
      style={active
        ? { background: 'rgba(255,255,255,0.14)', color: 'var(--color-text-primary)' }
        : { color: 'var(--color-text-muted)' }
      }
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <Icon
        className="h-4.5 w-4.5"
        strokeWidth={active ? 2.25 : 1.75}
      />
      <span style={{ fontWeight: active ? 600 : 500 }}>{label}</span>
    </button>
  )
}

function PriorityBtn({
  color,
  active,
  onClick,
}: {
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded-xl py-3 transition-all"
      style={active
        ? { background: color + '28', outline: `2px solid ${color}`, outlineOffset: '-2px' }
        : { outline: '2px solid transparent', outlineOffset: '-2px' }
      }
    >
      <Flag
        className="h-5 w-5"
        strokeWidth={1.75}
        style={{ color, fill: active ? color : 'transparent' }}
      />
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TaskContextMenu({
  x, y, items, onClose, task, onSetDate, onSetPriority,
}: TaskContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const submenuRef = useRef<HTMLDivElement>(null)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 })
  const submenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const inMain    = ref.current?.contains(e.target as Node)
      const inSubmenu = submenuRef.current?.contains(e.target as Node)
      if (!inMain && !inSubmenu) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  function openSubmenuFor(label: string, el: HTMLElement) {
    if (submenuTimer.current) clearTimeout(submenuTimer.current)
    const rect = el.getBoundingClientRect()
    const submenuW = 200
    const spaceRight = window.innerWidth - (left + menuW + 4)
    const submenuLeft = spaceRight >= submenuW ? left + menuW + 4 : left - submenuW - 4
    setSubmenuPos({ top: rect.top, left: submenuLeft })
    setOpenSubmenu(label)
  }

  function scheduleCloseSubmenu() {
    submenuTimer.current = setTimeout(() => setOpenSubmenu(null), 150)
  }

  function cancelCloseSubmenu() {
    if (submenuTimer.current) clearTimeout(submenuTimer.current)
  }

  const activeItems = items.filter((i) => !i.disabled)
  const menuW = 260
  const menuH = 480
  const left = Math.min(x, window.innerWidth - menuW - 12)
  const top = Math.min(y, window.innerHeight - menuH - 12)

  const today     = new Date()
  const tomorrow  = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const in7days   = new Date(); in7days.setDate(in7days.getDate() + 7)

  const PRIORITIES: { priority: Priority; color: string }[] = [
    { priority: 'p1', color: '#e05252' },
    { priority: 'p2', color: '#d4853a' },
    { priority: 'p3', color: '#5b9bd5' },
    { priority: 'none', color: '#636369' },
  ]

  return (
    <div
      ref={ref}
      className="fixed z-50"
      style={{
        left,
        top,
        width: menuW,
        background: '#1e1e22',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
        overflow: 'hidden',
      }}
    >
      {/* ── Quick date ── */}
      {onSetDate && (
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <SectionLabel>Date</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5">
            <QuickDateBtn icon={Sun}         label="Today"    active={isSameDay(task?.dueDate, today)}    onClick={() => { onSetDate(toDateISO(new Date())); onClose() }} />
            <QuickDateBtn icon={Sunrise}     label="Tomorrow" active={isSameDay(task?.dueDate, tomorrow)} onClick={() => { onSetDate(toDateISO(new Date(Date.now() + 86400000))); onClose() }} />
            <QuickDateBtn icon={CalendarDays} label="+7 days" active={isSameDay(task?.dueDate, in7days)}  onClick={() => { onSetDate(toDateISO(new Date(Date.now() + 7 * 86400000))); onClose() }} />
            <QuickDateBtn icon={X}           label="Clear"    active={!task?.dueDate}                     onClick={() => { onSetDate(null); onClose() }} />
          </div>
        </div>
      )}

      {/* ── Quick priority ── */}
      {onSetPriority && (
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <SectionLabel>Priority</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {PRIORITIES.map(({ priority, color }) => (
              <PriorityBtn
                key={priority}
                color={color}
                active={task?.priority === priority}
                onClick={() => { onSetPriority(priority); onClose() }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Action items ── */}
      <div style={{ padding: '6px 6px' }}>
        {activeItems.map((item) => {
          const Icon = item.icon
          const hasSubmenu = !!(item.submenuItems && item.submenuItems.length > 0)
          return (
            <div key={item.label}>
              {item.dividerBefore && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '5px 6px' }} />
              )}
              <button
                type="button"
                onClick={() => {
                  if (!hasSubmenu) { item.onClick(); onClose() }
                }}
                onMouseEnter={(e) => {
                  if (hasSubmenu) openSubmenuFor(item.label, e.currentTarget)
                  else { if (submenuTimer.current) clearTimeout(submenuTimer.current); setOpenSubmenu(null) }
                }}
                onMouseLeave={() => { if (hasSubmenu) scheduleCloseSubmenu() }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg text-[13.5px] font-medium text-left transition-colors',
                  item.destructive
                    ? 'text-priority-p1 hover:bg-priority-p1/10'
                    : 'text-text-primary hover:bg-white/6',
                  openSubmenu === item.label && !item.destructive && 'bg-white/6',
                )}
                style={{ padding: '9px 12px' }}
              >
                {Icon && (
                  <Icon
                    className={cn('h-[17px] w-[17px] shrink-0', item.destructive ? 'text-priority-p1' : 'text-text-muted')}
                    strokeWidth={1.75}
                  />
                )}
                <span className="flex-1">{item.label}</span>
                {hasSubmenu && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.75} />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Submenu flyout ── */}
      {openSubmenu && (() => {
        const parent = activeItems.find((i) => i.label === openSubmenu)
        if (!parent?.submenuItems?.length) return null
        return (
          <div
            ref={submenuRef}
            className="fixed z-[60]"
            style={{
              top: Math.min(submenuPos.top, window.innerHeight - parent.submenuItems.length * 40 - 20),
              left: submenuPos.left,
              width: 200,
              background: '#1e1e22',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
              padding: '6px 6px',
            }}
            onMouseEnter={cancelCloseSubmenu}
            onMouseLeave={scheduleCloseSubmenu}
          >
            {parent.submenuItems.map((sub) => (
              <button
                key={sub.label}
                type="button"
                onClick={() => { sub.onClick(); onClose() }}
                className="w-full flex items-center gap-2 rounded-lg text-[13px] font-medium text-left transition-colors hover:bg-white/6"
                style={{
                  padding: '8px 12px',
                  color: sub.muted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )
      })()}
    </div>
  )
}

