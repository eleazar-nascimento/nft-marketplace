import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowRight, ChevronRight, Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NftCard, NftCardSkeleton } from '@/components/nft/NftCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogTitle, DrawerContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  networkLabels,
  networks,
  nftCategories,
  nftCategoryCounts,
  nftCategoryLabels,
  nftSortLabels,
  nftSorts,
  type AvailabilityFilter,
  type Network,
  type NftCategory,
  type NftListQuery,
  type NftSort,
} from '@/contracts'
import { useFavorites, useNftsList } from '@/state/queries'

export interface HomeSearchState {
  q?: string
  category?: NftCategory[]
  network?: Network
  minPrice?: string
  maxPrice?: string
  availability?: AvailabilityFilter
  sort?: NftSort
  page?: number
}

interface HomePageProps {
  search: HomeSearchState
  onUpdateSearch: (next: Partial<HomeSearchState>, resetPage?: boolean) => void
  onResetFilters: () => void
}

const networkCounts: Record<Network, number> = {
  ethereum: 119,
  polygon: 78,
  base: 86,
}

const blogPosts = [
  {
    id: 'blog-1',
    meta: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/figma/9add2.jpg',
  },
  {
    id: 'blog-2',
    meta: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/figma/8f387.jpg',
  },
  {
    id: 'blog-3',
    meta: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/figma/83794.jpg',
  },
  {
    id: 'blog-4',
    meta: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/figma/b7cfc.jpg',
  },
]

