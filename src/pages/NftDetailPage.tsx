import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Heart,
  Layers,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { AppApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels, nftCategoryLabels, type NftEdition } from '@/contracts'
import { formatEth, mulEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { useCartMutations, useFavorites, useNftDetail, useToggleFavorite } from '@/state/queries'
import { useSession } from '@/state/session'

export function NftDetailPage({ nftId }: { nftId: string }) {
  const { status } = useSession()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const detailQuery = useNftDetail(nftId)
  const favoritesQuery = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const { addItem } = useCartMutations()

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (detailQuery.isLoading) {
    return (
      <div
        data-testid="nft-detail-skeleton"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <Skeleton className="h-9 w-40" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Skeleton className="aspect-square w-full" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="aspect-square w-full" />
            </div>
          </div>
          <div className="space-y-4 lg:col-span-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    const isNotFound = detailQuery.error instanceof AppApiError && detailQuery.error.status === 404
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Card
          role="alert"
          data-testid={isNotFound ? 'nft-not-found' : 'nft-detail-error'}
          className="p-10"
        >
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-white">
            {isNotFound ? 'NFT não encontrado' : 'Erro ao carregar o NFT'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isNotFound
              ? 'O identificador informado não corresponde a nenhum item disponível no acervo.'
              : detailQuery.error instanceof Error
                ? detailQuery.error.message
                : 'Ocorreu uma falha inesperada.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="secondary">
              <Link to="/">Voltar ao catálogo</Link>
            </Button>
            {!isNotFound ? (
              <Button onClick={() => void detailQuery.refetch()} data-testid="detail-retry-btn">
                Tentar novamente
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    )
  }

  const nft = detailQuery.data
  const isFavorite = favoritesQuery.data?.nftIds.includes(nft.id) ?? false
  const defaultEdition =
    nft.editions.find((edition) => edition.status === 'available') ?? nft.editions[0]!
  const activeEdition: NftEdition =
    nft.editions.find((edition) => edition.id === selectedEditionId) ?? defaultEdition

  const maxAllowed =
    activeEdition.status === 'available'
      ? Math.min(activeEdition.available, activeEdition.maxPerOrder)
      : 0
  const safeQuantity = maxAllowed > 0 ? Math.min(Math.max(1, quantity), maxAllowed) : 1
  const activeImage = nft.gallery[selectedImageIndex] ?? nft.image

  const handleSelectEdition = (edition: NftEdition) => {
    setSelectedEditionId(edition.id)
    const nextMax =
      edition.status === 'available' ? Math.min(edition.available, edition.maxPerOrder) : 1
    setQuantity((prev) => Math.min(Math.max(1, prev), Math.max(1, nextMax)))
  }

  const handleFavorite = () => {
    if (status !== 'authenticated') {
      saveReturnTo(`${routerState.location.pathname}${routerState.location.searchStr}`)
      void navigate({ to: '/login' })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, isFavorite })
  }

  const handleAddToCart = async (goToCart = false) => {
    if (activeEdition.status !== 'available' || maxAllowed === 0) return
    await addItem.mutateAsync({
      nftId: nft.id,
      editionId: activeEdition.id,
      quantity: safeQuantity,
    })
    if (goToCart) {
      void navigate({ to: '/cart' })
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar ao catálogo
          </Link>
        </Button>
        <Badge variant="default">Versão #{nft.version}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Card className="overflow-hidden">
            <div className="aspect-square w-full bg-bg-primary">
              <img
                src={activeImage.url}
                alt={activeImage.alt}
                width={activeImage.width}
                height={activeImage.height}
                fetchPriority="high"
                className="h-full w-full object-cover"
                data-testid="detail-main-image"
              />
            </div>
          </Card>

          <div
            role="group"
            aria-label="Galeria de imagens do NFT"
            className="mt-4 grid grid-cols-3 gap-3"
          >
            {nft.gallery.map((img, index) => {
              const isSelected = index === selectedImageIndex
              return (
                <button
                  key={img.url + index}
                  type="button"
                  data-testid={`gallery-thumb-${index}`}
                  aria-label={`Visualizar imagem ${index + 1} de ${nft.name}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-accent-bright ring-2 ring-accent-bright/40' : 'border-border-subtle opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    width={200}
                    height={200}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{nftCategoryLabels[nft.category]}</Badge>
            <Badge variant="accent">{networkLabels[nft.network]}</Badge>
            <Badge variant="default">{nft.tokenStandard}</Badge>
          </div>

          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 data-testid="detail-nft-title" className="text-3xl font-bold text-white sm:text-4xl">
                {nft.name}
              </h1>
              <p className="mt-1 font-mono text-sm text-text-secondary">
                Coleção: <span className="text-white">{nft.collection}</span>
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              data-testid="detail-favorite-btn"
              aria-pressed={isFavorite}
              onClick={handleFavorite}
            >
              <Heart
                className={`h-4 w-4 ${isFavorite ? 'fill-accent-bright text-accent-bright' : ''}`}
                aria-hidden="true"
              />
              <span data-testid="detail-favorite-count">{nft.likes}</span>
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-secondary p-3.5">
            <img
              src={nft.creator.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <span className="block text-xs text-text-muted">Criado por</span>
              <span className="font-mono text-sm font-semibold text-white">
                {nft.creator.displayName} (@{nft.creator.username})
              </span>
            </div>
          </div>

          <p className="mt-5 text-base leading-relaxed text-text-secondary">{nft.description}</p>

          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Layers className="h-4 w-4 text-accent-bright" aria-hidden="true" />
              Selecione a edição
            </h2>
            <div
              role="radiogroup"
              aria-label="Edições do NFT"
              className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {nft.editions.map((edition) => {
                const isSelected = edition.id === activeEdition.id
                const isAvailable = edition.status === 'available'
                return (
                  <button
                    key={edition.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`edition-option-${edition.id}`}
                    onClick={() => handleSelectEdition(edition)}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-accent-bright bg-accent/20 text-white'
                        : 'border-border-subtle bg-bg-secondary text-text-secondary hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">{edition.name}</span>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                      ) : null}
                    </div>
                    <p
                      data-testid={`edition-price-${edition.id}`}
                      className="mt-2 font-mono text-base font-bold text-white"
                    >
                      {formatEth(edition.priceEth)}
                    </p>
                    <div className="mt-2 text-xs font-mono">
                      {isAvailable ? (
                        <span className="text-emerald-300">
                          {edition.available}/{edition.supply} disponíveis (máx. {edition.maxPerOrder})
                        </span>
                      ) : edition.status === 'sold_out' ? (
                        <span className="text-red-300">Esgotada (0/{edition.supply})</span>
                      ) : (
                        <span className="text-amber-300">Edição indisponível</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Card className="mt-6 p-5">
            {activeEdition.status !== 'available' ? (
              <div
                role="status"
                data-testid="edition-unavailable-banner"
                className="rounded-xl border border-red-500/60 bg-red-950/60 p-4 text-sm text-red-100"
              >
                {activeEdition.status === 'sold_out'
                  ? 'Esta edição está esgotada no momento. Selecione outra edição disponível.'
                  : 'Esta edição está temporariamente indisponível para novas compras.'}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="block text-xs font-mono text-text-muted">Quantidade</span>
                    <span className="text-xs text-text-secondary">
                      Limite por pedido: {maxAllowed}{' '}
                      {maxAllowed === 1 ? 'unidade' : 'unidades'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      data-testid="detail-qty-decrease"
                      aria-label="Diminuir quantidade"
                      disabled={safeQuantity <= 1}
                      onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <span
                      data-testid="detail-qty-value"
                      aria-live="polite"
                      className="inline-flex h-11 min-w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-primary px-3 font-mono text-base font-bold text-white"
                    >
                      {safeQuantity}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      data-testid="detail-qty-increase"
                      aria-label="Aumentar quantidade"
                      disabled={safeQuantity >= maxAllowed}
                      onClick={() => setQuantity(Math.min(maxAllowed, safeQuantity + 1))}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4 font-mono">
                  <span className="text-sm text-text-secondary">Subtotal estimado</span>
                  <span data-testid="detail-subtotal" className="text-xl font-bold text-white">
                    {formatEth(mulEth(activeEdition.priceEth, safeQuantity))}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    size="lg"
                    data-testid="detail-add-to-cart"
                    disabled={addItem.isPending}
                    onClick={() => void handleAddToCart(false)}
                  >
                    <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                    {addItem.isPending ? 'Adicionando...' : 'Adicionar ao carrinho'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    data-testid="detail-buy-now"
                    disabled={addItem.isPending}
                    onClick={() => void handleAddToCart(true)}
                  >
                    <Zap className="h-5 w-5" aria-hidden="true" />
                    Comprar agora
                  </Button>
                </div>
              </>
            )}
          </Card>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-border-subtle bg-bg-secondary p-4 text-xs font-mono">
            <div>
              <dt className="text-text-muted">Contrato</dt>
              <dd className="mt-1 truncate text-white">{nft.contractAddress}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Autenticidade</dt>
              <dd className="mt-1 inline-flex items-center gap-1 text-emerald-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Verificado na rede {networkLabels[nft.network]}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            {nft.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-bg-secondary px-3 py-1 font-mono text-xs text-text-secondary"
              >
                <Sparkles className="h-3 w-3 text-accent-bright" aria-hidden="true" />#{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
