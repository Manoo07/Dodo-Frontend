import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown, Sparkles } from 'lucide-react'

const QUOTES = [
  { text: '"The secret of getting ahead is getting started."', author: '— Mark Twain', color: '#7c3aed' },
  { text: '"Focus on being productive instead of busy."', author: '— Tim Ferriss', color: '#0891b2' },
  { text: '"Small progress is still progress. Ship the thing."', author: '— Unknown', color: '#059669' },
  { text: '"You don\'t have to be great to start, but you have to start to be great."', author: '— Zig Ziglar', color: '#d97706' },
  { text: '"Done is better than perfect."', author: '— Sheryl Sandberg', color: '#db2777' },
  { text: '"Doing things the hard way makes you stronger when hardships come."', author: '— Unknown', color: '#0e7490' },
  { text: '"Consistency always compounds. Winners are built when nobody is watching."', author: '— Unknown', color: '#65a30d' },
]

const INTERVAL_MS = 4500

export default function MotivationalBanner() {
  const [idx, setIdx] = useState(0)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('tasknest-banner-collapsed') === 'true' } catch { return false }
  })
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % QUOTES.length)
      setAnimKey(k => k + 1)
    }, INTERVAL_MS)
  }, [])

  useEffect(() => {
    if (!collapsed) {
      startTimer()
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [collapsed, startTimer])

  useEffect(() => {
    try { localStorage.setItem('tasknest-banner-collapsed', String(collapsed)) } catch {}
  }, [collapsed])

  function goTo(n: number) {
    setIdx(n)
    setAnimKey(k => k + 1)
    startTimer()
  }

  const q = QUOTES[idx]

  return (
    <div
      className="shrink-0 border-b border-border overflow-hidden relative"
      style={{
        height: collapsed ? 28 : 72,
        transition: 'height 0.25s ease',
        background: 'var(--color-bg-elevated)',
      }}
    >
      {collapsed ? (
        /* Slim bar */
        <button
          type="button"
          className="w-full h-7 flex items-center gap-2 px-4 transition-colors hover:bg-white/3"
          onClick={() => setCollapsed(false)}
        >
          <Sparkles className="h-3 w-3 shrink-0 text-text-muted" strokeWidth={1.75} />
          <span className="text-[11px] text-text-muted">Daily motivation</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-muted ml-auto" strokeWidth={1.75} />
        </button>
      ) : (
        <>
          {/* Label */}
          <span className="absolute top-1.5 left-4 text-[9px] font-semibold uppercase tracking-widest text-text-muted opacity-40 pointer-events-none select-none">
            Daily motivation
          </span>

          {/* Quote row */}
          <div className="flex items-center h-full px-4 pr-10" style={{ paddingTop: 14 }}>
            <div
              className="shrink-0 mr-3 rounded-sm"
              style={{ width: 3, height: 32, background: q.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] leading-[1.4] text-text-secondary truncate">{q.text}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{q.author}</p>
            </div>
          </div>

          {/* Dot navigation */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-[5px]">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Quote ${i + 1}`}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: 5,
                  height: 5,
                  background: i === idx ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.14)',
                }}
              />
            ))}
          </div>

          {/* Collapse chevron */}
          <button
            type="button"
            title="Collapse"
            onClick={() => setCollapsed(true)}
            className="absolute top-1.5 right-2 flex items-center justify-center text-text-muted hover:text-text-secondary transition-colors"
            style={{ width: 20, height: 20 }}
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>

          {/* Progress bar */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              key={animKey}
              style={{
                height: '100%',
                background: q.color,
                opacity: 0.55,
                animation: `bannerProgress ${INTERVAL_MS}ms linear`,
                animationFillMode: 'forwards',
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
