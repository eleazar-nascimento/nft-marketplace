import { Link } from '@tanstack/react-router'
import {
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User as UserIcon,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTitle, DrawerContent } from '@/components/ui/dialog'
import type { SessionUser } from '@/contracts'
import { saveReturnTo } from '@/lib/storage'
import { ScenarioToolbar } from './ScenarioToolbar'

interface AppHeaderProps {
  user: SessionUser | null
  status: 'checking' | 'authenticated' | 'anonymous'
  itemCount: number
  pathname: string
  currentFullPath: string
  onLogout: () => void
  onOpenOutOfScope: (feature: string) => void
}

export function AppHeader({
  user,
  status,
  itemCount,
  pathname,
  currentFullPath,
  onLogout,
  onOpenOutOfScope,
}: AppHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isMarketActive =
    pathname.startsWith('/nft/') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders/')
  const isHomeActive = !isMarketActive
  const showHeaderDivider =
    pathname === '/' ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/wallets') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur-md">
      <div className="mx-auto w-full max-w-300 px-4 pt-5 sm:px-6 lg:px-0">
        <div className="flex items-start justify-between gap-4 pb-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex h-8.5 items-center text-[14px] font-bold tracking-[1.4px] text-text-primary"
            >
              KURIO
            </Link>
            <ScenarioToolbar />
          </div>

          <nav aria-label="Navegação principal" className="hidden items-start gap-10 lg:flex">
            <Link
              to="/"
              className={`relative pb-5 text-[16px] leading-normal transition-colors ${
                isHomeActive
                  ? 'font-bold text-accent-bright'
                  : 'font-normal text-text-primary hover:text-accent-bright'
              }`}
            >
              Início
              {isHomeActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-accent" aria-hidden="true" />
              ) : null}
            </Link>

            <Link
              to="/"
              hash="catalogo-section"
              className={`relative pb-5 text-[16px] leading-normal transition-colors ${
                isMarketActive
                  ? 'font-bold text-accent-bright'
                  : 'font-normal text-text-primary hover:text-accent-bright'
              }`}
            >
              Mercado
              {isMarketActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-accent" aria-hidden="true" />
              ) : null}
            </Link>

            <button
              type="button"
              onClick={() => onOpenOutOfScope('Criadores em Destaque')}
              className="pb-5 text-[16px] font-normal leading-normal text-text-primary hover:text-accent-bright cursor-pointer"
            >
              Criadores
            </button>

            <button
              type="button"
              onClick={() => onOpenOutOfScope('Central de Aprendizado Kurio')}
              className="pb-5 text-[16px] font-normal leading-normal text-text-primary hover:text-accent-bright cursor-pointer"
            >
              Aprenda
            </button>
          </nav>

          <div className="hidden items-center gap-6 lg:flex">
            <a
              href="#catalogo-section"
              aria-label="Ir para a busca do catálogo"
              className="inline-flex h-8 w-8 items-center justify-center text-text-primary hover:text-accent-bright"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </a>

            <Link
              to="/cart"
              data-testid="nav-cart-link"
              aria-label={`Carrinho com ${itemCount} itens`}
              className="relative inline-flex h-8 w-8 items-center justify-center text-text-primary hover:text-accent-bright"
            >
              <ShoppingCart className="h-6 w-6" aria-hidden="true" />
              <span
                data-testid="nav-cart-count"
                className="absolute -right-1.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-bg-primary"
              >
                {itemCount}
              </span>
            </Link>

            {status === 'authenticated' && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/wallets"
                  data-testid="nav-wallets-link"
                  className="inline-flex h-8.75 items-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-3 text-xs font-medium text-text-secondary hover:border-accent hover:text-text-primary"
                >
                  <WalletIcon className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
                  <span>Carteiras</span>
                </Link>
                <Link
                  to="/profile"
                  data-testid="nav-profile-link"
                  className="inline-flex h-8.75 items-center gap-2 rounded-md border border-border-subtle bg-bg-secondary px-3 text-xs font-medium text-text-primary hover:border-accent"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
                  )}
                  <span data-testid="nav-user-name">{user.name}</span>
                </Link>
                <button
                  type="button"
                  data-testid="nav-logout-button"
                  aria-label="Sair da conta"
                  onClick={onLogout}
                  className="inline-flex h-8.75 items-center gap-1.5 rounded-md bg-accent px-3.5 text-[14px] font-medium text-bg-primary hover:bg-accent-hover cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  data-testid="nav-login-link"
                  onClick={() => saveReturnTo(currentFullPath)}
                  className="inline-flex h-8.75 w-25 items-center justify-center gap-1.5 rounded-md bg-accent text-[16px] font-medium text-bg-primary hover:bg-accent-hover"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Entrar</span>
                </Link>
                <Link
                  to="/register"
                  data-testid="nav-register-link"
                  onClick={() => saveReturnTo(currentFullPath)}
                  className="sr-only"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/cart"
              data-testid="mobile-cart-link"
              className="relative inline-flex h-8.75 items-center gap-1.5 rounded-[10px] border border-border-subtle bg-bg-secondary px-3 text-xs font-bold text-text-primary"
            >
              <ShoppingCart className="h-4 w-4 text-accent-bright" aria-hidden="true" />
              <span className="sr-only">Carrinho: </span>
              <span data-testid="mobile-cart-count">{itemCount}</span>
            </Link>

            <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Button
                variant="secondary"
                size="icon"
                data-testid="mobile-menu-trigger"
                aria-label="Abrir menu de navegação"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
              <DrawerContent closeLabel="Fechar menu de navegação">
                <DialogTitle className="font-mono text-text-primary">KURIO</DialogTitle>
                <nav aria-label="Menu móvel" className="mt-6 flex flex-col gap-2">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
                  >
                    Início / Mercado
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
                  >
                    <span>Carrinho de NFTs</span>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-bg-primary">
                      {itemCount}
                    </span>
                  </Link>
                  {status === 'authenticated' && user ? (
                    <>
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
                      >
                        Perfil ({user.name})
                      </Link>
                      <Link
                        to="/wallets"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
                      >
                        Carteiras
                      </Link>
                      <Button
                        variant="secondary"
                        className="mt-4 justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false)
                          onLogout()
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
        {showHeaderDivider ? <div className="h-px w-full bg-accent/35" /> : null}
      </div>
    </header>
  )
}
