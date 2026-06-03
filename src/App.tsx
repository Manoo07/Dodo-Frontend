import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'
import DodoMark from './components/ui/DodoMark'

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen({ complete }: { complete: boolean }) {
  const [barWidth, setBarWidth] = useState(4)

  // Simulate realistic async progress — stalls near 85% waiting for completion
  useEffect(() => {
    const steps: [number, number][] = [
      [80,   20],
      [250,  42],
      [600,  60],
      [1000, 72],
      [1600, 80],
      [2400, 85],
      [3500, 88],
    ]
    const timers = steps.map(([delay, w]) =>
      setTimeout(() => setBarWidth((prev) => (prev < w ? w : prev)), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // When actual loading finishes → fill to 100%
  useEffect(() => {
    if (complete) setBarWidth(100)
  }, [complete])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center select-none">
        <div className="flex items-center gap-3 mb-4">
          <DodoMark size={36} />
          <h1 className="text-[28px] font-black tracking-[-0.04em] text-text-primary leading-none">
            dodo
          </h1>
        </div>
        <div
          className="mx-auto rounded-full overflow-hidden"
          style={{ width: 100, height: 3, background: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background: 'var(--color-accent)',
              transition: complete ? 'width 0.25s ease-out' : 'width 0.55s ease-out',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const { token, user, loading: authLoading, checkAuth } = useAuthStore()

  // Whether all async initialization is done
  const [initDone, setInitDone] = useState(false)
  // Whether we've held the screen long enough to show the completed bar
  const [showContent, setShowContent] = useState(false)

  // Step 1 — verify auth token
  useEffect(() => {
    if (token && !user) {
      checkAuth()
    } else {
      // No token — nothing async needed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Step 2 — mark initDone as soon as auth check finishes
  // Data loading happens inside AppLayout with skeleton loaders
  useEffect(() => {
    if (!authLoading) {
      setInitDone(true)
    }
  }, [authLoading])

  // Step 4 — wait 350ms after initDone so bar visibly reaches 100%
  useEffect(() => {
    if (!initDone) return
    const t = setTimeout(() => setShowContent(true), 350)
    return () => clearTimeout(t)
  }, [initDone])

  if (!showContent) return <LoadingScreen complete={initDone} />
  if (!token)       return <AuthPage />
  return <AppLayout />
}
