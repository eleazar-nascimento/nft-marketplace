import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface AuthModalShellProps {
  mode: 'login' | 'register'
  subtitle: string
  closeLabel: string
  onGoogleClick?: () => void
  onFacebookClick?: () => void
  footerSlot?: ReactNode
  children: ReactNode
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

  return (
    <div className="mx-auto max-w-300 px-4 py-10 sm:px-6">
      <div className="relative mx-auto w-full max-w-125 overflow-hidden rounded-lg bg-bg-secondary pt-12 shadow-2xl">
        <Link
          to="/"
          aria-label={closeLabel}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="flex flex-col items-center gap-8 px-6 sm:px-12">
          <div className="flex items-center justify-center gap-2">
            {isLogin ? (
              <>
                <h1 className="text-[20px] font-medium leading-4 text-accent-bright">Entrar</h1>
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
                <h1 className="text-[20px] font-medium leading-4 text-accent-bright">
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
  )
}
