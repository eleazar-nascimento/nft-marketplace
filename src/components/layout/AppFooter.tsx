import { Link } from '@tanstack/react-router'
import { useState } from 'react'

interface AppFooterProps {
  hideOnMobile?: boolean
  onOpenOutOfScope: (feature: string) => void
}

const socialItems = [
  { label: 'Facebook da Kurio', icon: '/images/figma/social-fb.svg' },
  { label: 'Instagram da Kurio', icon: '/images/figma/social-ig.svg' },
  { label: 'Twitter da Kurio', icon: '/images/figma/social-tw.svg' },
  { label: 'LinkedIn da Kurio', icon: '/images/figma/social-in.svg' },
  { label: 'YouTube da Kurio', icon: '/images/figma/social-yt.svg' },
]

export function AppFooter({ hideOnMobile = false, onOpenOutOfScope }: AppFooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSent, setNewsletterSent] = useState(false)

  return (
    <footer className={`mt-20 text-text-primary ${hideOnMobile ? 'hidden lg:block' : ''}`}>
      <div className="mx-auto w-full max-w-300 px-4 sm:px-6 xl:px-0">
        <div className="bg-bg-secondary p-6 sm:p-8 xl:min-h-62.5">
          <div className="flex h-full w-full flex-col gap-8 lg:grid lg:grid-cols-2 lg:gap-8 xl:flex xl:flex-row xl:items-stretch xl:justify-between xl:gap-0">
            <div className="flex min-w-0 flex-col items-start gap-3 xl:flex-1 xl:pr-6">
              <div className="flex h-18.5 w-18.5 shrink-0 items-center justify-center rounded-full bg-accent text-[24px] font-bold text-bg-primary">
                W
              </div>
              <h2 className="text-[17px] font-bold leading-5 text-text-primary xl:whitespace-nowrap">
                Segurança da carteira
              </h2>
              <p className="text-[14px] leading-5.5 text-text-secondary">
                Proteja sua carteira e colecione arte digital verificada com confiança.
              </p>
            </div>

            <div className="hidden xl:block xl:w-px xl:shrink-0 xl:self-stretch xl:bg-accent/50" />

            <div className="flex min-w-0 flex-col items-start gap-3 xl:flex-1 xl:px-6">
              <div className="flex h-18.5 w-18.5 shrink-0 items-center justify-center rounded-full bg-accent text-[24px] font-bold text-bg-primary">
                C
              </div>
              <h2 className="text-[17px] font-bold leading-5 text-text-primary xl:whitespace-nowrap">
                Criadores em destaque
              </h2>
              <p className="text-[14px] leading-5.5 text-text-secondary">
                Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
              </p>
            </div>

            <div className="hidden xl:block xl:w-px xl:shrink-0 xl:self-stretch xl:bg-accent/50" />

            <div className="flex min-w-0 flex-col items-start gap-3 xl:flex-1 xl:px-6">
              <div className="flex h-18.5 w-18.5 shrink-0 items-center justify-center rounded-full bg-accent text-[24px] font-bold text-bg-primary">
                D
              </div>
              <h2 className="text-[17px] font-bold leading-5 text-text-primary xl:whitespace-nowrap">
                Alertas de lançamentos
              </h2>
              <p className="text-[14px] leading-5.5 text-text-secondary">
                Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
              </p>
            </div>

            <div className="hidden xl:block xl:w-px xl:shrink-0 xl:self-stretch xl:bg-accent/50" />

            <div className="flex min-w-0 flex-col items-start justify-between gap-3 xl:w-85 xl:shrink-0 xl:pl-6">
              <div className="flex w-full flex-col items-start gap-4">
                <h2 className="text-[18px] font-bold leading-5.5 text-text-primary">
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
                  className="flex h-10 w-full overflow-hidden rounded-md bg-surface-dark shadow-[0px_0px_10px_rgba(10,6,4,0.45)]"
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
                    className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 w-21.25 shrink-0 bg-accent text-[18px] font-bold text-bg-primary hover:bg-accent-hover cursor-pointer"
                  >
                    Enviar
                  </button>
                </form>
              </div>
              <p className="text-[13px] leading-5.5 text-text-secondary">
                {newsletterSent
                  ? 'Inscrição confirmada! Você receberá os próximos alertas da Kurio.'
                  : 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-dark px-6 py-6 sm:px-8 lg:flex lg:min-h-22 lg:items-center lg:py-4 xl:h-22 xl:py-0">
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_minmax(190px,228px)] lg:items-center lg:gap-8 xl:grid-cols-[1fr_1fr_1fr_228px] xl:gap-23">
            <span className="text-[14px] font-bold tracking-[1.4px] text-text-primary">KURIO</span>
            <p className="min-w-0 text-[14px] leading-5.5 text-text-primary">
              Feito para colecionadores,
              <br />
              criadores e cultura
            </p>
            <a
              href="mailto:contato@email.com"
              className="min-w-0 break-all text-[14px] leading-5.5 text-text-primary hover:text-accent-bright sm:break-normal"
            >
              contato@email.com
            </a>
            <span className="min-w-0 text-[14px] leading-5.5 text-text-primary">+55 11 4002 8922</span>
          </div>
        </div>

        <div className="bg-bg-secondary p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_minmax(190px,228px)] lg:gap-8 xl:grid-cols-[1fr_1fr_1fr_228px] xl:gap-23">
            <div>
              <h2 className="text-[18px] font-bold leading-4 text-text-primary">Meu perfil</h2>
              <ul className="mt-3 space-y-1 text-[14px] leading-7.5 text-text-primary">
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
                    onClick={() => onOpenOutOfScope('Atividade da Rede')}
                    className="hover:text-accent-bright cursor-pointer"
                  >
                    Atividade
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenOutOfScope('Estúdio do Criador')}
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
              <h2 className="text-[18px] font-bold leading-4 text-text-primary">Central de ajuda</h2>
              <ul className="mt-3 space-y-1 text-[14px] leading-7.5 text-text-primary">
                <li>
                  <button
                    type="button"
                    data-testid="footer-support-btn"
                    onClick={() => onOpenOutOfScope('Central de ajuda')}
                    className="hover:text-accent-bright cursor-pointer"
                  >
                    Central de ajuda
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenOutOfScope('Como comprar NFTs')}
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
                    onClick={() => onOpenOutOfScope('Política do mercado')}
                    className="hover:text-accent-bright cursor-pointer"
                  >
                    Política do mercado
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenOutOfScope('Denunciar item')}
                    className="hover:text-accent-bright cursor-pointer"
                  >
                    Denunciar item
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-[18px] font-bold leading-4 text-text-primary">Coleções</h2>
              <ul className="mt-3 space-y-1 text-[14px] leading-7.5 text-text-primary">
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

            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-4">
                <h2 className="text-[18px] font-bold leading-4 text-text-primary">Redes sociais</h2>
                <div className="flex items-center gap-2.5">
                  {socialItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      aria-label={item.label}
                      onClick={() => onOpenOutOfScope(item.label)}
                      className="flex h-7.5 w-7.5 items-center justify-center rounded-sm border border-accent/40 text-xs font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
                    >
                      <img src={item.icon} alt="" className="h-7.5 w-7.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="text-[18px] font-bold leading-4 text-text-primary xl:whitespace-nowrap">
                  Carteiras compatíveis
                </h2>
                <div className="flex min-h-6.5 items-center justify-center rounded-md border border-border-soft bg-surface-dark px-2 py-1 text-center">
                  <span className="text-[9px] font-bold tracking-[0.1px] text-accent-bright xl:whitespace-nowrap">
                    METAMASK • WALLETCONNECT • COINBASE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="py-3 text-center text-[14px] leading-7.5 text-text-primary">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
