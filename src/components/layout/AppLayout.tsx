import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  AlertTriangle,
  LogOut,
  Menu,
  ShoppingBag,
  Store,
  User as UserIcon,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, DrawerContent } from '@/components/ui/dialog'
import { saveReturnTo } from '@/lib/storage'
import { useCart } from '@/state/queries'
import { useRealtime } from '@/state/realtime'
import { useSession } from '@/state/session'
import { NotificationsViewport } from './NotificationsViewport'
import { OutOfScopeDialog } from './OutOfScopeDialog'
import { ScenarioToolbar } from './ScenarioToolbar'

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, status, logout, expiredNotice, clearExpiredNotice } = useSession()
  const { data: cart } = useCart()
  const { cartAlerts, dismissCartAlert } = useRealtime()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [outOfScopeFeature, setOutOfScopeFeature] = useState<string | null>(null)

  const itemCount = cart?.itemCount ?? 0
  const currentFullPath = `${routerState.location.pathname}${routerState.location.searchStr}`

  const handleGoToLogin = () => {
    saveReturnTo(currentFullPath)
    clearExpiredNotice()
    void navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo principal
      </a>

      <header className="sticky top-0 z-40 border-b border-border-subtle/70 bg-bg-primary/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-white sm:text-xl"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono">NFT Marketplace</span>
            </Link>
            <ScenarioToolbar />
          </div>

          <nav aria-label="Navegação principal" className="hidden items-center gap-2 lg:flex">
            <Link
              to="/"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-bg-secondary hover:text-white [&.active]:text-white"
            >
              Marketplace
            </Link>
            <button
              type="button"
              onClick={() => setOutOfScopeFeature('Rankings de Criadores')}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-bg-secondary hover:text-white cursor-pointer"
            >
              Rankings
            </button>

            <Link
              to="/cart"
              data-testid="nav-cart-link"
              aria-label={`Carrinho de NFTs (${itemCount} ${itemCount === 1 ? 'item' : 'itens'})`}
              className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-bg-secondary hover:text-white [&.active]:text-white"
            >
              <ShoppingBag className="h-4 w-4 text-accent-bright" aria-hidden="true" />
              <span>Carrinho</span>
              <span
                data-testid="nav-cart-count"
                className="inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-2 py-0.5 text-xs font-mono font-bold text-white"
              >
                {itemCount}
              </span>
            </Link>

            {status === 'authenticated' && user ? (
              <div className="ml-2 flex items-center gap-2 border-l border-border-subtle pl-4">
                <Link
                  to="/wallets"
                  data-testid="nav-wallets-link"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-bg-secondary hover:text-white [&.active]:text-white"
                >
                  <WalletIcon className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                  <span>Carteiras</span>
                </Link>
                <Link
                  to="/profile"
                  data-testid="nav-profile-link"
                  className="inline-flex items-center gap-2 rounded-xl bg-bg-secondary px-3.5 py-2 text-sm font-semibold text-white hover:bg-bg-elevated"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                  )}
                  <span data-testid="nav-user-name">{user.name}</span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="nav-logout-button"
                  aria-label="Sair da conta"
                  onClick={() => void logout()}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sair</span>
                </Button>
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" data-testid="nav-login-link" onClick={() => saveReturnTo(currentFullPath)}>
                    Entrar
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register" data-testid="nav-register-link" onClick={() => saveReturnTo(currentFullPath)}>
                    <UserIcon className="h-4 w-4" aria-hidden="true" />
                    Criar conta
                  </Link>
                </Button>
              </div>
            )}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/cart"
              data-testid="mobile-cart-link"
              aria-label={`Carrinho (${itemCount} ${itemCount === 1 ? 'item' : 'itens'})`}
              className="relative inline-flex h-11 items-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-secondary px-3 text-sm font-semibold text-white"
            >
              <ShoppingBag className="h-4 w-4 text-accent-bright" aria-hidden="true" />
              <span data-testid="mobile-cart-count" className="font-mono text-xs">
                {itemCount}
              </span>
            </Link>

            <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Button
                variant="secondary"
                size="icon"
                data-testid="mobile-menu-trigger"
                aria-label="Abrir menu de navegação"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
              <DrawerContent closeLabel="Fechar menu de navegação">
                <DialogTitle className="font-mono">Menu</DialogTitle>
                <nav aria-label="Menu móvel" className="mt-6 flex flex-col gap-2">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-semibold hover:bg-bg-secondary"
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold hover:bg-bg-secondary"
                  >
                    <span>Carrinho de NFTs</span>
                    <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-mono">{itemCount}</span>
                  </Link>
                  {status === 'authenticated' && user ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl px-4 py-3 text-base font-semibold hover:bg-bg-secondary"
                      >
                        Perfil ({user.name})
                      </Link>
                      <Link
                        to="/wallets"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-xl px-4 py-3 text-base font-semibold hover:bg-bg-secondary"
                      >
                        Carteiras
                      </Link>
                      <Button
                        variant="secondary"
                        className="mt-4 justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          void logout()
                        }}
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sair da conta
                      </Button>
                    </>
                  ) : (
                    <div className="mt-4 flex flex-col gap-2">
                      <Button asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/login" onClick={() => saveReturnTo(currentFullPath)}>
                          Entrar
                        </Link>
                      </Button>
                      <Button variant="secondary" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/register" onClick={() => saveReturnTo(currentFullPath)}>
                          Criar conta
                        </Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </DrawerContent>
            </Dialog>
          </div>
        </div>
      </header>

      {expiredNotice ? (
        <div
          role="alert"
          data-testid="session-expired-banner"
          className="border-b border-amber-500/60 bg-amber-950/90 px-4 py-3 text-amber-100"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
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
          className="border-b border-accent-bright/60 bg-bg-secondary px-4 py-3 text-white"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {cartAlerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                  <span>{alert.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/cart"
                    className="text-xs font-semibold text-accent-bright underline underline-offset-4 hover:text-white"
                  >
                    Ver no carrinho
                  </Link>
                  <button
                    type="button"
                    onClick={() => dismissCartAlert(alert.id)}
                    className="text-xs text-text-secondary hover:text-white cursor-pointer"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="mt-16 border-t border-border-subtle bg-bg-secondary text-text-secondary">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <div className="flex items-center gap-2.5 text-lg font-bold text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-mono">NFT Marketplace</span>
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Interface de colecionáveis digitais construída com React, TanStack Router, TanStack Query, MSW e
              Socket.IO.
            </p>
          </div>

          <div>
            <h2 className="font-mono text-base font-bold text-white">Explorar</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white">
                  Catálogo de NFTs
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white">
                  Carrinho de compras
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setOutOfScopeFeature('Atividade da Rede')}
                  className="hover:text-white cursor-pointer"
                >
                  Atividade e Ofertas
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-mono text-base font-bold text-white">Comunidade e Suporte</h2>
            <p className="mt-3 text-sm text-text-secondary">
              Precisa de suporte ou quer acessar a documentação editorial?
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                data-testid="footer-support-btn"
                onClick={() => setOutOfScopeFeature('Central de Suporte')}
              >
                Central de Suporte
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOutOfScopeFeature('Aplicativo e Downloads')}
              >
                Downloads
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-border-subtle/70 py-4 text-center text-xs text-text-muted">
          © 2026 NFT Marketplace — Dados, carteiras e transações simulados localmente.
        </div>
      </footer>

      <OutOfScopeDialog featureName={outOfScopeFeature} onClose={() => setOutOfScopeFeature(null)} />
      <NotificationsViewport />
    </div>
  )
}
