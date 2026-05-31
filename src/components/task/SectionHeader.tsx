import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'

interface SectionHeaderProps {
  name: string
  count: number
  isExpanded: boolean
  onToggle: () => void
}

export default function SectionHeader({ name, count, isExpanded, onToggle }: SectionHeaderProps) {
  return (
    <button type="button" onClick={onToggle} className="section-header-row group">
      <ChevronRight
        className={cn(
          'h-4 w-4 text-text-muted shrink-0 transition-transform duration-150',
          isExpanded && 'rotate-90',
        )}
        strokeWidth={1.75}
      />
      <span className="section-header-title">{name}</span>
      <span className="section-header-count">{count}</span>
    </button>
  )
}
