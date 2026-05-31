import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SidebarSectionProps {
  label: string
  icon?: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SidebarSection({ label, icon: Icon, action, children, className }: SidebarSectionProps) {
  return (
    <section className={cn('sidebar-section', className)}>
      <div className="sidebar-section-header">
        <div className="sidebar-section-label">
          {Icon && <Icon className="nav-icon" strokeWidth={1.8} />}
          <span>{label}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

interface SidebarHintProps {
  children: ReactNode
  className?: string
}

export function SidebarHint({ children, className }: SidebarHintProps) {
  return (
    <div className={cn('sidebar-hint', className)}>
      <p>{children}</p>
    </div>
  )
}

export function SidebarDivider() {
  return <div className="sidebar-divider" role="separator" />
}
