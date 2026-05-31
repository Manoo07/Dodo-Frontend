import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import AppLayout from './components/layout/AppLayout'
import AuthPage from './pages/AuthPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-black tracking-tight text-text-primary mb-2">
          Do<span className="text-accent">do</span>
        </div>
        <div className="h-1 w-24 mx-auto rounded-full bg-bg-surface overflow-hidden">
          <div className="h-full w-1/2 bg-accent rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { token, user, loading, checkAuth } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      checkAuth()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (loading) return <LoadingScreen />
  if (!token) return <AuthPage />

  return <AppLayout />
}
