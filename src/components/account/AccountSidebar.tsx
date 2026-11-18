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
    <aside className="w-full shrink-0 bg-bg-secondary py-[8px] lg:w-[310px]">
      <div className="p-[10px]">
        <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">Meu perfil</h2>
      </div>

      <Link
        to="/profile"
        className={`flex items-center gap-[16px] px-[16px] text-[15px] leading-[45px] text-accent-bright ${
          isProfile ? 'border-l-[6px] border-accent' : 'hover:bg-bg-elevated'
        }`}
      >
        <UserIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Dados do perfil</span>
      </Link>

      <Link
        to="/wallets"
        className={`flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright ${
          isWallets ? 'border-l-[6px] border-accent' : 'hover:bg-bg-elevated'
        }`}
      >
        <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Carteiras</span>
      </Link>

      {isProfile ? (
        <a
          href="#profile-activity-section"
          className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright hover:bg-bg-elevated"
        >
          <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
          <span>Atividade</span>
        </a>
      ) : (
        <Link
          to="/profile"
          className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright hover:bg-bg-elevated"
        >
          <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
          <span>Atividade</span>
        </Link>
      )}

      {isProfile ? (
        <a
          href="#profile-favorites-section"
          className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright hover:bg-bg-elevated"
        >
          <Heart className="h-[16px] w-[16px]" aria-hidden="true" />
          <span>Lista de interesse</span>
        </a>
      ) : (
        <Link
          to="/profile"
          className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright hover:bg-bg-elevated"
        >
          <Heart className="h-[16px] w-[16px]" aria-hidden="true" />
          <span>Lista de interesse</span>
        </Link>
      )}

      <div className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright">
        <Activity className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Ofertas</span>
      </div>

      <div className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright">
        <Download className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Arquivos baixados</span>
      </div>

      <div className="flex items-center gap-[12px] px-[16px] text-[15px] leading-[45px] text-accent-bright">
        <AlertTriangle className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Suporte</span>
      </div>

      <div className="my-1 h-px w-full bg-accent/35" />

      <button
        type="button"
        onClick={onLogout}
        className="flex h-[40px] w-full items-center gap-[8px] px-[16px] text-[15px] font-bold text-accent-bright hover:bg-bg-elevated cursor-pointer"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        <span>Sair</span>
      </button>
    </aside>
  )
}
