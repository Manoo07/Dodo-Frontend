import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-8', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface border border-border/80 mb-5">
        <Icon className="h-6 w-6 text-text-muted" strokeWidth={1.5} />
      </div>
      <p className="text-[15px] font-semibold text-text-secondary">{title}</p>
      {description && (
        <p className="text-sm leading-relaxed text-text-muted mt-2 max-w-[280px]">{description}</p>
      )}
    </div>
  )
}
