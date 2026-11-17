import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  AlertTriangle,
  Heart,
  Home,
  LogIn,
  LogOut,
  Menu,
  ScanLine,
  Search,
  ShoppingCart,
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
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSent, setNewsletterSent] = useState(false)

  const itemCount = cart?.itemCount ?? 0
  const pathname = routerState.location.pathname
  const currentFullPath = `${pathname}${routerState.location.searchStr}`

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

  const handleGoToLogin = () => {
    saveReturnTo(currentFullPath)
    clearExpiredNotice()
    void navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary font-mono text-text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[6px] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-bg-primary"
      >
        Pular para o conteúdo principal
      </a>

      <header className="sticky top-0 z-40 bg-bg-primary/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[1200px] px-4 pt-5 sm:px-6 lg:px-0">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex h-[34px] items-center text-[14px] font-bold tracking-[1.4px] text-text-primary"
              >
                KURIO
              </Link>
              <ScenarioToolbar />
            </div>

            <nav aria-label="Navegação principal" className="hidden items-start gap-[40px] lg:flex">
              <Link
                to="/"
                className={`relative pb-5 text-[16px] leading-normal transition-colors ${
                  isHomeActive ? 'font-bold text-accent-bright' : 'font-normal text-text-primary hover:text-accent-bright'
                }`}
              >
                Início
                {isHomeActive ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent" aria-hidden="true" />
                ) : null}
              </Link>

              <Link
                to="/"
                hash="catalogo-section"
                className={`relative pb-5 text-[16px] leading-normal transition-colors ${
                  isMarketActive ? 'font-bold text-accent-bright' : 'font-normal text-text-primary hover:text-accent-bright'
                }`}
              >
                Mercado
                {isMarketActive ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent" aria-hidden="true" />
                ) : null}
              </Link>

              <button
                type="button"
                onClick={() => setOutOfScopeFeature('Criadores em Destaque')}
                className="pb-5 text-[16px] font-normal leading-normal text-text-primary hover:text-accent-bright cursor-pointer"
              >
                Criadores
              </button>

              <button
                type="button"
                onClick={() => setOutOfScopeFeature('Central de Aprendizado Kurio')}
                className="pb-5 text-[16px] font-normal leading-normal text-text-primary hover:text-accent-bright cursor-pointer"
              >
                Aprenda
              </button>
            </nav>

            <div className="hidden items-center gap-[24px] lg:flex">
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
                  className="absolute -right-1.5 -top-1 inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-bg-primary"
                >
                  {itemCount}
                </span>
              </Link>

              {status === 'authenticated' && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/wallets"
                    data-testid="nav-wallets-link"
                    className="inline-flex h-[35px] items-center gap-1.5 rounded-[6px] border border-border-subtle bg-bg-secondary px-3 text-xs font-medium text-text-secondary hover:border-accent hover:text-text-primary"
                  >
                    <WalletIcon className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
                    <span>Carteiras</span>
                  </Link>
                  <Link
                    to="/profile"
                    data-testid="nav-profile-link"
                    className="inline-flex h-[35px] items-center gap-2 rounded-[6px] border border-border-subtle bg-bg-secondary px-3 text-xs font-medium text-text-primary hover:border-accent"
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
                    onClick={() => void logout()}
                    className="inline-flex h-[35px] items-center gap-1.5 rounded-[6px] bg-accent px-3.5 text-[14px] font-medium text-bg-primary hover:bg-accent-hover cursor-pointer"
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
                    className="inline-flex h-[35px] w-[100px] items-center justify-center gap-1.5 rounded-[6px] bg-accent text-[16px] font-medium text-bg-primary hover:bg-accent-hover"
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
                className="relative inline-flex h-[35px] items-center gap-1.5 rounded-[10px] border border-border-subtle bg-bg-secondary px-3 text-xs font-bold text-text-primary"
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
                      className="rounded-[6px] px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
                    >
                      Início / Mercado
                    </Link>
                    <Link
                      to="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-[6px] px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
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
                          className="rounded-[6px] px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
                        >
                          Perfil ({user.name})
                        </Link>
                        <Link
                          to="/wallets"
                          onClick={() => setMobileMenuOpen(false)}
                          className="rounded-[6px] px-4 py-3 text-sm font-bold text-text-primary hover:bg-bg-elevated"
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
          {showHeaderDivider ? <div className="h-px w-full bg-accent/35" /> : null}
        </div>
      </header>

      {expiredNotice ? (
        <div
          role="alert"
          data-testid="session-expired-banner"
          className="border-b border-amber-500/60 bg-amber-950/90 px-4 py-3 text-amber-100"
        >
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
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
          <div className="mx-auto flex max-w-[1200px] flex-col gap-2">
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

      <footer className="mt-20 text-text-primary">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-0">
          <div className="bg-bg-secondary p-6 sm:p-[32px]">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
              <div className="flex flex-col gap-[12px] lg:col-span-2">
                <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-accent text-[24px] font-bold text-bg-primary">
                  W
                </div>
                <h2 className="text-[17px] font-bold leading-[16px] text-text-primary">
                  Segurança da carteira
                </h2>
                <p className="text-[14px] leading-[22px] text-text-secondary">
                  Proteja sua carteira e colecione arte digital verificada com confiança.
                </p>
              </div>

              <div className="flex flex-col gap-[12px] lg:col-span-3 lg:border-l lg:border-accent/40 lg:pl-6">
                <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-accent text-[24px] font-bold text-bg-primary">
                  C
                </div>
                <h2 className="text-[17px] font-bold leading-[16px] text-text-primary">
                  Criadores em destaque
                </h2>
                <p className="text-[14px] leading-[22px] text-text-secondary">
                  Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
                </p>
              </div>

              <div className="flex flex-col gap-[12px] lg:col-span-3 lg:border-l lg:border-accent/40 lg:pl-6">
                <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-accent text-[24px] font-bold text-bg-primary">
                  D
                </div>
                <h2 className="text-[17px] font-bold leading-[16px] text-text-primary">
                  Alertas de lançamentos
                </h2>
                <p className="text-[14px] leading-[22px] text-text-secondary">
                  Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
                </p>
              </div>

              <div className="flex flex-col gap-[12px] lg:col-span-4 lg:border-l lg:border-accent/40 lg:pl-6">
                <h2 className="text-[18px] font-bold leading-[22px] text-text-primary">
                  Antecipe-se ao próximo lançamento
                </h2>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (newsletterEmail.trim()) {
                      setNewsletterSent(true)
                      setNewsletterEmail('')
                    }
                  }}
                  className="flex h-[40px] w-full overflow-hidden rounded-[6px] bg-surface-dark shadow-[0px_0px_10px_rgba(10,6,4,0.45)]"
                >
                  <label htmlFor="footer-newsletter-email" className="sr-only">
                    Seu e-mail para receber novidades
                  </label>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    placeholder="digite seu e-mail..."
                    className="flex-1 bg-transparent px-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-[40px] w-[85px] shrink-0 bg-accent text-[18px] font-bold text-bg-primary hover:bg-accent-hover cursor-pointer"
                  >
                    Enviar
                  </button>
                </form>
                <p className="text-[13px] leading-[22px] text-text-secondary">
                  {newsletterSent
                    ? 'Inscrição confirmada! Você receberá os próximos alertas da Kurio.'
                    : 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 bg-surface-dark px-6 py-6 sm:px-[32px] lg:h-[88px] lg:flex-row lg:items-center">
            <span className="text-[14px] font-bold tracking-[1.4px] text-text-primary">KURIO</span>
            <p className="text-[14px] leading-[22px] text-text-primary">
              Feito para colecionadores,
              <br />
              criadores e cultura
            </p>
            <a
              href="mailto:contato@email.com"
              className="text-[14px] leading-[22px] text-text-primary hover:text-accent-bright"
            >
              contato@email.com
            </a>
            <span className="text-[14px] leading-[22px] text-text-primary">+55 11 4002 8922</span>
          </div>

          <div className="bg-bg-secondary p-6 sm:p-[32px]">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">Meu perfil</h2>
                <ul className="mt-3 space-y-1 text-[14px] leading-[30px] text-text-primary">
                  <li>
                    <Link to="/profile" className="hover:text-accent-bright">
                      Meu perfil
                    </Link>
                  </li>
                  <li>
                    <Link to="/wallets" className="hover:text-accent-bright">
                      Minha coleção
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOutOfScopeFeature('Atividade da Rede')}
                      className="hover:text-accent-bright cursor-pointer"
                    >
                      Atividade
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOutOfScopeFeature('Estúdio do Criador')}
                      className="hover:text-accent-bright cursor-pointer"
                    >
                      Estúdio do criador
                    </button>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-accent-bright">
                      Lista de interesse
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">Central de ajuda</h2>
                <ul className="mt-3 space-y-1 text-[14px] leading-[30px] text-text-primary">
                  <li>
                    <button
                      type="button"
                      data-testid="footer-support-btn"
                      onClick={() => setOutOfScopeFeature('Central de ajuda')}
                      className="hover:text-accent-bright cursor-pointer"
                    >
                      Central de ajuda
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOutOfScopeFeature('Como comprar NFTs')}
                      className="hover:text-accent-bright cursor-pointer"
                    >
                      Como comprar NFTs
                    </button>
                  </li>
                  <li>
                    <Link to="/wallets" className="hover:text-accent-bright">
                      Carteira e segurança
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOutOfScopeFeature('Política do mercado')}
                      className="hover:text-accent-bright cursor-pointer"
                    >
                      Política do mercado
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOutOfScopeFeature('Denunciar item')}
                      className="hover:text-accent-bright cursor-pointer"
                    >
                      Denunciar item
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">Coleções</h2>
                <ul className="mt-3 space-y-1 text-[14px] leading-[30px] text-text-primary">
                  <li>
                    <Link to="/" search={{ category: ['art'] }} className="hover:text-accent-bright">
                      Arte digital
                    </Link>
                  </li>
                  <li>
                    <Link to="/" search={{ category: ['photography'] }} className="hover:text-accent-bright">
                      Fotografia
                    </Link>
                  </li>
                  <li>
                    <Link to="/" search={{ category: ['music'] }} className="hover:text-accent-bright">
                      Música
                    </Link>
                  </li>
                  <li>
                    <Link to="/" search={{ category: ['video'] }} className="hover:text-accent-bright">
                      Arte 3D
                    </Link>
                  </li>
                  <li>
                    <Link to="/" search={{ category: ['utility'] }} className="hover:text-accent-bright">
                      Utilidade
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-[28px]">
                <div className="flex flex-col gap-[16px]">
                  <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">Redes sociais</h2>
                  <div className="flex items-center gap-[10px]">
                    <button
                      type="button"
                      aria-label="Facebook da Kurio"
                      onClick={() => setOutOfScopeFeature('Facebook da Kurio')}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border border-accent/40 text-xs font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
                    >
                      <img src="/images/figma/social-fb.svg" alt="" className="h-[30px] w-[30px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Instagram da Kurio"
                      onClick={() => setOutOfScopeFeature('Instagram da Kurio')}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border border-accent/40 text-xs font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
                    >
                      <img src="/images/figma/social-ig.svg" alt="" className="h-[30px] w-[30px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="Twitter da Kurio"
                      onClick={() => setOutOfScopeFeature('Twitter da Kurio')}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border border-accent/40 text-xs font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
                    >
                      <img src="/images/figma/social-tw.svg" alt="" className="h-[30px] w-[30px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="LinkedIn da Kurio"
                      onClick={() => setOutOfScopeFeature('LinkedIn da Kurio')}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border border-accent/40 text-xs font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
                    >
                      <img src="/images/figma/social-in.svg" alt="" className="h-[30px] w-[30px]" />
                    </button>
                    <button
                      type="button"
                      aria-label="YouTube da Kurio"
                      onClick={() => setOutOfScopeFeature('YouTube da Kurio')}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-[4px] border border-accent/40 text-xs font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
                    >
                      <img src="/images/figma/social-yt.svg" alt="" className="h-[30px] w-[30px]" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-[12px]">
                  <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">
                    Carteiras compatíveis
                  </h2>
                  <div className="flex h-[26px] items-center justify-center rounded-[6px] border border-border-soft bg-surface-dark px-2">
                    <span className="text-[9px] font-bold tracking-[0.1px] text-accent-bright">
                      METAMASK • WALLETCONNECT • COINBASE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="py-3 text-center text-[14px] leading-[30px] text-text-primary">
            © 2026 Kurio. Propriedade digital para todos.
          </p>
        </div>
      </footer>

      <nav
        aria-label="Navegação inferior móvel"
        className="fixed bottom-0 left-0 right-0 z-30 flex h-[74px] items-center justify-around border-t border-border-subtle bg-bg-secondary/95 px-4 backdrop-blur-md lg:hidden"
      >
        <Link
          to="/"
          aria-label="Início"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            pathname === '/' ? 'text-accent-bright' : 'text-text-secondary'
          }`}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          to="/profile"
          aria-label="Favoritos"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary"
        >
          <Heart className="h-5 w-5" aria-hidden="true" />
        </Link>
        <a
          href="#catalogo-section"
          aria-label="Explorar NFTs"
          className="-mt-7 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-accent text-bg-primary shadow-lg"
        >
          <ScanLine className="h-6 w-6" aria-hidden="true" />
        </a>
        <Link
          to="/cart"
          aria-label="Carrinho"
          className={`relative flex h-11 w-11 items-center justify-center rounded-full ${
            pathname.startsWith('/cart') ? 'text-accent-bright' : 'text-text-secondary'
          }`}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          to={status === 'authenticated' ? '/profile' : '/login'}
          aria-label="Perfil"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            pathname.startsWith('/profile') || pathname.startsWith('/login')
              ? 'text-accent-bright'
              : 'text-text-secondary'
          }`}
        >
          <UserIcon className="h-5 w-5" aria-hidden="true" />
        </Link>
      </nav>

      <OutOfScopeDialog featureName={outOfScopeFeature} onClose={() => setOutOfScopeFeature(null)} />
      <NotificationsViewport />
    </div>
  )
}
