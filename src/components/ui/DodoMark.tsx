/** The "DO" icon mark — scales via width/height props */
export default function DodoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect width="64" height="64" rx="16" fill="#5b9bd5" />
      {/* D */}
      <rect x="14" y="18" width="7" height="28" rx="3.5" fill="#fff" />
      <rect x="14" y="18" width="20" height="7" rx="3.5" fill="#fff" />
      <rect x="14" y="39" width="20" height="7" rx="3.5" fill="#fff" />
      <rect x="27" y="18" width="7" height="28" rx="3.5" fill="#fff" />
      {/* O */}
      <rect x="37" y="18" width="13" height="28" rx="6.5" fill="#fff" />
      <rect x="40" y="24" width="7" height="16" rx="3.5" fill="#5b9bd5" />
    </svg>
  )
}
