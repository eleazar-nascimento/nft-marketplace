import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { type NftSummary } from '@/contracts'
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
  const showOriginalPrice = nft.id === 'nft_003'

  return (
    <article
      data-testid={`nft-card-${nft.id}`}
      className="group flex w-full flex-col gap-[12px]"
    >
      <div className="relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-[6px] bg-bg-secondary p-[4px]">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="relative block h-[250px] w-full max-w-[250px] overflow-hidden rounded-[15px]"
        >
          <img
            src={nft.image.url}
            alt={nft.image.alt}
            width={nft.image.width}
            height={nft.image.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full rounded-[15px] object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {nft.id === 'nft_003' ? (
          <span className="pointer-events-none absolute left-0 top-4 bg-accent px-2.5 py-1 text-[12px] font-medium leading-[16px] text-bg-primary">
            RARO
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleFavorite}
          data-testid={`favorite-btn-${nft.id}`}
          aria-pressed={isFavorite}
          className="absolute right-3 top-3 inline-flex h-[28px] items-center gap-1 rounded-full border border-border-subtle bg-bg-primary/85 px-2 text-[11px] font-mono text-text-primary hover:border-accent cursor-pointer"
        >
          <Heart
            className={`h-3.5 w-3.5 ${isFavorite ? 'fill-accent-bright text-accent-bright' : 'text-accent-bright'}`}
            aria-hidden="true"
          />
          <span className="sr-only">
            {isFavorite ? `Remover ${nft.name} dos favoritos, ` : `Favoritar ${nft.name}, `}
          </span>
          <span data-testid={`favorite-likes-${nft.id}`}>{nft.likes}</span>
        </button>

        {isSoldOut ? (
          <span
            data-testid={`nft-availability-${nft.id}`}
            className="absolute bottom-2 left-3 rounded bg-red-950/90 px-2 py-0.5 text-[11px] font-bold text-red-200"
          >
            Esgotado
          </span>
        ) : (
          <span data-testid={`nft-availability-${nft.id}`} className="sr-only">
            {nft.available} disponíveis
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[6px]">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="text-[16px] font-normal leading-[16px] text-text-primary hover:text-accent-bright"
        >
          {nft.name}
        </Link>

        <div className="flex items-center gap-[12px] leading-[16px]">
          <span
            data-testid={`nft-price-${nft.id}`}
            className="text-[18px] font-bold text-accent-bright"
          >
            {formatEth(nft.priceFromEth)}
          </span>
          {showOriginalPrice ? (
            <span className="text-[18px] font-normal text-text-muted line-through">2.29 ETH</span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div data-testid="nft-card-skeleton" className="flex w-full flex-col gap-[12px]">
      <Skeleton className="h-[300px] w-full rounded-[6px]" />
      <Skeleton className="h-[16px] w-3/4 rounded-[4px]" />
      <Skeleton className="h-[18px] w-1/2 rounded-[4px]" />
    </div>
  )
}
