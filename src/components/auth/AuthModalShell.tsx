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
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
      <div className="relative mx-auto w-full max-w-[500px] overflow-hidden rounded-[8px] bg-bg-secondary pt-[48px] shadow-2xl">
        <Link
          to="/"
          aria-label={closeLabel}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="flex flex-col items-center gap-[32px] px-6 sm:px-[48px]">
          <div className="flex items-center justify-center gap-[8px]">
            {isLogin ? (
              <>
                <h1 className="text-[20px] font-medium leading-[16px] text-accent-bright">Entrar</h1>
                <span className="h-[18px] w-px bg-coral" aria-hidden="true" />
                <Link
                  to="/register"
                  className="text-[20px] font-medium leading-[16px] text-text-primary hover:text-accent-bright"
                >
                  Criar conta
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[20px] font-medium leading-[16px] text-text-primary hover:text-accent-bright"
                >
                  Entrar
                </Link>
                <span className="h-[18px] w-px bg-coral" aria-hidden="true" />
                <h1 className="text-[20px] font-medium leading-[16px] text-accent-bright">
                  Criar conta
                </h1>
              </>
            )}
          </div>

          <p className="text-center text-[13px] leading-[16px] text-text-primary">{subtitle}</p>
        </div>

        {children}

        <div className={`mt-[24px] flex flex-col gap-[12px] ${footerSlot ? '' : 'pb-8'}`}>
          <div className="flex items-center gap-[12px]">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-[13px] leading-[16px] text-text-primary">Ou continue com</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="flex flex-col gap-[12px] px-6 sm:px-[80px]">
            <button
              type="button"
              onClick={onGoogleClick}
              className="flex h-[40px] w-full items-center justify-center gap-[12px] rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
            >
              <span className="font-bold text-text-primary">G</span>
              <span>Continuar com Google</span>
            </button>
            <button
              type="button"
              onClick={onFacebookClick}
              className="flex h-[40px] w-full items-center justify-center gap-[12px] rounded-[5px] border border-border-subtle text-[13px] font-medium text-text-secondary hover:border-accent cursor-pointer"
            >
              <span className="font-bold text-[#3b5999]">f</span>
              <span>Continuar com Facebook</span>
            </button>
          </div>
        </div>

        {footerSlot ? <div className="mt-5 px-6 pb-6 sm:px-[80px]">{footerSlot}</div> : null}

        <div className="h-[10px] w-full bg-accent" />
      </div>
    </div>
  )
}
