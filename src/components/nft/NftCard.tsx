import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart, Search } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { type NftSummary } from '@/contracts'
import { formatEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { useCartMutations, useToggleFavorite } from '@/state/queries'
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
  const { addItem } = useCartMutations()

  const handleFavorite = () => {
    if (status !== 'authenticated') {
      saveReturnTo(`${routerState.location.pathname}${routerState.location.searchStr}`)
      void navigate({ to: '/login' })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, isFavorite })
  }

  const handleQuickAddToCart = () => {
    if (nft.available <= 0) {
      void navigate({ to: '/nft/$nftId', params: { nftId: nft.id } })
      return
    }
    addItem.mutate({
      nftId: nft.id,
      editionId: `${nft.id}_ed1`,
      quantity: 1,
    })
  }

  const isSoldOut = nft.available === 0
  const showOriginalPrice = nft.id === 'nft_003'

  return (
    <article
      data-testid={`nft-card-${nft.id}`}
      className="group flex w-full flex-col gap-2.5 even:translate-y-7 sm:gap-3 lg:even:translate-y-0"
    >
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-bg-secondary p-1.5 sm:aspect-auto sm:h-75 sm:rounded-md sm:p-1">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-accent transition-opacity duration-200 ${
            isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          }`}
        />

        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="relative block h-full w-full overflow-hidden rounded-[14px] sm:h-62.5 sm:max-w-62.5 sm:rounded-[15px]"
        >
          <img
            src={nft.image.url}
            alt={nft.image.alt}
            width={nft.image.width}
            height={nft.image.height}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="h-full w-full rounded-[14px] object-cover transition-transform duration-300 group-hover:scale-105 sm:rounded-[15px]"
          />
        </Link>

        {nft.id === 'nft_003' ? (
          <span className="pointer-events-none absolute left-0 top-4 bg-accent px-2.5 py-1 text-[12px] font-medium leading-4 text-bg-primary">
            RARO
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleFavorite}
          data-testid={`mobile-favorite-btn-${nft.id}`}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-accent/60 bg-bg-primary/80 text-accent-bright backdrop-blur-xs lg:hidden cursor-pointer"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite ? 'fill-accent-bright text-accent-bright' : 'text-accent-bright'}`}
            aria-hidden="true"
          />
        </button>

        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2.5 lg:flex">
          <button
            type="button"
            onClick={handleQuickAddToCart}
            disabled={addItem.isPending}
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            className="pointer-events-none inline-flex h-8.75 w-8.75 items-center justify-center rounded-sm bg-bg-secondary text-text-primary opacity-0 shadow-md transition-opacity duration-200 hover:text-accent-bright group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 cursor-pointer"
          >
            <img
              src="/images/figma/cart-icon.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </button>

          <button
            type="button"
            onClick={handleFavorite}
            data-testid={`favorite-btn-${nft.id}`}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            className={`inline-flex h-8.75 w-8.75 items-center justify-center rounded-sm bg-bg-secondary text-text-primary shadow-md transition-opacity duration-200 hover:text-accent-bright cursor-pointer ${
              isFavorite
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'
            }`}
          >
            <Heart
              className={`h-5 w-5 ${
                isFavorite ? 'fill-accent-bright text-accent-bright' : 'text-text-primary'
              }`}
              aria-hidden="true"
            />
            <span data-testid={`favorite-likes-${nft.id}`} className="sr-only">
              {nft.likes}
            </span>
          </button>

          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            aria-label={`Ver detalhes de ${nft.name}`}
            className="pointer-events-none inline-flex h-8.75 w-8.75 items-center justify-center rounded-sm bg-bg-secondary text-text-primary opacity-0 shadow-md transition-opacity duration-200 hover:text-accent-bright group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        {isSoldOut ? (
          <span
            data-testid={`nft-availability-${nft.id}`}
            className="absolute left-3 top-3 rounded bg-red-950/90 px-2 py-0.5 text-[11px] font-bold text-red-200"
          >
            Esgotado
          </span>
        ) : (
          <span data-testid={`nft-availability-${nft.id}`} className="sr-only">
            {nft.available} disponíveis
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="text-[14px] font-normal leading-4 text-text-primary hover:text-accent-bright sm:text-[16px]"
        >
          {nft.name}
        </Link>

        <div className="flex items-center gap-3 leading-4">
          <span
            data-testid={`nft-price-${nft.id}`}
            className="text-[15px] font-bold text-accent-bright sm:text-[18px]"
          >
            {formatEth(nft.priceFromEth)}
          </span>
          {showOriginalPrice ? (
            <span className="text-[14px] font-normal text-text-muted line-through sm:text-[18px]">
              2.29 ETH
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div data-testid="nft-card-skeleton" className="flex w-full flex-col gap-3">
      <Skeleton className="h-75 w-full rounded-md" />
      <Skeleton className="h-4 w-3/4 rounded-sm" />
      <Skeleton className="h-4.5 w-1/2 rounded-sm" />
    </div>
  )
}
