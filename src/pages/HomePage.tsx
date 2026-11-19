import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  ChevronRight,
  Filter,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CatalogFilters } from '@/components/catalog/CatalogFilters'
import { HeroBanner } from '@/components/catalog/HeroBanner'
import { MintJournalSection } from '@/components/catalog/MintJournalSection'
import { PromoBanners } from '@/components/catalog/PromoBanners'
import { NftCard, NftCardSkeleton } from '@/components/nft/NftCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogTitle, DrawerContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
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
    const min = minPriceInput.trim().replace(',', '.')
    const max = maxPriceInput.trim().replace(',', '.')
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

  const handleClearFilters = () => {
    setMinPriceInput('')
    setMaxPriceInput('')
    setPriceError(null)
    onResetFilters()
  }

  return (
    <div className="mx-auto w-full max-w-300 px-4 pt-4 sm:px-6 lg:px-0 lg:pt-8">
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <form onSubmit={handleSearchSubmit} className="relative flex-1" role="search">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            data-testid="mobile-search-input"
            aria-label="Explorar coleções"
            placeholder="Explorar coleções"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-11.25 w-full rounded-[10px] bg-bg-secondary pl-10 pr-9 text-[14px] font-bold text-text-primary placeholder:text-text-muted focus:outline-none"
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
        </form>
        <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <button
            type="button"
            data-testid="mobile-filters-trigger"
            aria-label="Abrir navegação e filtros"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex h-11.25 w-11.25 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#D28A4C66_0%,#D28A4C_100%)] text-bg-primary cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <circle cx="6.5" cy="7.5" r="2.75" stroke="currentColor" strokeWidth="2.2" />
              <line x1="12.5" y1="7.5" x2="20" y2="7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="4" y1="16.5" x2="11.5" y2="16.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="17.5" cy="16.5" r="2.75" stroke="currentColor" strokeWidth="2.2" />
            </svg>
          </button>
          <DrawerContent closeLabel="Fechar painel">
            <nav aria-label="Acesso rápido" className="mb-6 border-b border-border-subtle pb-5 pr-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                Minha conta
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/wallets"
                  data-testid="mobile-drawer-wallets-link"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-bg-secondary px-3.5 py-2.5 text-sm font-bold text-text-primary hover:border-accent"
                >
                  <Wallet className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                  <span>Carteira</span>
                </Link>
              </div>
            </nav>

            <DialogTitle className="flex items-center gap-2 font-mono text-text-primary">
              <Filter className="h-5 w-5 text-accent-bright" aria-hidden="true" />
              Filtros
            </DialogTitle>
            <div className="mt-5 flex flex-col gap-2">
              <Label htmlFor="mobile-sort-select" className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Ordenar por
              </Label>
              <select
                id="mobile-sort-select"
                data-testid="mobile-sort-select"
                value={search.sort ?? 'recent'}
                onChange={(event) => onUpdateSearch({ sort: event.target.value as NftSort }, true)}
                className="h-10 w-full rounded-lg border border-border-subtle bg-bg-secondary px-3 text-sm text-text-primary focus:border-accent focus:outline-none cursor-pointer"
              >
                {nftSorts.map((sortKey) => (
                  <option key={sortKey} value={sortKey} className="bg-bg-secondary text-text-primary">
                    {nftSortLabels[sortKey]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6">
              <CatalogFilters
                idPrefix="mobile"
                selectedCategories={search.category}
                selectedNetwork={search.network}
                availability={search.availability}
                minPriceInput={minPriceInput}
                maxPriceInput={maxPriceInput}
                priceError={priceError}
                activeFilterCount={activeFilterCount}
                onToggleCategory={toggleCategory}
                onSelectNetwork={(network) => onUpdateSearch({ network }, true)}
                onChangeMinPrice={setMinPriceInput}
                onChangeMaxPrice={setMaxPriceInput}
                onApplyPriceRange={applyPriceRange}
                onToggleOnlyAvailable={(only) =>
                  onUpdateSearch({ availability: only ? 'available' : undefined }, true)
                }
                onClearFilters={handleClearFilters}
              />
            </div>
          </DrawerContent>
        </Dialog>
      </div>

      <HeroBanner />

      <section id="catalogo-section" aria-labelledby="catalog-heading" className="mt-6 lg:mt-11.5">
        <h2 id="catalog-heading" className="sr-only">
          Catálogo de NFTs
        </h2>

        <form onSubmit={handleSearchSubmit} className="mb-6 hidden gap-2 lg:flex" role="search">
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

        <div className="flex flex-col items-start gap-12 lg:flex-row">
          <aside aria-label="Filtros do catálogo" className="hidden w-77.5 shrink-0 flex-col gap-6 lg:flex">
            <div className="w-77.5 bg-bg-secondary p-5">
              <CatalogFilters
                idPrefix="desktop"
                selectedCategories={search.category}
                selectedNetwork={search.network}
                availability={search.availability}
                minPriceInput={minPriceInput}
                maxPriceInput={maxPriceInput}
                priceError={priceError}
                activeFilterCount={activeFilterCount}
                onToggleCategory={toggleCategory}
                onSelectNetwork={(network) => onUpdateSearch({ network }, true)}
                onChangeMinPrice={setMinPriceInput}
                onChangeMaxPrice={setMaxPriceInput}
                onApplyPriceRange={applyPriceRange}
                onToggleOnlyAvailable={(only) =>
                  onUpdateSearch({ availability: only ? 'available' : undefined }, true)
                }
                onClearFilters={handleClearFilters}
              />
            </div>

            <div className="relative flex h-117.5 w-77.5 flex-col items-center justify-between overflow-hidden bg-linear-to-b from-accent/10 to-accent/5 pt-6 pb-1">
              <div className="flex flex-col items-center gap-3 px-5 text-center">
                <p className="text-[24px] font-bold leading-8 text-accent-bright">NFT EM DESTAQUE</p>
                <p className="text-[22px] font-bold leading-4 text-text-primary">OFERTA LIMITADA</p>
              </div>
              <Link
                to="/nft/$nftId"
                params={{ nftId: 'nft_002' }}
                className="block h-92 w-full overflow-hidden rounded-[22px]"
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
            <div className="flex flex-wrap items-center justify-between gap-4 pb-1 lg:border-b lg:border-border-subtle lg:pb-3">
              <div className="flex w-full items-center justify-between gap-3 text-[13px] font-medium leading-4 whitespace-nowrap sm:text-[15px] lg:w-auto lg:justify-start lg:gap-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedTab('all')
                    onUpdateSearch({ sort: 'recent' }, true)
                  }}
                  className={`relative pb-2 lg:pb-3 cursor-pointer ${
                    activeFeedTab === 'all' ? 'font-bold text-accent-bright' : 'text-text-primary hover:text-accent-bright'
                  }`}
                >
                  Todos os NFTs
                  {activeFeedTab === 'all' ? (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent lg:-bottom-3" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedTab('new')
                    onUpdateSearch({ sort: 'recent' }, true)
                  }}
                  className={`relative pb-2 lg:pb-3 cursor-pointer ${
                    activeFeedTab === 'new' ? 'font-bold text-accent-bright' : 'text-text-primary hover:text-accent-bright'
                  }`}
                >
                  Novos lançamentos
                  {activeFeedTab === 'new' ? (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent lg:-bottom-3" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeedTab('trending')
                    onUpdateSearch({ sort: 'popular' }, true)
                  }}
                  className={`relative pb-2 lg:pb-3 cursor-pointer ${
                    activeFeedTab === 'trending' ? 'font-bold text-accent-bright' : 'text-text-primary hover:text-accent-bright'
                  }`}
                >
                  Em alta
                  {activeFeedTab === 'trending' ? (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent lg:-bottom-3" />
                  ) : null}
                </button>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
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

            <div className="sr-only lg:not-sr-only lg:mt-3 lg:mb-4 lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-2 lg:text-xs lg:text-text-secondary">
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
                className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 pb-8 lg:mt-0 lg:grid-cols-3 lg:gap-x-8.5 lg:gap-y-14 lg:pb-0"
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
                  className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 pb-8 lg:mt-0 lg:grid-cols-3 lg:gap-x-8.5 lg:gap-y-14 lg:pb-0"
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

                {catalogQuery.data.totalPages > 1 ? (() => {
                  const totalPages = catalogQuery.data.totalPages
                  const currentPage = catalogQuery.data.page
                  const maxVisiblePages = 4
                  const startPage = Math.max(
                    1,
                    Math.min(
                      currentPage - Math.floor(maxVisiblePages / 2),
                      Math.max(1, totalPages - maxVisiblePages + 1),
                    ),
                  )
                  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                  const visiblePages = Array.from(
                    { length: endPage - startPage + 1 },
                    (_, i) => startPage + i,
                  )
                  const isPageOneVisible = visiblePages.includes(1)

                  return (
                    <nav
                      aria-label="Paginação do catálogo"
                      data-testid="catalog-pagination"
                      className="mt-16 flex flex-wrap items-center justify-end gap-2"
                    >
                      {!isPageOneVisible ? (
                        <button
                          type="button"
                          data-testid="pagination-prev"
                          aria-label="Página anterior"
                          onClick={() => onUpdateSearch({ page: currentPage - 1 }, false)}
                          className="inline-flex h-8.75 items-center justify-center rounded-sm border border-border-subtle px-2.5 text-xs text-text-primary hover:border-accent cursor-pointer"
                        >
                          Anterior
                        </button>
                      ) : null}

                      {visiblePages.map((pageNumber) => {
                        const isCurrent = pageNumber === currentPage
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            data-testid={`pagination-page-${pageNumber}`}
                            aria-current={isCurrent ? 'page' : undefined}
                            onClick={() => onUpdateSearch({ page: pageNumber }, false)}
                            className={`inline-flex h-8.75 w-8.75 items-center justify-center rounded-sm text-[18px] leading-4 cursor-pointer ${
                              isCurrent
                                ? 'bg-accent font-bold text-bg-primary'
                                : 'border border-border-subtle font-normal text-text-primary hover:border-accent'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}

                      <button
                        type="button"
                        data-testid="pagination-next"
                        aria-label="Próxima página"
                        disabled={currentPage >= totalPages}
                        onClick={() => onUpdateSearch({ page: currentPage + 1 }, false)}
                        className="inline-flex h-8.75 w-8.75 items-center justify-center rounded-sm border border-border-subtle text-text-primary hover:border-accent disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </nav>
                  )
                })() : null}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
        <PromoBanners />
        <MintJournalSection />
      </div>
    </div>
  )
}
