import { Link } from '@tanstack/react-router'

interface MobileTabBarProps {
  pathname: string
  status: 'checking' | 'authenticated' | 'anonymous'
  itemCount: number
}

export function MobileTabBar({ pathname, status, itemCount }: MobileTabBarProps) {
  const isHome = pathname === '/'
  const isFavorites = pathname.startsWith('/favorites')
  const isCart = pathname.startsWith('/cart')
  const isAccount = pathname.startsWith('/profile') || pathname.startsWith('/login')

  return (
    <nav
      aria-label="Navegação inferior móvel"
      className="fixed bottom-0 left-0 right-0 z-30 h-20 lg:hidden"
    >
      <svg
        viewBox="30 40 414 95"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_-10px_25px_rgba(10,6,4,0.6)]"
      >
        <path
          d="M312.85 40C299.09 40 286.87 48.2 281.02 60.65C273.26 77.17 256.46 88.62 237 88.62C217.54 88.62 200.74 77.18 192.98 60.65C187.13 48.2 174.9 40 161.15 40H58.93C42.95 40 30 52.95 30 68.93V135H444V68.93C444 52.95 431.05 40 415.07 40H312.85Z"
          fill="#241612"
        />
      </svg>

      <div className="relative z-10 flex h-full items-center justify-around px-4 pt-2">
        <Link
          to="/"
          aria-label="Início"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            isHome ? 'text-accent-bright' : 'text-[#C5A78C]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3.2L3.5 9.9C3.18 10.15 3 10.54 3 10.95V19.2C3 20.19 3.81 21 4.8 21H9.5V15.2C9.5 14.54 10.04 14 10.7 14H13.3C13.96 14 14.5 14.54 14.5 15.2V21H19.2C20.19 21 21 20.19 21 19.2V10.95C21 10.54 20.82 10.15 20.5 9.9L12 3.2Z"
              fill="currentColor"
            />
          </svg>
        </Link>

        <Link
          to="/favorites"
          aria-label="Favoritos"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            isFavorites ? 'text-accent-bright' : 'text-[#C5A78C]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 20.35L10.55 19.03C5.4 14.36 2 11.27 2 7.5C2 4.41 4.42 2 7.5 2C9.24 2 10.91 2.81 12 4.08C13.09 2.81 14.76 2 16.5 2C19.58 2 22 4.41 22 7.5C22 11.27 18.6 14.36 13.45 19.03L12 20.35Z"
              fill="currentColor"
            />
          </svg>
        </Link>

        <a
          href="#catalogo-section"
          aria-label="Explorar NFTs"
          className="-mt-11 flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#D28A4C66_0%,#D28A4C_100%)] text-white shadow-lg"
        >
          <svg width="27" height="24" viewBox="0 0 27 24" fill="none" aria-hidden="true">
            <path
              d="M3.5 9V7.5C3.5 5.01 5.51 3 8 3H10.5M16.5 3H19C21.49 3 23.5 5.01 23.5 7.5V9M3.5 15V16.5C3.5 18.99 5.51 21 8 21H10.5M16.5 21H19C21.49 21 23.5 18.99 23.5 16.5V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="1.5"
              y1="12"
              x2="25.5"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </a>

        <Link
          to="/cart"
          aria-label="Carrinho"
          className={`relative flex h-11 w-11 items-center justify-center rounded-full ${
            isCart ? 'text-accent-bright' : 'text-[#C5A78C]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M2.5 4.5H5.2L6.6 14.6C6.72 15.4 7.41 16 8.22 16H18.4C19.23 16 19.93 15.39 20.05 14.57L21 7.8C21.08 7.2 20.62 6.67 20.01 6.67H6.9L6.45 3.6C6.35 2.96 5.8 2.5 5.15 2.5H2.5C1.95 2.5 1.5 2.95 1.5 3.5C1.5 4.05 1.95 4.5 2.5 4.5Z"
              fill="currentColor"
            />
            <circle cx="9" cy="19.5" r="1.75" fill="currentColor" />
            <circle cx="18" cy="19.5" r="1.75" fill="currentColor" />
          </svg>
          {itemCount > 0 ? (
            <span
              data-testid="mobile-tab-cart-count"
              className="absolute right-0 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-bg-primary"
            >
              {itemCount}
            </span>
          ) : null}
        </Link>

        <Link
          to={status === 'authenticated' ? '/profile' : '/login'}
          aria-label="Perfil"
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            isAccount ? 'text-accent-bright' : 'text-[#C5A78C]'
          }`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="7.5" r="4" fill="currentColor" />
            <path
              d="M4.5 19.5C4.5 15.91 7.86 13.5 12 13.5C16.14 13.5 19.5 15.91 19.5 19.5C19.5 20.33 18.83 21 18 21H6C5.17 21 4.5 20.33 4.5 19.5Z"
              fill="currentColor"
            />
          </svg>
        </Link>
      </div>
    </nav>
  )
}
