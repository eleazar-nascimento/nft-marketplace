import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const parsed = registerRequestSchema.safeParse({
      name,
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
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-accent-bright">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Criar Conta de Colecionador</h1>
            <p className="text-xs text-text-secondary">
              Cadastre seus dados fictícios para colecionar NFTs e gerenciar suas carteiras.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="mt-6 space-y-4">
          <div>
            <Label htmlFor="register-name">Nome de exibição</Label>
            <Input
              id="register-name"
              data-testid="register-name"
              placeholder="Ex: Clara Mendes"
              value={name}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 bg-bg-primary"
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
            <Label htmlFor="register-username">Nome de usuário</Label>
            <Input
              id="register-username"
              data-testid="register-username"
              placeholder="Ex: clara_mendes"
              value={username}
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'register-username-error' : undefined}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1.5 bg-bg-primary font-mono"
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
            <Label htmlFor="register-email">E-mail</Label>
            <Input
              id="register-email"
              data-testid="register-email"
              type="email"
              autoComplete="email"
              placeholder="clara@nft.dev"
              value={email}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 bg-bg-primary"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="register-password">Senha</Label>
              <Input
                id="register-password"
                data-testid="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mín. 8 caracteres"
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 bg-bg-primary"
              />
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
              <Label htmlFor="register-confirmPassword">Confirmar senha</Label>
              <Input
                id="register-confirmPassword"
                data-testid="register-confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a senha"
                value={confirmPassword}
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'register-confirmPassword-error' : undefined}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 bg-bg-primary"
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
          </div>

          {formError ? (
            <div
              role="alert"
              data-testid="register-form-error"
              className="rounded-2xl border border-red-500/80 bg-red-950/70 p-3 text-xs text-red-100"
            >
              {formError}
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            data-testid="register-submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Já possui uma conta?{' '}
          <Link to="/login" className="font-semibold text-accent-bright underline underline-offset-4">
            Fazer login
          </Link>
        </p>
      </Card>
    </div>
  )
}
