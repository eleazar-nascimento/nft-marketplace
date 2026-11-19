import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { NftCard, NftCardSkeleton } from '@/components/nft/NftCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFavorites, useNftsList } from '@/state/queries'

export function FavoritesPage() {
  const favoritesQuery = useFavorites()
  const catalogQuery = useNftsList({ page: 1, pageSize: 48 })

  const favoriteIds = new Set(favoritesQuery.data?.nftIds ?? [])
  const favoriteNfts = (catalogQuery.data?.items ?? []).filter((nft) => favoriteIds.has(nft.id))
  const isLoading = favoritesQuery.isLoading || catalogQuery.isLoading

  return (
    <div
      data-testid="favorites-page"
      className="mx-auto w-full max-w-300 px-4 pt-6 pb-6 sm:px-6 lg:pt-8 lg:pb-12 xl:px-0"
    >
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-2.5">
          <Heart className="h-5 w-5 text-accent-bright" aria-hidden="true" />
          <h1 className="text-[18px] font-bold text-text-primary lg:text-[22px]">Favoritos</h1>
        </div>
        <span data-testid="favorites-count-badge" className="text-xs text-text-secondary">
          {favoriteNfts.length} {favoriteNfts.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8 lg:grid-cols-3 lg:gap-8 lg:pb-0">
          {Array.from({ length: 4 }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      ) : favoriteNfts.length === 0 ? (
        <Card data-testid="favorites-empty-state" className="mx-auto max-w-xl p-10 text-center">
          <Heart className="mx-auto h-11 w-11 text-accent-bright" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-text-primary">Nenhum NFT favoritado</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Toque no coração em qualquer NFT para salvá-lo na sua lista de favoritos.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </Card>
      ) : (
        <div
          data-testid="favorites-grid"
          className="grid grid-cols-2 gap-x-4 gap-y-6 pb-8 lg:grid-cols-3 lg:gap-8 lg:pb-0"
        >
          {favoriteNfts.map((nft, index) => (
            <NftCard key={nft.id} nft={nft} isFavorite priority={index < 3} />
          ))}
        </div>
      )}
    </div>
  )
}
