import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, ArrowLeft, Loader } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { cn } from '../lib/cn'

// ── Shared field ──────────────────────────────────────────────────────────────

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  error?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label className="text-[11.5px] font-semibold text-text-secondary tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{ paddingLeft: 14, paddingRight: isPassword ? 44 : 14 }}
          className={cn(
            'w-full h-11 rounded-xl text-[13.5px] text-text-primary',
            'bg-bg-primary/80 border-2 outline-none transition-all',
            'placeholder:text-text-muted/40',
            error
              ? 'border-priority-p1/50 focus:border-priority-p1/80 focus:shadow-[0_0_0_3px_rgba(224,82,82,0.1)]'
              : 'border-white/8 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(91,155,213,0.12)]',
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted/60 hover:text-text-muted transition-colors"
          >
            {show ? <EyeOff className="h-4.25 w-4.25" /> : <Eye className="h-4.25 w-4.25" />}
          </button>
        )}
      </div>
      {error && <p className="text-[12px] text-priority-p1/90 font-medium">{error}</p>}
    </div>
  )
}

function SubmitButton({ loading, disabled, children }: { loading?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        'w-full h-11 rounded-xl text-sm font-semibold text-white',
        'bg-accent hover:bg-accent-hover active:scale-[0.98]',
        'flex items-center justify-center gap-2',
        'transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        'shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
      )}
    >
      {loading && <Loader className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 text-[12.5px] text-priority-p1 bg-priority-p1/[0.08] border border-priority-p1/20 rounded-xl px-3.5 py-2.5 leading-relaxed">
      <span className="mt-px shrink-0">⚠</span>
      {message}
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────

function LoginForm() {
  const { login, loading, error, setAuthPage, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearError() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" autoComplete="current-password" />

      {error && <ErrorBanner message={error} />}

      <SubmitButton loading={loading} disabled={!email || !password}>Sign in</SubmitButton>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setAuthPage('forgot')} className="text-[12.5px] text-text-muted hover:text-text-secondary transition-colors">
          Forgot password?
        </button>
        <button type="button" onClick={() => setAuthPage('register')} className="text-[12.5px] text-accent hover:text-accent-hover font-semibold transition-colors">
          Create account →
        </button>
      </div>
    </form>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────

function RegisterForm() {
  const { register, loading, error, setAuthPage, clearError } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearError() }, [])

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    if (password.length < 8) errs.password = 'At least 8 characters'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await register(name.trim(), email.trim(), password)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="Full name" value={name} onChange={setName} placeholder="Jane Smith" autoComplete="name" error={fieldErrors.name} />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" error={fieldErrors.email} />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Min 8 characters" autoComplete="new-password" error={fieldErrors.password} />

      {error && <ErrorBanner message={error} />}

      <SubmitButton loading={loading}>Create account</SubmitButton>

      <p className="text-center text-[12.5px] text-text-muted">
        Already have an account?{' '}
        <button type="button" onClick={() => setAuthPage('login')} className="text-accent hover:text-accent-hover font-semibold transition-colors">
          Sign in
        </button>
      </p>
    </form>
  )
}

// ── Forgot password ───────────────────────────────────────────────────────────

function ForgotForm() {
  const { forgotPassword, loading, setAuthPage, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearError() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const message = await forgotPassword(email)
    setMsg(message)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="text-4xl">📬</span>
        <p className="text-sm text-text-secondary leading-relaxed">{msg}</p>
        <button type="button" onClick={() => setAuthPage('login')} className="text-[12.5px] text-accent hover:text-accent-hover font-semibold transition-colors">
          ← Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p className="text-[13px] text-text-muted leading-relaxed">
        Enter your email and we'll send you a password reset link.
      </p>
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <SubmitButton loading={loading} disabled={!email}>Send reset link</SubmitButton>
      <button type="button" onClick={() => setAuthPage('login')} className="flex items-center justify-center gap-1.5 text-[12.5px] text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </button>
    </form>
  )
}

// ── Reset password ────────────────────────────────────────────────────────────

function ResetForm({ resetToken }: { resetToken: string }) {
  const { resetPassword, loading, error, setAuthPage, clearError } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearError() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) return
    await resetPassword(resetToken, password)
    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <span className="text-4xl">✅</span>
        <p className="text-sm text-text-secondary">Password updated! You can now sign in.</p>
        <button type="button" onClick={() => setAuthPage('login')} className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors">
          Sign in with new password
        </button>
      </div>
    )
  }

  const mismatch = confirm.length > 0 && password !== confirm

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field label="New password" type="password" value={password} onChange={setPassword} placeholder="Min 8 characters" autoComplete="new-password" />
      <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" autoComplete="new-password"
        error={mismatch ? 'Passwords do not match' : undefined}
      />
      {error && <ErrorBanner message={error} />}
      <SubmitButton loading={loading} disabled={password.length < 8 || !!mismatch}>
        Set new password
      </SubmitButton>
    </form>
  )
}

