import { Link, useNavigate } from '@tanstack/react-router'
import { KeyRound, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginRequestSchema } from '@/contracts'
import { consumeReturnTo } from '@/lib/storage'
import { useSession } from '@/state/session'

export function LoginPage({ redirectTo }: { redirectTo?: string }) {
  const { login } = useSession()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-bright">
            <LogIn className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Entrar na Conta</h1>
            <p className="text-xs text-text-secondary">
              Acesse favoritos, perfil, carteiras e finalize suas compras.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="mt-6 space-y-4">
          <div>
            <Label htmlFor="login-email">E-mail</Label>
            <Input
              id="login-email"
              data-testid="login-email"
              type="email"
              autoComplete="email"
              placeholder="voce@nft.dev"
              value={email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 bg-bg-primary"
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
            <Label htmlFor="login-password">Senha</Label>
            <Input
              id="login-password"
              data-testid="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 bg-bg-primary"
            />
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

          {formError ? (
            <div
              role="alert"
              data-testid="login-form-error"
              className="rounded-2xl border border-red-500/80 bg-red-950/70 p-3 text-xs text-red-100"
            >
              {formError}
            </div>
          ) : null}

          <Button type="submit" size="lg" data-testid="login-submit" disabled={submitting} className="w-full">
            {submitting ? 'Autenticando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-primary p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <KeyRound className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
            Contas fictícias para avaliação:
          </p>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
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

        <p className="mt-6 text-center text-sm text-text-secondary">
          Ainda não tem uma conta?{' '}
          <Link to="/register" className="font-semibold text-accent-bright underline underline-offset-4">
            Criar conta de colecionador
          </Link>
        </p>
      </Card>
    </div>
  )
}
