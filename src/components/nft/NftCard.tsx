import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels, nftCategoryLabels, type NftSummary } from '@/contracts'
import { formatEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { useToggleFavorite } from '@/state/queries'
import { useSession } from '@/state/session'

interface NftCardProps {
  nft: NftSummary
  isFavorite: boolean
  priority?: boolean
}

export function NftCard({ nft, isFavorite, priority = false }: NftCardProps) {
  const { status } = useSession()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const toggleFavorite = useToggleFavorite()

  const handleFavorite = () => {
    if (status !== 'authenticated') {
      saveReturnTo(`${routerState.location.pathname}${routerState.location.searchStr}`)
      void navigate({ to: '/login' })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, isFavorite })
  }

  const isSoldOut = nft.available === 0

  return (
    <Card
      data-testid={`nft-card-${nft.id}`}
      className="group flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-bg-primary">
        <Link to="/nft/$nftId" params={{ nftId: nft.id }} className="block h-full w-full">
          <img
            src={nft.image.url}
            alt={nft.image.alt}
            width={nft.image.width}
            height={nft.image.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant="default">{nftCategoryLabels[nft.category]}</Badge>
          <Badge variant="accent">{networkLabels[nft.network]}</Badge>
        </div>

        <button
          type="button"
          onClick={handleFavorite}
          data-testid={`favorite-btn-${nft.id}`}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remover ${nft.name} dos favoritos (${nft.likes} curtidas)`
              : `Adicionar ${nft.name} aos favoritos (${nft.likes} curtidas)`
          }
          className="absolute right-3 top-3 inline-flex h-10 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-primary/90 px-3 text-xs font-mono font-semibold text-white hover:border-accent-bright cursor-pointer"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite ? 'fill-accent-bright text-accent-bright' : 'text-white'}`}
            aria-hidden="true"
          />
          <span data-testid={`favorite-likes-${nft.id}`}>{nft.likes}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="block text-lg font-semibold text-white hover:text-accent-bright"
          >
            {nft.name}
          </Link>

          <div className="mt-2 flex items-center gap-2">
            <img
              src={nft.creator.avatarUrl}
              alt=""
              width={24}
              height={24}
              loading="lazy"
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="font-mono text-xs text-text-secondary">{nft.creator.displayName}</span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-border-subtle/70 pt-3 font-mono">
          <div>
            <span className="block text-xs text-text-muted">A partir de</span>
            <span data-testid={`nft-price-${nft.id}`} className="text-sm font-semibold text-white">
              {formatEth(nft.priceFromEth)}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-xs text-text-muted">Disponibilidade</span>
            {isSoldOut ? (
              <Badge variant="danger" data-testid={`nft-availability-${nft.id}`}>
                Esgotado
              </Badge>
            ) : (
              <span
                data-testid={`nft-availability-${nft.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {nft.available} disp.
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function NftCardSkeleton() {
  return (
    <Card data-testid="nft-card-skeleton" className="flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <Skeleton className="h-6 w-3/4" />
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border-subtle/70 pt-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </Card>
  )
}
