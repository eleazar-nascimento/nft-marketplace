import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { AppApiError } from '@/api/client'
import { NftDetailSkeleton } from '@/components/nft/NftDetailSkeleton'
import { NftDetailTabs } from '@/components/nft/NftDetailTabs'
import { RelatedNftsSection } from '@/components/nft/RelatedNftsSection'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { NftEdition } from '@/contracts'
import { formatEth, mulEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { formatTokenNumber } from '@/lib/validation'
import { useCartMutations, useFavorites, useNftDetail, useNftsList, useToggleFavorite } from '@/state/queries'
import { useSession } from '@/state/session'

export function NftDetailPage({ nftId }: { nftId: string }) {
  const { status } = useSession()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const detailQuery = useNftDetail(nftId)
  const relatedQuery = useNftsList({ page: 1, pageSize: 6 })
  const favoritesQuery = useFavorites()
  const toggleFavorite = useToggleFavorite()
  const { addItem } = useCartMutations()

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedEditionId, setSelectedEditionId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  if (detailQuery.isLoading) {
    return <NftDetailSkeleton />
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
          <h1 className="mt-4 text-2xl font-bold text-text-primary">
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
  const tokenNumber = formatTokenNumber(nft.id)
  const relatedItems = (relatedQuery.data?.items ?? []).filter((item) => item.id !== nft.id).slice(0, 5)

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
    <div className="mx-auto w-full max-w-300 px-4 pt-6 sm:px-6 lg:px-0">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold leading-4 text-text-primary">
          <Link to="/" className="hover:text-accent-bright">
            Início
          </Link>{' '}
          / Mercado
        </p>
        <Link
          to="/"
          className="inline-flex h-8.75 w-8.75 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7 lg:w-143.25 lg:shrink-0">
          <div
            role="group"
            aria-label="Galeria de imagens do NFT"
            className="flex flex-row gap-3 sm:w-25 sm:flex-col sm:gap-4"
          >
            {nft.gallery.slice(0, 4).map((img, index) => {
              const isSelected = index === selectedImageIndex
              return (
                <button
                  key={img.url + index}
                  type="button"
                  data-testid={`gallery-thumb-${index}`}
                  aria-label={`Visualizar imagem ${index + 1} de ${nft.name}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-19 w-19 overflow-hidden rounded-lg bg-bg-secondary transition-all sm:h-25 sm:w-25 cursor-pointer ${
                    isSelected ? 'border-2 border-accent' : 'border border-transparent opacity-85 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    width={100}
                    height={100}
                    className="h-full w-full rounded-lg object-cover"
                  />
                </button>
              )
            })}
          </div>

          <div className="relative flex aspect-square w-full items-center justify-center rounded-md bg-bg-secondary p-4 sm:h-111 sm:w-111">
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              width={404}
              height={404}
              fetchPriority="high"
              data-testid="detail-main-image"
              className="h-full w-full max-h-101 max-w-101 rounded-3xl object-cover"
            />
            <span
              className="pointer-events-none absolute right-4 top-4 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-bg-primary/80 text-text-primary"
              aria-hidden="true"
            >
              <Search className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4.5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <h1
                data-testid="detail-nft-title"
                className="text-[22px] font-bold leading-tight text-text-primary sm:text-[28px]"
              >
                {nft.name}
              </h1>
              <span className="inline-flex h-6.75 items-center gap-1 rounded-4xl border border-accent px-3 text-[14px] lg:hidden">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                <span className="font-medium text-text-primary">4.8</span>
                <span className="text-text-secondary">({nft.likes})</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                data-testid={`edition-price-${activeEdition.id}`}
                className="text-[22px] font-bold leading-4 text-accent-bright"
              >
                {formatEth(activeEdition.priceEth)}
              </p>

              <div className="hidden items-center gap-1 lg:flex">
                <Star className="h-3.75 w-3.75 fill-accent text-accent" aria-hidden="true" />
                <Star className="h-3.75 w-3.75 fill-accent text-accent" aria-hidden="true" />
                <Star className="h-3.75 w-3.75 fill-accent text-accent" aria-hidden="true" />
                <Star className="h-3.75 w-3.75 fill-accent text-accent" aria-hidden="true" />
                <Star className="h-3.75 w-3.75 text-text-muted" aria-hidden="true" />
                <span className="ml-1 text-[15px] text-text-primary">
                  {nft.likes} avaliações de colecionadores
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-accent/35" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-[15px] font-bold leading-4 text-text-primary">Sobre este NFT:</h2>
            <p className="text-[14px] leading-6 text-text-secondary">{nft.description}</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 className="text-[15px] font-bold leading-4 text-text-primary">Edição:</h2>
            <div
              role="radiogroup"
              aria-label="Edições do NFT"
              className="flex flex-wrap items-center gap-2"
            >
              {nft.editions.map((edition) => {
                const isSelected = edition.id === activeEdition.id
                return (
                  <button
                    key={edition.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`edition-option-${edition.id}`}
                    onClick={() => handleSelectEdition(edition)}
                    className={`inline-flex h-7 min-w-10.5 items-center justify-center rounded-full border px-3 text-[14px] leading-4 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-accent font-medium text-accent-bright'
                        : 'border-border-subtle font-normal text-text-secondary hover:border-accent/60'
                    }`}
                  >
                    <span>{edition.name}</span>
                    {edition.id !== activeEdition.id ? (
                      <span data-testid={`edition-price-${edition.id}`} className="sr-only">
                        {formatEth(edition.priceEth)}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          {activeEdition.status !== 'available' ? (
            <div
              role="status"
              data-testid="edition-unavailable-banner"
              className="rounded-md border border-red-500/60 bg-red-950/60 p-3 text-sm text-red-100"
            >
              {activeEdition.status === 'sold_out'
                ? 'Esta edição está esgotada no momento. Selecione outra edição disponível.'
                : 'Esta edição está temporariamente indisponível para novas compras.'}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="detail-qty-decrease"
                  aria-label="Diminuir quantidade"
                  disabled={safeQuantity <= 1}
                  onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
                  className="flex h-[49.5px] w-8.25 items-center justify-center rounded-[33px] border border-bg-primary bg-accent text-bg-primary shadow disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span
                  data-testid="detail-qty-value"
                  aria-live="polite"
                  className="min-w-5 text-center text-[20px] leading-7 text-text-primary"
                >
                  {safeQuantity}
                </span>
                <button
                  type="button"
                  data-testid="detail-qty-increase"
                  aria-label="Aumentar quantidade"
                  disabled={safeQuantity >= maxAllowed}
                  onClick={() => setQuantity(Math.min(maxAllowed, safeQuantity + 1))}
                  className="flex h-[49.5px] w-8.25 items-center justify-center rounded-[33px] border border-bg-primary bg-accent text-bg-primary shadow disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span data-testid="detail-subtotal" className="sr-only">
                  {formatEth(mulEth(activeEdition.priceEth, safeQuantity))}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="detail-buy-now"
                  disabled={addItem.isPending}
                  onClick={() => void handleAddToCart(true)}
                  className="inline-flex h-10 w-32.5 items-center justify-center rounded-md bg-accent text-[14px] font-bold leading-5 text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  COMPRAR
                </button>

                <button
                  type="button"
                  data-testid="detail-add-to-cart"
                  aria-label="Adicionar ao carrinho"
                  disabled={addItem.isPending}
                  onClick={() => void handleAddToCart(false)}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-border-subtle bg-bg-secondary px-3 text-[13px] font-medium text-text-primary hover:border-accent disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                  <span>Carrinho</span>
                </button>

                {status === 'authenticated' ? (
                  <button
                    type="button"
                    data-testid="detail-favorite-btn"
                    aria-pressed={isFavorite}
                    onClick={handleFavorite}
                    className="inline-flex h-10 min-w-32.5 items-center justify-center gap-2 rounded-md border border-accent px-3 text-[14px] font-medium leading-5 text-accent-bright hover:bg-accent/15 cursor-pointer"
                  >
                    <Heart
                      className={`h-4.5 w-4.5 ${isFavorite ? 'fill-accent-bright text-accent-bright' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Favoritar</span>
                    <span className="text-xs">
                      (<span data-testid="detail-favorite-count">{nft.likes}</span>)
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 text-[15px] text-text-muted">
            <div className="flex flex-col gap-3 leading-normal">
              <p>ID do token: #{tokenNumber}</p>
              <p>Coleção: {nft.collection}</p>
              <p>Atributos: Óculos, Esmeralda, Raro</p>
            </div>
            <div className="flex items-center gap-2 text-text-primary">
              <span className="text-[15px] font-bold leading-4 whitespace-nowrap">
                Compartilhar este NFT:
              </span>
              <img
                src="/images/figma/share-linkedin.svg"
                alt="Compartilhar no LinkedIn"
                width={15}
                height={14}
                className="h-[14.375px] w-3.75 shrink-0"
              />
              <img
                src="/images/figma/share-message.svg"
                alt="Compartilhar por mensagem"
                width={18}
                height={18}
                className="h-4.5 w-4.5 shrink-0"
              />
              <img
                src="/images/figma/share-twitter.svg"
                alt="Compartilhar no Twitter"
                width={16}
                height={12}
                className="h-[12.191px] w-[15.966px] shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      <NftDetailTabs nft={nft} />
      <RelatedNftsSection
        headingId="related-heading"
        title="Mais desta coleção"
        items={relatedItems}
      />
    </div>
  )
}
