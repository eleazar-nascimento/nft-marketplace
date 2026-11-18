import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { AlertTriangle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { saveReturnTo } from '@/lib/storage'
import { useCart } from '@/state/queries'
import { useRealtime } from '@/state/realtime'
import { useSession } from '@/state/session'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { MobileTabBar } from './MobileTabBar'
import { NotificationsViewport } from './NotificationsViewport'
import { OutOfScopeDialog } from './OutOfScopeDialog'

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, status, logout, expiredNotice, clearExpiredNotice } = useSession()
  const { data: cart } = useCart()
  const { cartAlerts, dismissCartAlert } = useRealtime()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [outOfScopeFeature, setOutOfScopeFeature] = useState<string | null>(null)

  const itemCount = cart?.itemCount ?? 0
  const pathname = routerState.location.pathname
  const currentFullPath = `${pathname}${routerState.location.searchStr}`

  const handleGoToLogin = () => {
    saveReturnTo(currentFullPath)
    clearExpiredNotice()
    void navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary font-mono text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-bg-primary"
      >
        Pular para o conteúdo principal
      </a>

      <AppHeader
        user={user}
        status={status}
        itemCount={itemCount}
        pathname={pathname}
        currentFullPath={currentFullPath}
        onLogout={() => void logout()}
        onOpenOutOfScope={setOutOfScopeFeature}
      />

      {expiredNotice ? (
        <div
          role="alert"
          data-testid="session-expired-banner"
          className="relative z-60 border-b border-amber-500/60 bg-amber-950/90 px-4 py-3 text-amber-100"
        >
          <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <span>{expiredNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleGoToLogin} data-testid="session-expired-login-btn">
                Entrar novamente
              </Button>
              <Button variant="ghost" size="sm" onClick={clearExpiredNotice}>
                Dispensar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {cartAlerts.length > 0 ? (
        <div
          role="status"
          aria-live="polite"
          data-testid="realtime-cart-banner"
          className="border-b border-accent/60 bg-bg-secondary px-4 py-3 text-text-primary"
        >
          <div className="mx-auto flex max-w-300 flex-col gap-2">
            {cartAlerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <span>{alert.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/cart"
                    className="text-xs font-bold text-accent-bright underline underline-offset-4 hover:text-text-primary"
                  >
                    Ver no carrinho
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismissCartAlert(alert.id)}
                    className="text-xs text-text-secondary hover:text-text-primary cursor-pointer"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <main id="main-content" className="flex-1 pb-24 lg:pb-0">
        {children}
      </main>

      <AppFooter onOpenOutOfScope={setOutOfScopeFeature} />
      <MobileTabBar pathname={pathname} status={status} />

      <OutOfScopeDialog featureName={outOfScopeFeature} onClose={() => setOutOfScopeFeature(null)} />
      <NotificationsViewport />
    </div>
  )
}
