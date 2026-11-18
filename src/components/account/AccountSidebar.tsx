import { Link } from '@tanstack/react-router'
import {
  Activity,
  AlertTriangle,
  Download,
  Heart,
  LogOut,
  MapPin,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react'

interface AccountSidebarProps {
  activeSection: 'profile' | 'wallets'
  onLogout: () => void
}

export function AccountSidebar({ activeSection, onLogout }: AccountSidebarProps) {
  const isProfile = activeSection === 'profile'
  const isWallets = activeSection === 'wallets'

  return (
    <aside className="w-full shrink-0 bg-bg-secondary py-2 lg:w-77.5">
      <div className="p-2.5">
        <h2 className="text-[18px] font-bold leading-4 text-text-primary">Meu perfil</h2>
      </div>

      <Link
        to="/profile"
        className={`flex items-center gap-4 px-4 text-[15px] leading-11.25 text-accent-bright ${
          isProfile ? 'border-l-[6px] border-accent' : 'hover:bg-bg-elevated'
        }`}
      >
        <UserIcon className="h-4.5 w-4.5" aria-hidden="true" />
        <span>Dados do perfil</span>
      </Link>

      <Link
        to="/wallets"
        className={`flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright ${
          isWallets ? 'border-l-[6px] border-accent' : 'hover:bg-bg-elevated'
        }`}
      >
        <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
        <span>Carteiras</span>
      </Link>

      {isProfile ? (
        <a
          href="#profile-activity-section"
          className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright hover:bg-bg-elevated"
        >
          <ShoppingBag className="h-4.5 w-4.5" aria-hidden="true" />
          <span>Atividade</span>
        </a>
      ) : (
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright hover:bg-bg-elevated"
        >
          <ShoppingBag className="h-4.5 w-4.5" aria-hidden="true" />
          <span>Atividade</span>
        </Link>
      )}

      {isProfile ? (
        <a
          href="#profile-favorites-section"
          className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright hover:bg-bg-elevated"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          <span>Lista de interesse</span>
        </a>
      ) : (
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright hover:bg-bg-elevated"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          <span>Lista de interesse</span>
        </Link>
      )}

      <div className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright">
        <Activity className="h-4.5 w-4.5" aria-hidden="true" />
        <span>Ofertas</span>
      </div>

      <div className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright">
        <Download className="h-4.5 w-4.5" aria-hidden="true" />
        <span>Arquivos baixados</span>
      </div>

      <div className="flex items-center gap-3 px-4 text-[15px] leading-11.25 text-accent-bright">
        <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
        <span>Suporte</span>
      </div>

      <div className="my-1 h-px w-full bg-accent/35" />

      <button
        type="button"
        onClick={onLogout}
        className="flex h-10 w-full items-center gap-2 px-4 text-[15px] font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
      >
        <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
        <span>Sair</span>
      </button>
    </aside>
  )
}