export function HomePage({ search, onUpdateSearch, onResetFilters }: HomePageProps) {
  const [searchInput, setSearchInput] = useState(search.q ?? '')
  const [minPriceInput, setMinPriceInput] = useState(search.minPrice ?? '')
  const [maxPriceInput, setMaxPriceInput] = useState(search.maxPrice ?? '')
  const [priceError, setPriceError] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'new' | 'trending'>('all')

  const queryParams: NftListQuery = {
    q: search.q,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    availability: search.availability,
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
  }

  const catalogQuery = useNftsList(queryParams)
  const favoritesQuery = useFavorites()
  const favoriteSet = new Set(favoritesQuery.data?.nftIds ?? [])

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault()
    onUpdateSearch({ q: searchInput.trim() || undefined }, true)
  }

  const toggleCategory = (category: NftCategory) => {
    const current = new Set(search.category ?? [])
    if (current.has(category)) {
      current.delete(category)
    } else {
      current.add(category)
    }
    const next = Array.from(current)
    onUpdateSearch({ category: next.length > 0 ? next : undefined }, true)
  }

  const applyPriceRange = () => {
    const min = minPriceInput.trim()
    const max = maxPriceInput.trim()
    const validPattern = /^\d+(\.\d+)?$/
    if ((min && !validPattern.test(min)) || (max && !validPattern.test(max))) {
      setPriceError('Use valores numéricos válidos em ETH (ex.: 0.5).')
      return
    }
    if (min && max && Number(min) > Number(max)) {
      setPriceError('O preço mínimo não pode ser maior que o máximo.')
      return
    }
    setPriceError(null)
    onUpdateSearch(
      {
        minPrice: min || undefined,
        maxPrice: max || undefined,
      },
      true,
    )
  }

  const activeFilterCount =
    (search.category?.length ?? 0) +
    (search.network ? 1 : 0) +
    (search.minPrice ? 1 : 0) +
    (search.maxPrice ? 1 : 0) +
    (search.availability === 'available' ? 1 : 0) +
    (search.q ? 1 : 0)

  const renderFilterControls = (idPrefix: string) => (
    <div className="flex flex-col gap-[36px]">
      <div className="flex flex-col gap-[12px]">
        <h3 className="text-[18px] font-bold leading-[16px] text-text-primary">Coleções</h3>
        <div className="flex flex-col px-[12px]">
          {nftCategories.map((cat) => {
            const selected = search.category?.includes(cat) ?? false
            return (
              <button
                key={cat}
                type="button"
                data-testid={`${idPrefix}-category-${cat}`}
                aria-pressed={selected}
                onClick={() => toggleCategory(cat)}
                className={`flex w-full items-center justify-between text-left text-[15px] leading-[40px] transition-colors cursor-pointer ${
                  selected ? 'font-bold text-accent-bright' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{nftCategoryLabels[cat]}</span>
                <span className="font-bold">({nftCategoryCounts[cat]})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-[12px]">
        <h3 className="text-[18px] font-bold leading-[16px] text-text-primary">Faixa de preço</h3>
        <div className="flex flex-col gap-[12px] pl-[12px]">
          <div className="flex items-center">
            <span className="h-[15px] w-[15px] rounded-full bg-accent" />
            <span className="h-[4px] flex-1 bg-accent" />
            <span className="h-[15px] w-[15px] rounded-full bg-accent" />
            <span className="h-[4px] w-12 bg-accent/30" />
          </div>

          <p className="text-[15px] text-text-primary">
            Preço: {minPriceInput || '0,02'} - {maxPriceInput || '12,30'} ETH
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`${idPrefix}-min-price`} className="sr-only">
                Preço mínimo em ETH
              </Label>
              <Input
                id={`${idPrefix}-min-price`}
                data-testid={`${idPrefix}-min-price`}
                placeholder="Mín (0.02)"
                value={minPriceInput}
                onChange={(event) => setMinPriceInput(event.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label htmlFor={`${idPrefix}-max-price`} className="sr-only">
                Preço máximo em ETH
              </Label>
              <Input
                id={`${idPrefix}-max-price`}
                data-testid={`${idPrefix}-max-price`}
                placeholder="Máx (12.30)"
                value={maxPriceInput}
                onChange={(event) => setMaxPriceInput(event.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {priceError ? (
            <p role="alert" className="text-xs text-red-400">
              {priceError}
            </p>
          ) : null}

          <div>
            <button
              type="button"
              data-testid={`${idPrefix}-apply-price`}
              onClick={applyPriceRange}
              className="inline-flex h-[36px] items-center justify-center rounded-[6px] bg-accent px-[16px] py-[8px] text-[16px] font-bold leading-[20px] text-bg-primary hover:bg-accent-hover cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[12px]">
        <Label htmlFor={`${idPrefix}-network-select`} className="text-[18px] font-bold leading-[16px] text-text-primary">
          Rede
        </Label>
        <select
          id={`${idPrefix}-network-select`}
          data-testid={`${idPrefix}-network-select`}
          value={search.network ?? ''}
          onChange={(event) =>
            onUpdateSearch({ network: (event.target.value || undefined) as Network | undefined }, true)
          }
          className="h-[38px] w-full rounded-[4px] border border-border-subtle bg-bg-primary px-3 text-xs text-text-primary"
        >
          <option value="">Todas as redes</option>
          {networks.map((net) => (
            <option key={net} value={net}>
              {networkLabels[net]}
            </option>
          ))}
        </select>

        <div className="flex flex-col pl-[12px] text-[15px] leading-[40px] text-text-secondary">
          {networks.map((net) => {
            const active = search.network === net
            const displayLabel = net === 'base' ? 'Solana' : networkLabels[net]
            return (
              <button
                key={net}
                type="button"
                onClick={() => onUpdateSearch({ network: active ? undefined : net }, true)}
                className={`flex w-full items-center justify-between text-left cursor-pointer ${
                  active ? 'font-bold text-accent-bright' : 'hover:text-text-primary'
                }`}
              >
                <span>{displayLabel}</span>
                <span>({networkCounts[net]})</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3 pl-[12px]">
        <Label htmlFor={`${idPrefix}-only-available`} className="cursor-pointer text-xs text-text-secondary">
          Apenas disponíveis
        </Label>
        <input
          id={`${idPrefix}-only-available`}
          data-testid={`${idPrefix}-only-available`}
          type="checkbox"
          checked={search.availability === 'available'}
          onChange={(event) =>
            onUpdateSearch({ availability: event.target.checked ? 'available' : undefined }, true)
          }
          className="h-4 w-4 accent-accent cursor-pointer"
        />
      </div>

      {activeFilterCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          data-testid={`${idPrefix}-clear-filters`}
          className="w-full"
          onClick={() => {
            setPriceError(null)
            onResetFilters()
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpar filtros ({activeFilterCount})
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-4 sm:px-6 lg:px-0">
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <form onSubmit={handleSearchSubmit} className="relative flex-1" role="search">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-[45px] w-full rounded-[10px] bg-bg-secondary pl-10 pr-4 text-[14px] font-bold text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </form>
        <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <button
            type="button"
            data-testid="mobile-filters-trigger"
            aria-label="Abrir filtros"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-accent/60 to-accent text-bg-primary cursor-pointer"
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
          <DrawerContent closeLabel="Fechar filtros">
            <DialogTitle className="flex items-center gap-2 font-mono text-text-primary">
              <Filter className="h-5 w-5 text-accent-bright" aria-hidden="true" />
              Filtros
            </DialogTitle>
            <div className="mt-6">{renderFilterControls('mobile')}</div>
          </DrawerContent>
        </Dialog>
      </div>

      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-[12px] bg-gradient-to-br from-bg-secondary via-bg-elevated to-surface-dark p-5 lg:h-[450px] lg:rounded-none lg:bg-none lg:bg-bg-secondary/40 lg:pl-[40px] lg:pr-0 lg:py-0"
      >
        <div className="flex flex-col items-center justify-between gap-6 lg:h-full lg:flex-row">
          <div className="flex w-full flex-col justify-between lg:w-[600px]">
            <div className="flex flex-col gap-[24px] lg:gap-[32px]">
              <div className="flex flex-col gap-[8px]">
                <p className="text-[12px] font-medium tracking-[1.4px] text-text-primary lg:text-[14px]">
                  Bem-vindo à Kurio
                </p>
                <h1
                  id="hero-heading"
                  className="text-[22px] font-bold leading-[30px] text-text-primary sm:text-[34px] sm:leading-[44px] lg:text-[43px] lg:leading-[64px]"
                >
                  SEJA DONO DO FUTURO
                  <br />
                  DA ARTE DIGITAL
                </h1>
                <p className="max-w-[557px] text-[12px] leading-[18px] text-text-secondary lg:text-[14px] lg:leading-[24px]">
                  Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
                  rara, apoie artistas e tenha uma parte da cultura da internet.
                </p>
              </div>

              <div>
                <a
                  href="#catalogo-section"
                  className="inline-flex h-[40px] w-[140px] items-center justify-center rounded-[6px] bg-accent text-[16px] font-bold leading-[20px] text-bg-primary hover:bg-accent-hover"
                >
                  EXPLORAR
                </a>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 lg:mt-10 lg:justify-end">
              <span className="h-[8px] w-[8px] rounded-full bg-accent" />
              <span className="h-[8px] w-[8px] rounded-full bg-accent/40" />
              <span className="h-[8px] w-[8px] rounded-full bg-accent/40" />
            </div>
          </div>

          <Link
            to="/nft/$nftId"
            params={{ nftId: 'nft_001' }}
            data-testid="hero-featured-card"
            className="relative block h-[220px] w-[220px] shrink-0 overflow-hidden rounded-[24px] sm:h-[320px] sm:w-[320px] lg:h-[450px] lg:w-[450px]"
          >
            <img
              src="/images/figma/8f387.jpg"
              alt="Emerald Ape #042 em destaque na Kurio"
              width={450}
              height={450}
              fetchPriority="high"
              className="h-full w-full rounded-[24px] object-cover"
            />
          </Link>
        </div>
      </section>

      <section id="catalogo-section" aria-labelledby="catalog-heading" className="mt-[46px]">
        <h2 id="catalog-heading" className="sr-only">
          Catálogo de NFTs
        </h2>

        <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2" role="search">
          <div className="relative flex-1">
            <Label htmlFor="catalog-search-input" className="sr-only">
              Buscar por nome, coleção ou artista
            </Label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              id="catalog-search-input"
              data-testid="catalog-search-input"
              type="search"
              placeholder="Explorar coleções, NFTs ou criadores..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="bg-bg-secondary pl-10 pr-9"
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchInput('')
                  onUpdateSearch({ q: undefined }, true)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <Button type="submit" data-testid="catalog-search-submit">
            Buscar
          </Button>
        </form>

        <div className="flex flex-col items-start gap-[48px] lg:flex-row">
          <aside aria-label="Filtros do catálogo" className="hidden w-[310px] shrink-0 flex-col gap-[24px] lg:flex">
            <div className="w-[310px] bg-bg-secondary p-[20px]">
              {renderFilterControls('desktop')}
            </div>

            <div className="relative flex h-[470px] w-[310px] flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-accent/10 to-accent/5 pt-[24px] pb-[4px]">
              <div className="flex flex-col items-center gap-[12px] px-[20px] text-center">
                <p className="text-[24px] font-bold leading-[32px] text-accent-bright">NFT EM DESTAQUE</p>
                <p className="text-[22px] font-bold leading-[16px] text-text-primary">OFERTA LIMITADA</p>
              </div>
              <Link
                to="/nft/$nftId"
                params={{ nftId: 'nft_002' }}
                className="block h-[368px] w-full overflow-hidden rounded-[22px]"
              >
                <img
                  src="/images/figma/83794.jpg"
                  alt="Sage Nomad #009 em oferta limitada"
                  width={310}
                  height={368}
                  loading="lazy"
                  className="h-full w-full rounded-[22px] object-cover"
                />
              </Link>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-[20px] text-[15px] font-medium leading-[16px]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedTab('all')
                    onUpdateSearch({ sort: 'recent' }, true)
                  }}
                  className={`relative pb-3 cursor-pointer ${
                    activeFeedTab === 'all' ? 'font-bold text-accent-bright' : 'text-text-primary hover:text-accent-bright'
                  }`}
                >
                  Todos os NFTs
                  {activeFeedTab === 'all' ? (
                    <span className="absolute bottom-[-12px] left-0 right-0 h-[2px] bg-accent" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedTab('new')
                    onUpdateSearch({ sort: 'recent' }, true)
                  }}
                  className={`relative pb-3 cursor-pointer ${
                    activeFeedTab === 'new' ? 'font-bold text-accent-bright' : 'text-text-primary hover:text-accent-bright'
                  }`}
                >
                  Novos lançamentos
                  {activeFeedTab === 'new' ? (
                    <span className="absolute bottom-[-12px] left-0 right-0 h-[2px] bg-accent" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedTab('trending')
                    onUpdateSearch({ sort: 'popular' }, true)
                  }}
                  className={`relative pb-3 cursor-pointer ${
                    activeFeedTab === 'trending' ? 'font-bold text-accent-bright' : 'text-text-primary hover:text-accent-bright'
                  }`}
                >
                  Em alta
                  {activeFeedTab === 'trending' ? (
                    <span className="absolute bottom-[-12px] left-0 right-0 h-[2px] bg-accent" />
                  ) : null}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="catalog-sort-select" className="text-[15px] text-text-primary">
                  Ordenar por:
                </Label>
                <select
                  id="catalog-sort-select"
                  data-testid="catalog-sort-select"
                  value={search.sort ?? 'recent'}
                  onChange={(event) => onUpdateSearch({ sort: event.target.value as NftSort }, true)}
                  className="bg-transparent text-[15px] text-text-primary focus:outline-none cursor-pointer"
                >
                  {nftSorts.map((sortKey) => (
                    <option key={sortKey} value={sortKey} className="bg-bg-secondary text-text-primary">
                      {nftSortLabels[sortKey]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
              <span data-testid="catalog-results-summary" aria-live="polite">
                {catalogQuery.isLoading
                  ? 'Carregando catálogo...'
                  : catalogQuery.data
                    ? `${catalogQuery.data.total} ${catalogQuery.data.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'} (página ${catalogQuery.data.page} de ${catalogQuery.data.totalPages})`
                    : ''}
              </span>
              {catalogQuery.isFetching && !catalogQuery.isLoading ? (
                <span data-testid="catalog-fetching-indicator" className="text-accent-bright">
                  Atualizando resultados...
                </span>
              ) : null}
            </div>

            {catalogQuery.isLoading ? (
              <div
                data-testid="catalog-skeleton-grid"
                className="grid grid-cols-2 gap-6 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[56px]"
              >
                {Array.from({ length: 9 }, (_, index) => (
                  <NftCardSkeleton key={index} />
                ))}
              </div>
            ) : catalogQuery.isError ? (
              <Card
                role="alert"
                data-testid="catalog-error-state"
                className="flex flex-col items-center justify-center p-10 text-center"
              >
                <AlertCircle className="h-10 w-10 text-red-400" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-text-primary">Falha ao carregar o catálogo</h3>
                <p className="mt-1 max-w-md text-sm text-text-secondary">
                  {catalogQuery.error instanceof Error
                    ? catalogQuery.error.message
                    : 'Não foi possível consultar os NFTs neste momento.'}
                </p>
                <Button
                  className="mt-5"
                  data-testid="catalog-retry-btn"
                  onClick={() => void catalogQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </Card>
            ) : catalogQuery.data && catalogQuery.data.items.length === 0 ? (
              <Card
                data-testid="catalog-empty-state"
                className="flex flex-col items-center justify-center p-10 text-center"
              >
                <Search className="h-10 w-10 text-text-muted" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-text-primary">Nenhum NFT encontrado</h3>
                <p className="mt-1 max-w-md text-sm text-text-secondary">
                  Não encontramos itens para a combinação atual de busca e filtros.
                </p>
                {activeFilterCount > 0 ? (
                  <Button
                    variant="secondary"
                    className="mt-5"
                    data-testid="empty-clear-filters-btn"
                    onClick={onResetFilters}
                  >
                    Limpar filtros
                  </Button>
                ) : null}
              </Card>
            ) : catalogQuery.data ? (
              <>
                <div
                  data-testid="catalog-grid"
                  className="grid grid-cols-2 gap-5 lg:grid-cols-3 lg:gap-x-[34px] lg:gap-y-[56px]"
                >
                  {catalogQuery.data.items.map((nft, index) => (
                    <NftCard
                      key={nft.id}
                      nft={nft}
                      isFavorite={favoriteSet.has(nft.id)}
                      priority={index < 3}
                    />
                  ))}
                </div>

                {catalogQuery.data.totalPages > 1 ? (
                  <nav
                    aria-label="Paginação do catálogo"
                    data-testid="catalog-pagination"
                    className="mt-[64px] flex flex-wrap items-center justify-end gap-[8px]"
                  >
                    <button
                      type="button"
                      data-testid="pagination-prev"
                      aria-label="Página anterior"
                      disabled={catalogQuery.data.page <= 1}
                      onClick={() => onUpdateSearch({ page: catalogQuery.data.page - 1 }, false)}
                      className="inline-flex h-[35px] px-2.5 items-center justify-center rounded-[4px] border border-border-subtle text-xs text-text-primary disabled:opacity-40 cursor-pointer"
                    >
                      Anterior
                    </button>

                    {Array.from({ length: catalogQuery.data.totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => {
                        const isCurrent = pageNumber === catalogQuery.data.page
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            data-testid={`pagination-page-${pageNumber}`}
                            aria-current={isCurrent ? 'page' : undefined}
                            onClick={() => onUpdateSearch({ page: pageNumber }, false)}
                            className={`inline-flex h-[35px] w-[35px] items-center justify-center rounded-[4px] text-[18px] leading-[16px] cursor-pointer ${
                              isCurrent
                                ? 'bg-accent font-bold text-bg-primary'
                                : 'border border-border-subtle font-normal text-text-primary hover:border-accent'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      },
                    )}

                    <button
                      type="button"
                      data-testid="pagination-next"
                      aria-label="Próxima página"
                      disabled={catalogQuery.data.page >= catalogQuery.data.totalPages}
                      onClick={() => onUpdateSearch({ page: catalogQuery.data.page + 1 }, false)}
                      className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-[4px] border border-border-subtle text-text-primary hover:border-accent disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-label="Coleções em destaque" className="mt-[72px] grid grid-cols-1 gap-[28px] lg:grid-cols-2">
        <div className="flex flex-col items-center justify-between overflow-hidden rounded-[12px] bg-bg-secondary sm:h-[250px] sm:flex-row">
          <img
            src="/images/figma/8f387.jpg"
            alt="Lançamentos gênesis de edição limitada"
            width={280}
            height={250}
            loading="lazy"
            className="h-[220px] w-full rounded-[12px] object-cover sm:h-[250px] sm:w-[270px]"
          />
          <div className="flex flex-1 flex-col items-end justify-center gap-3 p-6 text-right">
            <h2 className="text-[18px] font-bold leading-[24px] text-text-primary">
              Lançamentos gênesis
              <br />
              de edição limitada
            </h2>
            <p className="text-[14px] leading-[22px] text-text-secondary">
              Colecione edições escassas diretamente dos criadores antes da revelação pública.
            </p>
            <Link
              to="/nft/$nftId"
              params={{ nftId: 'nft_001' }}
              className="inline-flex h-[40px] items-center gap-2 rounded-[6px] bg-accent px-5 text-[14px] font-bold text-bg-primary hover:bg-accent-hover"
            >
              <span>Explorar</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between overflow-hidden rounded-[12px] bg-bg-secondary sm:h-[250px] sm:flex-row">
          <img
            src="/images/figma/9add2.jpg"
            alt="Arte digital selecionada e muito mais"
            width={280}
            height={250}
            loading="lazy"
            className="h-[220px] w-full rounded-[12px] object-cover sm:h-[250px] sm:w-[270px]"
          />
          <div className="flex flex-1 flex-col items-end justify-center gap-3 p-6 text-right">
            <h2 className="text-[18px] font-bold leading-[24px] text-text-primary">
              Arte digital selecionada
              <br />e muito mais
            </h2>
            <p className="text-[14px] leading-[22px] text-text-secondary">
              Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.
            </p>
            <Link
              to="/nft/$nftId"
              params={{ nftId: 'nft_003' }}
              className="inline-flex h-[40px] items-center gap-2 rounded-[6px] bg-accent px-5 text-[14px] font-bold text-bg-primary hover:bg-accent-hover"
            >
              <span>Explorar</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="blog-heading" className="mt-[72px] flex flex-col items-center gap-[40px]">
        <div className="flex flex-col items-center gap-[12px] text-center">
          <h2 id="blog-heading" className="text-[28px] font-bold text-text-primary">
            Diário da Cunhagem
          </h2>
          <p className="text-[14px] text-text-secondary">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-[24px] sm:grid-cols-2 lg:grid-cols-4">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col overflow-hidden rounded-[8px] bg-bg-secondary"
            >
              <div className="h-[195px] w-full overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  width={268}
                  height={195}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between gap-[8px] px-[16px] pt-[12px] pb-[16px]">
                <div className="flex flex-col gap-[8px]">
                  <p className="text-[12px] font-medium leading-[16px] text-text-secondary">{post.meta}</p>
                  <h3 className="text-[16px] font-bold leading-snug text-text-primary">{post.title}</h3>
                  <p className="text-[12px] font-medium leading-[16px] text-text-secondary">
                    {post.excerpt}
                  </p>
                </div>
                <a
                  href="#catalogo-section"
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-accent-bright hover:underline"
                >
                  <span>Ler mais</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
