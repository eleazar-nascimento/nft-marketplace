import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { AuthModalShell } from '@/components/auth/AuthModalShell'
import { registerRequestSchema } from '@/contracts'
import { consumeReturnTo } from '@/lib/storage'
import { zodIssuesToFieldErrors } from '@/lib/validation'
import { useSession } from '@/state/session'

export function RegisterPage() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const parsed = registerRequestSchema.safeParse({
      username,
      email,
      password,
      confirmPassword,
    })

    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error))
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
    <AuthModalShell
      mode="register"
      subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      closeLabel="Fechar janela de cadastro"
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="mt-6 flex flex-col gap-3 sm:px-20"
      >
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
            className="h-10 w-full rounded-[5px] border border-border-subtle bg-transparent px-4 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
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
            className="h-10 w-full rounded-[5px] border border-border-subtle bg-transparent px-4 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
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
              className="h-10 w-full rounded-[5px] border border-border-subtle bg-transparent pl-4 pr-10 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
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
          <div className="relative">
            <input
              id="register-confirmPassword"
              data-testid="register-confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? 'register-confirmPassword-error' : undefined}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-10 w-full rounded-[5px] border border-border-subtle bg-transparent pl-4 pr-10 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none aria-[invalid=true]:border-red-500"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
          className="mt-3 flex h-11.25 w-full items-center justify-center rounded-[5px] bg-accent text-[16px] font-bold leading-4 text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </AuthModalShell>
  )
}
