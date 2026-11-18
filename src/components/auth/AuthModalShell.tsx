import { Link, useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useCallback, useEffect, type ReactNode } from 'react'
import { consumeReturnTo, peekReturnTo } from '@/lib/storage'
import { HomePage } from '@/pages/HomePage'

interface AuthModalShellProps {
  mode: 'login' | 'register'
  subtitle: string
  closeLabel: string
  onGoogleClick?: () => void
  onFacebookClick?: () => void
  footerSlot?: ReactNode
  children: ReactNode
}

function getSafeCloseDestination(): string {
  const candidate = peekReturnTo()
  if (
    candidate &&
    !candidate.startsWith('/checkout') &&
    !candidate.startsWith('/profile') &&
    !candidate.startsWith('/wallets') &&
    !candidate.startsWith('/orders')
  ) {
    consumeReturnTo()
    return candidate
  }
  return '/'
}

export function AuthModalShell({
  mode,
  subtitle,
  closeLabel,
  onGoogleClick,
  onFacebookClick,
  footerSlot,
  children,
}: AuthModalShellProps) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    const destination = getSafeCloseDestination()
    void navigate({ to: destination })
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  return (
    <div className="relative">
      <div aria-hidden="true" inert className="pointer-events-none hidden select-none sm:block">
        <HomePage search={{}} onUpdateSearch={() => {}} onResetFilters={() => {}} />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        data-testid="auth-modal-overlay"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleClose()
          }
        }}
        className="flex min-h-[calc(100dvh-160px)] flex-col items-center justify-center bg-bg-primary px-5 py-8 sm:fixed sm:inset-0 sm:z-50 sm:min-h-0 sm:overflow-y-auto sm:bg-black/75 sm:p-4 sm:backdrop-blur-xs"
      >
        <div className="relative w-full max-w-125 overflow-hidden bg-bg-primary sm:my-auto sm:rounded-lg sm:border sm:border-border-subtle sm:bg-bg-secondary sm:pt-12 sm:shadow-2xl">
          <button
            type="button"
            onClick={handleClose}
            aria-label={closeLabel}
            className="absolute right-4 top-4 hidden h-8 w-8 items-center justify-center text-accent hover:text-text-primary sm:inline-flex cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="mb-8 flex justify-center sm:hidden">
            <Link to="/" className="text-[24px] font-bold tracking-[3px] text-text-primary">
              KURIO
            </Link>
          </div>

          <div className="flex flex-col items-center gap-6 px-1 sm:gap-8 sm:px-12">
            <h1
              id="auth-modal-title"
              className="text-center text-[18px] font-bold leading-5 text-text-primary sm:hidden"
            >
              {isLogin ? 'Entrar' : 'Criar perfil de colecionador'}
            </h1>

            <div className="hidden items-center justify-center gap-2 sm:flex">
              {isLogin ? (
                <>
                  <h2 className="text-[20px] font-medium leading-4 text-accent-bright">
                    Entrar
                  </h2>
                  <span className="h-4.5 w-px bg-coral" aria-hidden="true" />
                  <Link
                    to="/register"
                    className="text-[20px] font-medium leading-4 text-text-primary hover:text-accent-bright"
                  >
                    Criar conta
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[20px] font-medium leading-4 text-text-primary hover:text-accent-bright"
                  >
                    Entrar
                  </Link>
                  <span className="h-4.5 w-px bg-coral" aria-hidden="true" />
                  <h2 className="text-[20px] font-medium leading-4 text-accent-bright">
                    Criar conta
                  </h2>
                </>
              )}
            </div>

            <p className="hidden text-center text-[13px] leading-4 text-text-primary sm:block">
              {subtitle}
            </p>
          </div>

          {children}

          <div className={`mt-6 flex flex-col gap-3 ${footerSlot ? '' : 'sm:pb-8'}`}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-[13px] leading-4 text-text-primary">Ou continue com</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <div className="flex flex-col gap-3 sm:px-20">
              <button
                type="button"
                onClick={onGoogleClick}
                className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent sm:rounded-[5px] cursor-pointer"
              >
                <span className="font-bold text-text-primary">G</span>
                <span>Continuar com Google</span>
              </button>
              <button
                type="button"
                onClick={onFacebookClick}
                className="flex h-10 w-full items-center justify-center gap-3 rounded-lg border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent sm:rounded-[5px] cursor-pointer"
              >
                <span className="font-bold text-[#3b5999]">f</span>
                <span>Continuar com Facebook</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-[13px] text-text-secondary sm:hidden">
            {isLogin ? (
              <p>
                Novo na Kurio?{' '}
                <Link to="/register" className="font-medium text-text-primary underline underline-offset-4">
                  Crie uma conta
                </Link>
              </p>
            ) : (
              <p>
                Já tem uma conta?{' '}
                <Link to="/login" className="font-medium text-text-primary underline underline-offset-4">
                  Entre
                </Link>
              </p>
            )}
          </div>

          {footerSlot ? <div className="mt-5 pb-4 sm:px-20 sm:pb-6">{footerSlot}</div> : null}

          <div className="hidden h-2.5 w-full bg-accent sm:block" />
        </div>
      </div>
    </div>
  )
}
