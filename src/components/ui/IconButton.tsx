import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  size?: 'sm' | 'md'
  active?: boolean
}

export default function IconButton({
  icon: Icon,
  label,
  size = 'md',
  active,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'icon-btn shrink-0',
        size === 'sm' && 'p-1',
        size === 'md' && 'p-1.5',
        active && 'bg-accent-muted text-accent',
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  )
}
