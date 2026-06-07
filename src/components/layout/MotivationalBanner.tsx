import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown, Sparkles, X } from 'lucide-react'

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

type BannerState = 'expanded' | 'collapsed' | 'closed'

function readState(): BannerState {
  try { return (localStorage.getItem('tasknest-banner') as BannerState) ?? 'expanded' } catch { return 'expanded' }
}

export default function MotivationalBanner() {
  const [bannerState, setBannerState] = useState<BannerState>(readState)
  const [idx, setIdx] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % QUOTES.length)
    }, INTERVAL_MS)
  }, [])

  useEffect(() => {
    if (bannerState === 'expanded') {
      startTimer()
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [bannerState, startTimer])

  useEffect(() => {
    try { localStorage.setItem('tasknest-banner', bannerState) } catch {}
  }, [bannerState])

  function goTo(n: number) {
    setIdx(n)
    startTimer()
  }

  if (bannerState === 'closed') return null

  const q = QUOTES[idx]

  return (
    <div
      className="shrink-0 border-b border-border overflow-hidden relative"
      style={{
        height: bannerState === 'collapsed' ? 26 : 60,
        transition: 'height 0.22s ease',
        background: 'var(--color-bg-elevated)',
      }}
    >
      {bannerState === 'collapsed' ? (
        /* ── Slim bar ── */
        <div className="flex items-center h-full gap-2 px-3">
          <Sparkles className="h-3 w-3 shrink-0 text-text-muted opacity-50" strokeWidth={1.75} />
          <button
            type="button"
            className="flex-1 text-left text-[11px] text-text-muted opacity-50 hover:opacity-80 transition-opacity truncate"
            onClick={() => setBannerState('expanded')}
          >
            Daily motivation
          </button>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              title="Expand"
              onClick={() => setBannerState('expanded')}
              className="flex items-center justify-center text-text-muted opacity-40 hover:opacity-70 transition-opacity"
              style={{ width: 20, height: 20 }}
            >
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              title="Close"
              onClick={() => setBannerState('closed')}
              className="flex items-center justify-center text-text-muted opacity-40 hover:opacity-70 transition-opacity"
              style={{ width: 20, height: 20 }}
            >
              <X className="h-3 w-3" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Full banner ── */
        <>
          {/* Quote row */}
          <div className="flex items-center h-full px-4 pr-20" style={{ paddingTop: 10 }}>
            {/* Thin accent */}
            <div
              className="shrink-0 mr-3 rounded-full"
              style={{ width: 2, height: 24, background: q.color, opacity: 0.55 }}
            />
            <div className="min-w-0 flex-1">
              <p
                className="text-[12px] leading-[1.45] truncate"
                style={{ color: 'var(--color-text-muted)', opacity: 0.85 }}
              >
                {q.text}
              </p>
              <p
                className="text-[10.5px] mt-0.5"
                style={{ color: 'var(--color-text-muted)', opacity: 0.45 }}
              >
                {q.author}
              </p>
            </div>
          </div>

          {/* Dot navigation */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-0.75">
            {QUOTES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Quote ${i + 1}`}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: 4,
                  height: 4,
                  background: i === idx ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>

          {/* Action buttons: collapse + close */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
            <button
              type="button"
              title="Collapse"
              onClick={() => setBannerState('collapsed')}
              className="flex items-center justify-center text-text-muted opacity-35 hover:opacity-65 transition-opacity"
              style={{ width: 22, height: 22 }}
            >
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              title="Close"
              onClick={() => setBannerState('closed')}
              className="flex items-center justify-center text-text-muted opacity-35 hover:opacity-65 transition-opacity"
              style={{ width: 22, height: 22 }}
            >
              <X className="h-3 w-3" strokeWidth={1.75} />
            </button>
          </div>

        </>
      )}
    </div>
  )
}
