import { useEffect, useRef } from 'react'
import { Flag, Check } from 'lucide-react'
import type { Priority } from '../../types'

const OPTIONS: { key: Priority; label: string; color: string }[] = [
  { key: 'p1',   label: 'High',   color: '#e05252' },
  { key: 'p2',   label: 'Medium', color: '#d4853a' },
  { key: 'p3',   label: 'Low',    color: '#5b9bd5' },
  { key: 'none', label: 'None',   color: '#636369' },
]

interface Props {
  value: Priority
  onChange: (p: Priority) => void
  onClose: () => void
}

export default function PriorityPicker({ value, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
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

  return (
    <div
      ref={ref}
      style={{
        background: '#1e1e22',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14,
        padding: '6px 6px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
        minWidth: 180,
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => { onChange(opt.key); onClose() }}
            className="w-full flex items-center gap-3 rounded-xl transition-colors text-left"
            style={{
              padding: '9px 12px',
              background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >
            <Flag
              className="h-4 w-4 shrink-0"
              strokeWidth={1.75}
              style={{
                color: opt.color,
                fill: opt.key !== 'none' ? opt.color : 'transparent',
              }}
            />
            <span
              className="flex-1 text-[13.5px] font-medium"
              style={{ color: active ? opt.color : 'var(--color-text-primary)' }}
            >
              {opt.label}
            </span>
            {active && (
              <Check
                className="h-3.5 w-3.5 shrink-0"
                strokeWidth={2.5}
                style={{ color: opt.color }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
