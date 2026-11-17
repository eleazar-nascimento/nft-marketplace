import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { registerRequestSchema } from '@/contracts'
import { consumeReturnTo } from '@/lib/storage'
import { useSession } from '@/state/session'

export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const parsed = registerRequestSchema.safeParse({
      name: name || username,
      username,
      email,
      password,
      confirmPassword,
    })

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
      await register(parsed.data)
      const target = consumeReturnTo() || '/'
      await navigate({ to: target })
    } catch (error) {
      if (error instanceof AppApiError && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
      }
      setFormError(error instanceof Error ? error.message : 'Não foi possível criar a conta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="relative mx-auto w-full max-w-[500px] overflow-hidden rounded-[8px] bg-bg-secondary pt-[48px] shadow-2xl">
        <Link
          to="/"
          aria-label="Fechar janela de cadastro"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="flex flex-col items-center gap-[32px] px-6 sm:px-[48px]">
          <div className="flex items-center justify-center gap-[8px]">
            <Link
              to="/login"
              className="text-[20px] font-medium leading-[16px] text-text-primary hover:text-accent-bright"
            >
              Entrar
            </Link>
            <span className="h-[18px] w-px bg-coral" aria-hidden="true" />
            <h1 className="text-[20px] font-medium leading-[16px] text-accent-bright">Criar conta</h1>
          </div>

          <p className="text-center text-[13px] leading-[16px] text-text-primary">
            Crie seu perfil de colecionador e conecte uma carteira quando quiser.
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="mt-[24px] flex flex-col gap-[12px] px-6 sm:px-[80px]"
        >
          <div>
            <label htmlFor="register-name" className="sr-only">
              Nome de exibição
            </label>
            <input
              id="register-name"
              data-testid="register-name"
              placeholder="Nome de exibição"
              value={name}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
              onChange={(event) => setName(event.target.value)}
              className="h-[40px] w-full rounded-[5px] border border-border-subtle bg-transparent px-[16px] text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
            />
            {fieldErrors.name ? (
              <p
                id="register-name-error"
                role="alert"
                data-testid="register-name-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-username" className="sr-only">
              Nome de usuário
            </label>
            <input
              id="register-username"
              data-testid="register-username"
              placeholder="Nome de usuário"
              value={username}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
              onChange={(event) => setUsername(event.target.value)}
              className="h-[40px] w-full rounded-[5px] border border-border-subtle bg-transparent px-[16px] text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
            />
            {fieldErrors.username ? (
              <p
                id="register-username-error"
                role="alert"
                data-testid="register-username-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-email" className="sr-only">
              E-mail
            </label>
            <input
              id="register-email"
              data-testid="register-email"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              value={email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
              className="h-[40px] w-full rounded-[5px] border border-border-subtle bg-transparent px-[16px] text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
            />
            {fieldErrors.email ? (
              <p
                id="register-email-error"
                role="alert"
                data-testid="register-email-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-password" className="sr-only">
              Senha
            </label>
            <div className="relative">
              <input
                id="register-password"
                data-testid="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Senha"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
                className="h-[40px] w-full rounded-[5px] border border-border-subtle bg-transparent pl-[16px] pr-10 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
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
                id="register-password-error"
                role="alert"
                data-testid="register-password-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="register-confirmPassword" className="sr-only">
              Confirmar senha
            </label>
            <input
              id="register-confirmPassword"
              data-testid="register-confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? 'register-confirmPassword-error' : undefined}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-[40px] w-full rounded-[5px] border border-border-subtle bg-transparent px-[16px] text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
            />
            {fieldErrors.confirmPassword ? (
              <p
                id="register-confirmPassword-error"
                role="alert"
                data-testid="register-confirmPassword-error"
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div
              role="alert"
              data-testid="register-form-error"
              className="rounded-[5px] border border-red-500/80 bg-red-950/70 p-2.5 text-xs text-red-100"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            data-testid="register-submit"
            disabled={submitting}
            className="mt-[12px] flex h-[45px] w-full items-center justify-center rounded-[5px] bg-accent text-[16px] font-bold leading-[16px] text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-[24px] flex flex-col gap-[16px] pb-8">
          <div className="flex items-center gap-[12px]">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-[13px] leading-[16px] text-text-primary">Ou continue com</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="flex flex-col gap-[12px] px-6 sm:px-[80px]">
            <button
              type="button"
              className="flex h-[40px] w-full items-center justify-center gap-[12px] rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
            >
              <span className="font-bold text-text-primary">G</span>
              <span>Continuar com Google</span>
            </button>
            <button
              type="button"
              className="flex h-[40px] w-full items-center justify-center gap-[12px] rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
            >
              <span className="font-bold text-[#3b5999]">f</span>
              <span>Continuar com Facebook</span>
            </button>
          </div>
        </div>

        <div className="h-[10px] w-full bg-accent" />
      </div>
    </div>
  )
}
