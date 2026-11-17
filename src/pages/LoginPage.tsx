import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, KeyRound, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { loginRequestSchema } from '@/contracts'
import { consumeReturnTo } from '@/lib/storage'
import { useSession } from '@/state/session'

export function LoginPage({ redirectTo }: { redirectTo?: string }) {
  const { login } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const parsed = loginRequestSchema.safeParse({ email, password })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!next[key]) next[key] = issue.message
      }
      setFieldErrors(next)
      return
    }
    setFieldErrors({})
    setSubmitting(true)

    try {
      await login(parsed.data)
      const target = redirectTo || consumeReturnTo() || '/'
      await navigate({ to: target })
    } catch (error) {
      if (error instanceof AppApiError && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
      }
      setFormError(error instanceof Error ? error.message : 'Não foi possível autenticar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="relative mx-auto w-full max-w-[500px] overflow-hidden bg-bg-secondary pt-[48px] shadow-2xl">
        <Link
          to="/"
          aria-label="Fechar janela de login"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="flex flex-col items-center gap-[32px] px-6 sm:px-[48px]">
          <div className="flex items-center justify-center gap-[8px]">
            <h1 className="text-[20px] font-medium leading-[16px] text-accent-bright">Entrar</h1>
            <span className="h-[18px] w-px bg-coral" aria-hidden="true" />
            <Link
              to="/register"
              className="text-[20px] font-medium leading-[16px] text-text-primary hover:text-accent-bright"
            >
              Criar conta
            </Link>
          </div>

          <p className="text-center text-[13px] leading-[16px] text-text-primary">
            Entre para gerenciar sua carteira, coleção e perfil de criador.
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="mt-[24px] flex flex-col gap-[12px] px-6 sm:px-[80px]"
        >
          <div>
            <label htmlFor="login-email" className="sr-only">
              E-mail
            </label>
            <input
              id="login-email"
              data-testid="login-email"
              type="email"
              autoComplete="email"
              placeholder="contato@email.com"
              value={email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[40px] w-full rounded-[5px] border border-border-subtle bg-transparent px-[16px] text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
            />
            {fieldErrors.email ? (
              <p
                id="login-email-error"
                role="alert"
                data-testid="login-email-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="login-password" className="sr-only">
              Senha
            </label>
            <div className="relative">
              <input
                id="login-password"
                data-testid="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="***********"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[40px] w-full rounded-[5px] border border-accent bg-transparent pl-[16px] pr-10 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none aria-[invalid=true]:border-red-500"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p
                id="login-password-error"
                role="alert"
                data-testid="login-password-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <span className="text-[14px] leading-[16px] text-accent-bright">Esqueceu a senha?</span>
          </div>

          {formError ? (
            <div
              role="alert"
              data-testid="login-form-error"
              className="rounded-[5px] border border-red-500/80 bg-red-950/70 p-2.5 text-xs text-red-100"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            data-testid="login-submit"
            disabled={submitting}
            className="mt-[12px] flex h-[45px] w-full items-center justify-center rounded-[5px] bg-accent text-[16px] font-bold leading-[16px] text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-[24px] flex flex-col gap-[12px]">
          <div className="flex items-center gap-[12px]">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-[13px] leading-[16px] text-text-primary">Ou continue com</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="flex flex-col gap-[12px] px-6 sm:px-[80px]">
            <button
              type="button"
              onClick={() => {
                setEmail('ana@nft.dev')
                setPassword('Senha@123')
              }}
              className="flex h-[40px] w-full items-center justify-center gap-[12px] rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
            >
              <span className="font-bold text-text-primary">G</span>
              <span>Continuar com Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('bruno@nft.dev')
                setPassword('Senha@123')
              }}
              className="flex h-[40px] w-full items-center justify-center gap-[12px] rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
            >
              <span className="font-bold text-[#3b5999]">f</span>
              <span>Continuar com Facebook</span>
            </button>
          </div>
        </div>

        <div className="mt-5 px-6 pb-6 sm:px-[80px]">
          <div className="rounded-[5px] border border-border-subtle bg-bg-primary p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-text-primary">
              <KeyRound className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
              Contas fictícias para avaliação:
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                data-testid="fill-ana-btn"
                onClick={() => {
                  setEmail('ana@nft.dev')
                  setPassword('Senha@123')
                  setFieldErrors({})
                  setFormError(null)
                }}
              >
                Usar Ana Souza
              </Button>
              <Button
                variant="secondary"
                size="sm"
                data-testid="fill-bruno-btn"
                onClick={() => {
                  setEmail('bruno@nft.dev')
                  setPassword('Senha@123')
                  setFieldErrors({})
                  setFormError(null)
                }}
              >
                Usar Bruno Lima
              </Button>
            </div>
          </div>
        </div>

        <div className="h-[10px] w-full bg-accent" />
      </div>
    </div>
  )
}
