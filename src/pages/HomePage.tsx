import { Link } from '@tanstack/react-router'
import { AlertCircle, Filter, RotateCcw, Rocket, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NftCard, NftCardSkeleton } from '@/components/nft/NftCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogTitle, DrawerContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  networkLabels,
  networks,
  nftCategories,
  nftCategoryLabels,
  nftSortLabels,
  nftSorts,
  type AvailabilityFilter,
  type Network,
  type NftCategory,
  type NftListQuery,
  type NftSort,
} from '@/contracts'
import { formatEth } from '@/lib/eth'
import { useFavorites, useFeaturedNfts, useNftsList } from '@/state/queries'

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

export function HomePage({ search, onUpdateSearch, onResetFilters }: HomePageProps) {
  const [searchInput, setSearchInput] = useState(search.q ?? '')
  const [minPriceInput, setMinPriceInput] = useState(search.minPrice ?? '')
  const [maxPriceInput, setMaxPriceInput] = useState(search.maxPrice ?? '')
  const [priceError, setPriceError] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

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

  const featuredQuery = useFeaturedNfts()
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

  const heroNft = featuredQuery.data?.[0]?.nft

  const renderFilterControls = (idPrefix: string) => (
    <div className="space-y-6">
      <div>
        <span className="block text-sm font-semibold text-white">Categorias</span>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {nftCategories.map((cat) => {
            const selected = search.category?.includes(cat) ?? false
            return (
              <button
                key={cat}
                type="button"
                data-testid={`${idPrefix}-category-${cat}`}
                aria-pressed={selected}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  selected
                    ? 'border-accent-bright bg-accent text-white'
                    : 'border-border-subtle bg-bg-primary text-text-secondary hover:text-white'
                }`}
              >
                {nftCategoryLabels[cat]}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label htmlFor={`${idPrefix}-network-select`}>Rede Blockchain</Label>
        <select
          id={`${idPrefix}-network-select`}
          data-testid={`${idPrefix}-network-select`}
          value={search.network ?? ''}
          onChange={(event) =>
            onUpdateSearch({ network: (event.target.value || undefined) as Network | undefined }, true)
          }
          className="mt-1.5 h-11 w-full rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-white"
        >
          <option value="">Todas as redes</option>
          {networks.map((net) => (
            <option key={net} value={net}>
              {networkLabels[net]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="block text-sm font-semibold text-white">Faixa de preço (ETH)</span>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`${idPrefix}-min-price`} className="sr-only">
              Preço mínimo em ETH
            </Label>
            <Input
              id={`${idPrefix}-min-price`}
              data-testid={`${idPrefix}-min-price`}
              placeholder="Mín (ex: 0.5)"
              value={minPriceInput}
              onChange={(event) => setMinPriceInput(event.target.value)}
              className="h-10 rounded-xl bg-bg-primary text-sm"
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-max-price`} className="sr-only">
              Preço máximo em ETH
            </Label>
            <Input
              id={`${idPrefix}-max-price`}
              data-testid={`${idPrefix}-max-price`}
              placeholder="Máx (ex: 5)"
              value={maxPriceInput}
              onChange={(event) => setMaxPriceInput(event.target.value)}
              className="h-10 rounded-xl bg-bg-primary text-sm"
            />
          </div>
        </div>
        {priceError ? (
          <p role="alert" className="mt-1.5 text-xs text-red-400">
            {priceError}
          </p>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          data-testid={`${idPrefix}-apply-price`}
          className="mt-2 w-full"
          onClick={applyPriceRange}
        >
          Aplicar faixa de preço
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border-subtle bg-bg-primary px-3.5 py-2.5">
        <Label htmlFor={`${idPrefix}-only-available`} className="cursor-pointer text-sm text-white">
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
          className="h-4 w-4 accent-accent-bright cursor-pointer"
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section
        aria-labelledby="hero-heading"
        className="grid grid-cols-1 items-center gap-8 rounded-[28px] border border-border-subtle/70 bg-bg-secondary/60 p-6 sm:p-10 lg:grid-cols-12"
      >
        <div className="lg:col-span-7">
          <Badge variant="accent">Colecionáveis Digitais & Arte Cripto</Badge>
          <h1
            id="hero-heading"
            className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
          >
            Descubra Arte Digital & Colecione NFTs Exclusivos
          </h1>
          <p className="mt-4 max-w-2xl text-base text-text-secondary sm:text-lg">
            Explore edições verificadas de criadores independentes, acompanhe preços e disponibilidade em
            tempo real e monte sua coleção com segurança.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <a href="#catalogo-section">
                <Rocket className="h-5 w-5" aria-hidden="true" />
                Explorar catálogo
              </a>
            </Button>
            {heroNft ? (
              <Button variant="outline" size="lg" asChild>
                <Link to="/nft/$nftId" params={{ nftId: heroNft.id }}>
                  Ver destaque: {heroNft.name}
                </Link>
              </Button>
            ) : null}
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-border-subtle pt-6 font-mono">
            <div>
              <dt className="text-xs text-text-muted">Obras no acervo</dt>
              <dd className="text-xl font-bold text-white sm:text-2xl">45+</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Artistas</dt>
              <dd className="text-xl font-bold text-white sm:text-2xl">12</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Redes ativas</dt>
              <dd className="text-xl font-bold text-white sm:text-2xl">3</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-5">
          {featuredQuery.isLoading ? (
            <Card data-testid="hero-skeleton" className="overflow-hidden">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-5">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="mt-3 h-4 w-1/2" />
              </div>
            </Card>
          ) : heroNft ? (
            <Card data-testid="hero-featured-card" className="overflow-hidden">
              <Link to="/nft/$nftId" params={{ nftId: heroNft.id }} className="block aspect-square w-full">
                <img
                  src={heroNft.image.url}
                  alt={heroNft.image.alt}
                  width={heroNft.image.width}
                  height={heroNft.image.height}
                  fetchPriority="high"
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <Link
                    to="/nft/$nftId"
                    params={{ nftId: heroNft.id }}
                    className="text-xl font-bold text-white hover:text-accent-bright"
                  >
                    {heroNft.name}
                  </Link>
                  <div className="mt-1.5 flex items-center gap-2">
                    <img
                      src={heroNft.creator.avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full"
                    />
                    <span className="font-mono text-xs text-text-secondary">
                      {heroNft.creator.displayName}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="block text-xs text-text-muted">A partir de</span>
                  <span className="text-base font-bold text-white">{formatEth(heroNft.priceFromEth)}</span>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </section>

      {featuredQuery.data && featuredQuery.data.length > 1 ? (
        <section aria-labelledby="featured-heading" className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="featured-heading" className="text-2xl font-bold text-white">
                Destaques da Semana
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Séries selecionadas pelos curadores da plataforma.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredQuery.data.map((entry, idx) => (
              <NftCard
                key={entry.nft.id}
                nft={entry.nft}
                isFavorite={favoriteSet.has(entry.nft.id)}
                priority={idx === 0}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section id="catalogo-section" aria-labelledby="catalog-heading" className="mt-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="catalog-heading" className="text-2xl font-bold text-white sm:text-3xl">
              Catálogo de NFTs
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Combine busca, categorias, rede e faixa de preço para encontrar sua próxima aquisição.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="catalog-sort-select" className="text-xs font-mono text-text-secondary">
                Ordenar por:
              </Label>
              <select
                id="catalog-sort-select"
                data-testid="catalog-sort-select"
                value={search.sort ?? 'recent'}
                onChange={(event) => onUpdateSearch({ sort: event.target.value as NftSort }, true)}
                className="h-11 rounded-2xl border border-border-subtle bg-bg-secondary px-3.5 text-sm text-white"
              >
                {nftSorts.map((sortKey) => (
                  <option key={sortKey} value={sortKey}>
                    {nftSortLabels[sortKey]}
                  </option>
                ))}
              </select>
            </div>

            <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <Button
                variant="secondary"
                size="sm"
                data-testid="mobile-filters-trigger"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </Button>
              <DrawerContent closeLabel="Fechar filtros">
                <DialogTitle className="flex items-center gap-2 font-mono">
                  <Filter className="h-5 w-5 text-accent-bright" aria-hidden="true" />
                  Filtros do Catálogo
                </DialogTitle>
                <div className="mt-6">{renderFilterControls('mobile')}</div>
              </DrawerContent>
            </Dialog>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row" role="search">
          <div className="relative flex-1">
            <Label htmlFor="catalog-search-input" className="sr-only">
              Buscar por nome, coleção ou artista
            </Label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              id="catalog-search-input"
              data-testid="catalog-search-input"
              type="search"
              placeholder="Buscar NFTs por nome, coleção ou artista..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="pl-11 pr-10"
            />
            {searchInput ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setSearchInput('')
                  onUpdateSearch({ q: undefined }, true)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <Button type="submit" data-testid="catalog-search-submit">
            Buscar
          </Button>
        </form>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <aside aria-label="Filtros do catálogo" className="hidden lg:col-span-3 lg:block">
            <Card className="sticky top-24 p-5">{renderFilterControls('desktop')}</Card>
          </aside>

          <div className="lg:col-span-9">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-secondary">
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
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
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
                <h3 className="mt-4 text-lg font-semibold text-white">Falha ao carregar o catálogo</h3>
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
                <h3 className="mt-4 text-lg font-semibold text-white">Nenhum NFT encontrado</h3>
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
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
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
                    className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border-subtle pt-6"
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid="pagination-prev"
                      disabled={catalogQuery.data.page <= 1}
                      onClick={() => onUpdateSearch({ page: catalogQuery.data.page - 1 }, false)}
                    >
                      Anterior
                    </Button>

                    <div className="flex flex-wrap items-center gap-1.5">
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
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-semibold cursor-pointer ${
                                isCurrent
                                  ? 'bg-accent text-white'
                                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-elevated hover:text-white'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          )
                        },
                      )}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      data-testid="pagination-next"
                      disabled={catalogQuery.data.page >= catalogQuery.data.totalPages}
                      onClick={() => onUpdateSearch({ page: catalogQuery.data.page + 1 }, false)}
                    >
                      Próxima
                    </Button>
                  </nav>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
