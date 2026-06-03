import type { CSSProperties } from 'react'

/** A single shimmer block — pass width + height as style props */
export default function SkeletonBlock({
  w,
  h = 11,
  rounded = 6,
  className,
  style,
}: {
  w: string | number
  h?: number
  rounded?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`sk ${className ?? ''}`}
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: h,
        borderRadius: rounded,
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
