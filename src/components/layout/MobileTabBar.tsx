import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, User as UserIcon } from 'lucide-react'

interface MobileTabBarProps {
  pathname: string
  status: 'checking' | 'authenticated' | 'anonymous'
}

export function MobileTabBar({ pathname, status }: MobileTabBarProps) {
  return (
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
  )
}
