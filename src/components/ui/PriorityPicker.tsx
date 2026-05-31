import { useEffect } from 'react'
import { Check } from 'lucide-react'

type PriorityKey = 'p1' | 'p2' | 'p3' | 'none'

interface PriorityOption {
  key: PriorityKey
  label: string
  color: string
}

const OPTIONS: PriorityOption[] = [
  { key: 'p1',   label: 'Urgent', color: '#e05252' },
  { key: 'p2',   label: 'High',   color: '#d4853a' },
  { key: 'p3',   label: 'Medium', color: '#5b9bd5' },
  { key: 'none', label: 'None',   color: '#636369' },
]

interface PriorityPickerProps {
  value: PriorityKey
  onChange: (p: PriorityKey) => void
  onClose: () => void
}

export default function PriorityPicker({ value, onChange, onClose }: PriorityPickerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="bg-bg-elevated border border-border rounded-xl py-1.5 shadow-xl w-44">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => {
            onChange(option.key)
            onClose()
          }}
          className="w-full px-3 py-2 flex items-center gap-2.5 cursor-pointer hover:bg-bg-hover transition-colors"
        >
          {/* Colored dot */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: option.color }}
          />

          {/* Label */}
          <span className="text-sm text-text-primary flex-1 text-left">{option.label}</span>

          {/* Check icon if active */}
          {value === option.key && (
            <Check
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={2.5}
              style={{ color: '#5b9bd5' }}
            />
          )}
        </button>
      ))}
    </div>
  )
}
