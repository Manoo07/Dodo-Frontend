import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

interface PanelResizerProps {
  orientation?: 'vertical' | 'horizontal'
  onDrag: (delta: number) => void
  onDragEnd?: () => void
  className?: string
  label?: string
}

export default function PanelResizer({
  orientation = 'vertical',
  onDrag,
  onDragEnd,
  className,
  label,
}: PanelResizerProps) {
  const dragging = useRef(false)
  const [active, setActive] = useState(false)
  const isHorizontal = orientation === 'horizontal'

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    setActive(true)
  }, [])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      onDrag(isHorizontal ? e.movementY : e.movementX)
    }

    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      setActive(false)
      onDragEnd?.()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [onDrag, onDragEnd, isHorizontal])

  useEffect(() => {
    if (!active) return
    document.body.style.cursor = isHorizontal ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [active, isHorizontal])

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      aria-label={label ?? 'Resize panel'}
      className={cn(
        isHorizontal ? 'panel-resizer-horizontal' : 'panel-resizer',
        active && 'panel-resizer-active',
        className,
      )}
      onMouseDown={handleMouseDown}
    />
  )
}
