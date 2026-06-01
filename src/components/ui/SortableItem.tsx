import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface Props {
  id: string
  children: (handleProps: Record<string, unknown>) => ReactNode
  disabled?: boolean
}

/**
 * Thin wrapper that gives any item drag-to-reorder capability.
 * Pass children as a render-prop that receives the drag-handle props.
 */
export default function SortableItem({ id, children, disabled = false }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'transform 200ms ease',
        opacity: isDragging ? 0 : 1,       // hide original while dragging
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
      }}
    >
      {children({ ...attributes, ...listeners })}
    </div>
  )
}
