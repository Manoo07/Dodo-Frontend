import { Check } from 'lucide-react'
import { cn } from '../../lib/cn'

const PRIORITY_BORDER: Record<string, string> = {
  p1: 'var(--color-priority-p1)',
  p2: 'var(--color-priority-p2)',
  p3: 'var(--color-priority-p3)',
  none: '#52525a',
}

interface TaskCheckboxProps {
  checked?: boolean
  priority?: string
  disabled?: boolean
  onClick?: (e: React.MouseEvent) => void
  size?: 'sm' | 'md'
}

export default function TaskCheckbox({
  checked,
  priority = 'none',
  disabled,
  onClick,
  size = 'md',
}: TaskCheckboxProps) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        dim,
        'rounded-[5px] border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-150',
        !disabled && 'hover:opacity-80',
      )}
      style={{
        borderColor: checked ? 'transparent' : PRIORITY_BORDER[priority] ?? PRIORITY_BORDER.none,
        backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
      }}
    >
      {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
    </button>
  )
}
