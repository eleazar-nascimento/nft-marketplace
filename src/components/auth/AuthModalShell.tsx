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
      <div aria-hidden="true" inert className="pointer-events-none select-none">
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
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-xs"
      >
        <div className="relative my-auto w-full max-w-125 overflow-hidden rounded-lg border border-border-subtle bg-bg-secondary pt-10 shadow-2xl sm:pt-12">
          <button
            type="button"
            onClick={handleClose}
            aria-label={closeLabel}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex flex-col items-center gap-6 px-6 sm:gap-8 sm:px-12">
            <div className="flex items-center justify-center gap-2">
              {isLogin ? (
                <>
                  <h1 id="auth-modal-title" className="text-[20px] font-medium leading-4 text-accent-bright">
                    Entrar
                  </h1>
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
                  <h1 id="auth-modal-title" className="text-[20px] font-medium leading-4 text-accent-bright">
                    Criar conta
                  </h1>
                </>
              )}
            </div>

            <p className="text-center text-[13px] leading-4 text-text-primary">{subtitle}</p>
          </div>

          {children}

          <div className={`mt-6 flex flex-col gap-3 ${footerSlot ? '' : 'pb-8'}`}>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-[13px] leading-4 text-text-primary">Ou continue com</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <div className="flex flex-col gap-3 px-6 sm:px-20">
              <button
                type="button"
                onClick={onGoogleClick}
                className="flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
              >
                <span className="font-bold text-text-primary">G</span>
                <span>Continuar com Google</span>
              </button>
              <button
                type="button"
                onClick={onFacebookClick}
                className="flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
              >
                <span className="font-bold text-[#3b5999]">f</span>
                <span>Continuar com Facebook</span>
              </button>
            </div>
          </div>

          {footerSlot ? <div className="mt-5 px-6 pb-6 sm:px-20">{footerSlot}</div> : null}

          <div className="h-2.5 w-full bg-accent" />
        </div>
      </div>
    </div>
  )
}
