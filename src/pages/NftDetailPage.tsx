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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels, type NftEdition } from '@/contracts'
import { formatEth, mulEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
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
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')

  if (detailQuery.isLoading) {
    return (
      <div
        data-testid="nft-detail-skeleton"
        className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-0"
      >
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Skeleton className="h-[444px] w-full" />
          </div>
          <div className="space-y-4 lg:col-span-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
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
  const tokenNumber = nft.id.replace(/\D/g, '').padStart(4, '0')
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
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-0">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-bold leading-[16px] text-text-primary">
          <Link to="/" className="hover:text-accent-bright">
            Início
          </Link>{' '}
          / Mercado
        </p>
        <Link
          to="/"
          className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-[32px] lg:flex-row lg:items-start">
        <div className="flex flex-col-reverse gap-[16px] sm:flex-row sm:gap-[28px] lg:w-[573px] lg:shrink-0">
          <div
            role="group"
            aria-label="Galeria de imagens do NFT"
            className="flex flex-row gap-[12px] sm:w-[100px] sm:flex-col sm:gap-[16px]"
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
                  className={`h-[76px] w-[76px] overflow-hidden rounded-[8px] bg-bg-secondary transition-all sm:h-[100px] sm:w-[100px] cursor-pointer ${
                    isSelected ? 'border-2 border-accent' : 'border border-transparent opacity-85 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    width={100}
                    height={100}
                    className="h-full w-full rounded-[8px] object-cover"
                  />
                </button>
              )
            })}
          </div>

          <div className="relative flex aspect-square w-full items-center justify-center rounded-[6px] bg-bg-secondary p-[16px] sm:h-[444px] sm:w-[444px]">
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              width={404}
              height={404}
              fetchPriority="high"
              data-testid="detail-main-image"
              className="h-full w-full max-h-[404px] max-w-[404px] rounded-[24px] object-cover"
            />
            <span
              className="pointer-events-none absolute right-4 top-4 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-bg-primary/80 text-text-primary"
              aria-hidden="true"
            >
              <Search className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-[18px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between gap-4">
              <h1
                data-testid="detail-nft-title"
                className="text-[22px] font-bold leading-tight text-text-primary sm:text-[28px]"
              >
                {nft.name}
              </h1>
              <span className="inline-flex h-[27px] items-center gap-1 rounded-[32px] border border-accent px-3 text-[14px] lg:hidden">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                <span className="font-medium text-text-primary">4.8</span>
                <span className="text-text-secondary">({nft.likes})</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                data-testid={`edition-price-${activeEdition.id}`}
                className="text-[22px] font-bold leading-[16px] text-accent-bright"
              >
                {formatEth(activeEdition.priceEth)}
              </p>

              <div className="hidden items-center gap-[4px] lg:flex">
                <Star className="h-[15px] w-[15px] fill-accent text-accent" aria-hidden="true" />
                <Star className="h-[15px] w-[15px] fill-accent text-accent" aria-hidden="true" />
                <Star className="h-[15px] w-[15px] fill-accent text-accent" aria-hidden="true" />
                <Star className="h-[15px] w-[15px] fill-accent text-accent" aria-hidden="true" />
                <Star className="h-[15px] w-[15px] text-text-muted" aria-hidden="true" />
                <span className="ml-1 text-[15px] text-text-primary">
                  {nft.likes} avaliações de colecionadores
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-accent/35" />
          </div>

          <div className="flex flex-col gap-[8px]">
            <h2 className="text-[15px] font-bold leading-[16px] text-text-primary">Sobre este NFT:</h2>
            <p className="text-[14px] leading-[24px] text-text-secondary">{nft.description}</p>
          </div>

          <div className="flex flex-col gap-[10px]">
            <h2 className="text-[15px] font-bold leading-[16px] text-text-primary">Edição:</h2>
            <div
              role="radiogroup"
              aria-label="Edições do NFT"
              className="flex flex-wrap items-center gap-[8px]"
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
                    className={`inline-flex h-[28px] min-w-[42px] items-center justify-center rounded-full border px-3 text-[14px] leading-[16px] transition-colors cursor-pointer ${
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
              className="rounded-[6px] border border-red-500/60 bg-red-950/60 p-3 text-sm text-red-100"
            >
              {activeEdition.status === 'sold_out'
                ? 'Esta edição está esgotada no momento. Selecione outra edição disponível.'
                : 'Esta edição está temporariamente indisponível para novas compras.'}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-[12px]">
                <button
                  type="button"
                  data-testid="detail-qty-decrease"
                  aria-label="Diminuir quantidade"
                  disabled={safeQuantity <= 1}
                  onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
                  className="flex h-[49.5px] w-[33px] items-center justify-center rounded-[33px] border border-bg-primary bg-accent text-bg-primary shadow disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span
                  data-testid="detail-qty-value"
                  aria-live="polite"
                  className="min-w-[20px] text-center text-[20px] leading-[28px] text-text-primary"
                >
                  {safeQuantity}
                </span>
                <button
                  type="button"
                  data-testid="detail-qty-increase"
                  aria-label="Aumentar quantidade"
                  disabled={safeQuantity >= maxAllowed}
                  onClick={() => setQuantity(Math.min(maxAllowed, safeQuantity + 1))}
                  className="flex h-[49.5px] w-[33px] items-center justify-center rounded-[33px] border border-bg-primary bg-accent text-bg-primary shadow disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span data-testid="detail-subtotal" className="sr-only">
                  {formatEth(mulEth(activeEdition.priceEth, safeQuantity))}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-[8px]">
                <button
                  type="button"
                  data-testid="detail-buy-now"
                  disabled={addItem.isPending}
                  onClick={() => void handleAddToCart(true)}
                  className="inline-flex h-[40px] w-[130px] items-center justify-center rounded-[6px] bg-accent text-[14px] font-bold leading-[20px] text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                >
                  COMPRAR
                </button>

                <button
                  type="button"
                  data-testid="detail-add-to-cart"
                  aria-label="Adicionar ao carrinho"
                  disabled={addItem.isPending}
                  onClick={() => void handleAddToCart(false)}
                  className="inline-flex h-[40px] items-center justify-center gap-1.5 rounded-[6px] border border-border-subtle bg-bg-secondary px-3 text-[13px] font-medium text-text-primary hover:border-accent disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                  <span>Carrinho</span>
                </button>

                <button
                  type="button"
                  data-testid="detail-favorite-btn"
                  aria-pressed={isFavorite}
                  onClick={handleFavorite}
                  className="inline-flex h-[40px] min-w-[130px] items-center justify-center gap-[8px] rounded-[6px] border border-accent px-3 text-[14px] font-medium leading-[20px] text-accent-bright hover:bg-accent/15 cursor-pointer"
                >
                  <Heart
                    className={`h-[18px] w-[18px] ${isFavorite ? 'fill-accent-bright text-accent-bright' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Favoritar</span>
                  <span data-testid="detail-favorite-count" className="text-xs">
                    ({nft.likes})
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-[10px] text-[15px] text-text-muted">
            <p>ID do token: #{tokenNumber}</p>
            <p>Coleção: {nft.collection}</p>
            <p>Atributos: Óculos, Esmeralda, Raro</p>
            <div className="flex items-center gap-[10px] pt-1 text-text-primary">
              <span className="font-bold">Compartilhar este NFT:</span>
              <span className="text-xs text-text-secondary">in</span>
              <span className="text-xs text-text-secondary">✉</span>
              <span className="text-xs text-text-secondary">𝕏</span>
            </div>
          </div>
        </div>
      </div>

      <section aria-label="Informações e avaliações do NFT" className="mt-[56px]">
        <div className="flex items-center gap-[32px] border-b border-border-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`relative pb-3 text-[17px] cursor-pointer ${
              activeTab === 'details' ? 'font-bold text-accent-bright' : 'text-text-primary'
            }`}
          >
            Detalhes do NFT
            {activeTab === 'details' ? (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`relative pb-3 text-[17px] cursor-pointer ${
              activeTab === 'reviews' ? 'font-bold text-accent-bright' : 'text-text-primary'
            }`}
          >
            Avaliações de colecionadores ({nft.likes})
            {activeTab === 'reviews' ? (
              <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-accent" />
            ) : null}
          </button>
        </div>

        <div className="mt-6 space-y-5 text-[14px] leading-[24px] text-text-secondary">
          <p>
            {nft.name} é uma obra digital 1/50 finalizada à mão da coleção {nft.collection}. Cada atributo
            fica armazenado nos metadados do token e verificado na {networkLabels[nft.network]}. A obra
            explora identidade, movimento e luz em um mundo digital sem fronteiras.
          </p>
          <p>
            A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um
            registro permanente de procedência registrada na rede. {nft.creator.displayName} recebe 5% de
            direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.
          </p>

          <div>
            <h3 className="font-bold text-text-primary">Rede:</h3>
            <p>Cunhado na {networkLabels[nft.network]} com procedência imutável e metadados armazenados no IPFS.</p>
          </div>

          <div>
            <h3 className="font-bold text-text-primary">Contrato:</h3>
            <p>
              Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados
              compatíveis.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-text-primary">Direitos autorais:</h3>
            <p>
              {nft.contractAddress.slice(0, 6)}...{nft.contractAddress.slice(-4)} • Contrato inteligente{' '}
              {nft.tokenStandard} verificado.
            </p>
          </div>
        </div>
      </section>

      {relatedItems.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-[64px]">
          <h2 id="related-heading" className="text-[17px] font-bold text-accent-bright">
            Mais desta coleção
          </h2>
          <div className="mt-3 h-px w-full bg-border-subtle" />
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {relatedItems.map((item) => (
              <Link
                key={item.id}
                to="/nft/$nftId"
                params={{ nftId: item.id }}
                className="group flex flex-col gap-2"
              >
                <div className="flex aspect-square items-center justify-center rounded-[6px] bg-bg-secondary p-2">
                  <img
                    src={item.image.url}
                    alt={item.image.alt}
                    width={190}
                    height={190}
                    loading="lazy"
                    className="h-full w-full rounded-[12px] object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <span className="text-[15px] text-text-primary group-hover:text-accent-bright">
                  {item.name}
                </span>
                <span className="text-[16px] font-bold text-accent-bright">
                  {formatEth(item.priceFromEth)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