// ── OTP 6-box input ───────────────────────────────────────────────────────────

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  function handleChange(i: number, raw: string) {
    const v = raw.replace(/\D/g, '')
    if (!v) {
      const next = [...digits]
      next[i] = ''
      onChange(next.join('').trimEnd())
      return
    }
    // Support pasting multiple digits into one cell
    if (v.length > 1) {
      const filled = (value + v).replace(/\D/g, '').slice(0, 6)
      onChange(filled)
      refs.current[Math.min(filled.length, 5)]?.focus()
      return
    }
    const next = [...digits]
    next[i] = v
    onChange(next.join('').trimEnd())
    if (i < 5) refs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''
        onChange(next.join('').trimEnd())
      } else if (i > 0) {
        refs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44, height: 52,
            textAlign: 'center',
            fontSize: 22, fontWeight: 700,
            background: d ? 'rgba(91,155,213,0.1)' : 'rgba(255,255,255,0.06)',
            border: `2px solid ${d ? 'rgba(91,155,213,0.6)' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 10,
            color: 'var(--color-text-primary)',
            outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
            fontFamily: 'ui-monospace, monospace',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
      ))}
    </div>
  )
}

// ── Verify pending ────────────────────────────────────────────────────────────

function VerifyPendingForm() {
  const { pendingEmail, verifyEmail, resendVerification, loading, error, setAuthPage, clearError } = useAuthStore()
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [resentMsg, setResentMsg] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearError() }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    await verifyEmail(pendingEmail, otp)
    // On success the store sets token+user → App re-renders to AppLayout automatically
  }

  async function handleResend() {
    if (cooldown > 0 || !pendingEmail) return
    setResentMsg('')
    await resendVerification(pendingEmail)
    setOtp('')
    setResentMsg('New code sent — check your spam folder too.')
    setCooldown(60)
  }

  const displayEmail = pendingEmail || 'your email'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Info */}
      <p className="text-[13px] text-text-muted leading-relaxed text-center">
        We sent a 6-digit code to{' '}
        <span className="text-text-primary font-semibold">{displayEmail}</span>.
        <br />Enter it below — it expires in 5 minutes.
      </p>

      {/* OTP boxes */}
      <OtpInput value={otp} onChange={setOtp} disabled={loading} />

      {/* Error */}
      {error && (
        <div
          className="text-[12.5px] text-priority-p1 text-center rounded-xl"
          style={{ padding: '10px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)' }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Resent feedback */}
      {resentMsg && !error && (
        <div
          className="text-[12.5px] text-accent text-center rounded-xl"
          style={{ padding: '10px 14px', background: 'rgba(91,155,213,0.08)', border: '1px solid rgba(91,155,213,0.18)' }}
        >
          ✓ {resentMsg}
        </div>
      )}

      {/* Verify button */}
      <SubmitButton loading={loading} disabled={otp.length !== 6}>
        Verify email
      </SubmitButton>

      {/* Resend */}
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p className="text-[12.5px] text-text-muted">
          Didn't receive it?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="font-semibold transition-colors disabled:opacity-40"
            style={{ color: cooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-accent)' }}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>
        <button
          type="button"
          onClick={() => setAuthPage('login')}
          className="text-[12px] text-text-muted hover:text-text-secondary transition-colors"
        >
          ← Back to sign in
        </button>
      </div>
    </form>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const { authPage, setAuthPage } = useAuthStore()
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [verifyBanner, setVerifyBanner] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const rToken = params.get('reset')

    if (rToken) {
      setResetToken(rToken)
      setAuthPage('reset')
      window.history.replaceState({}, '', '/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isVerifyPending = authPage === 'verify-pending'

  const titles: Record<typeof authPage, string> = {
    login:           'Welcome back',
    register:        'Create your account',
    forgot:          'Forgot password',
    reset:           'Set new password',
    'verify-pending': 'Verify your email',
  }

  const subtitles: Record<typeof authPage, string> = {
    login:           'Sign in to continue to Dodo',
    register:        'Start organising your work today',
    forgot:          'We\'ll send a reset link to your inbox',
    reset:           'Choose a new password for your account',
    'verify-pending': 'One last step before you get started',
  }

  return (
    <div
      className="min-h-screen w-full bg-bg-primary flex flex-col items-center justify-center"
      style={{ padding: '48px 20px' }}
    >

      {/* ── Logo ── */}
      <div className="mb-8 text-center select-none">
        <h1 className="text-[36px] font-black tracking-[-0.04em] text-text-primary leading-none">
          Do<span className="text-accent">do</span>
        </h1>
        <p className="mt-2 text-[13px] text-text-muted">Your focused task manager</p>
      </div>

      {/* ── Card ── */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 420,
          background: '#1e1e21',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        {/* Card header */}
        <div style={{ padding: '28px 32px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">{titles[authPage]}</h2>
          <p className="mt-1.5 text-[13px] text-text-muted leading-snug">{subtitles[authPage]}</p>
        </div>

        {/* Card body */}
        <div style={{ padding: isVerifyPending ? '24px 32px 32px' : '26px 32px 28px' }}>
          {verifyBanner && (
            <div
              className="flex items-center gap-2 text-[13px] text-accent rounded-xl"
              style={{
                marginBottom: 20,
                padding: '10px 14px',
                background: 'rgba(91,155,213,0.1)',
                border: '1px solid rgba(91,155,213,0.2)',
              }}
            >
              ✓ {verifyBanner}
            </div>
          )}

          {authPage === 'login'          && <LoginForm />}
          {authPage === 'register'       && <RegisterForm />}
          {authPage === 'forgot'         && <ForgotForm />}
          {authPage === 'reset'          && <ResetForm resetToken={resetToken ?? ''} />}
          {authPage === 'verify-pending' && <VerifyPendingForm />}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-7 text-[12px] text-text-muted/50">
        © {new Date().getFullYear()} Dodo · Focused work starts here
      </p>
    </div>
  )
}
