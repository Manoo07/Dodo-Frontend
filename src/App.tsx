import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen({ complete }: { complete: boolean }) {
  const [barWidth, setBarWidth] = useState(4)

  // Simulate realistic async progress — stalls near 85% waiting for real completion
  useEffect(() => {
    const steps: [number, number][] = [
      [80,   20],
      [250,  45],
      [600,  65],
      [1000, 78],
      [1600, 84],
      [2400, 87],
    ]
    const timers = steps.map(([delay, w]) =>
      setTimeout(() => setBarWidth((prev) => (prev < w ? w : prev)), delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // When actual loading finishes → jump to 100 %
  useEffect(() => {
    if (complete) setBarWidth(100)
  }, [complete])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center select-none">
        <h1 className="text-[28px] font-black tracking-[-0.04em] text-text-primary leading-none mb-4">
          Do<span className="text-accent">do</span>
        </h1>

        {/* Progress bar */}
        <div
          className="mx-auto rounded-full overflow-hidden"
          style={{ width: 100, height: 3, background: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background: 'var(--color-accent)',
              transition: complete
                ? 'width 0.25s ease-out'   // snap quickly to 100%
                : 'width 0.55s ease-out',  // slow creep during load
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

export default function App() {
  const { token, user, loading, checkAuth } = useAuthStore()

  // Whether the auth check has finished (or was never needed)
  const [initDone, setInitDone] = useState(false)
  // Whether we've waited for the completion animation to finish
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (token && !user) {
      checkAuth()
    } else {
      // No token — no async work needed, mark done immediately
      setInitDone(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Mark done as soon as checkAuth finishes
  useEffect(() => {
    if (!loading && (user !== null || !token)) {
      setInitDone(true)
    }
  }, [loading, user, token])

  // After initDone, hold the loading screen for 350ms so the bar visibly
  // completes to 100% before the content transitions in
  useEffect(() => {
    if (!initDone) return
    const t = setTimeout(() => setShowContent(true), 350)
    return () => clearTimeout(t)
  }, [initDone])

  if (!showContent) return <LoadingScreen complete={initDone} />
  if (!token)       return <AuthPage />
  return <AppLayout />
}
