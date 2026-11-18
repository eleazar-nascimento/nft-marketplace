import { Link } from '@tanstack/react-router'
import { AlertCircle, ChevronRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
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

  const handleClearFilters = () => {
    setPriceError(null)
    onResetFilters()
  }

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

      <PromoBanners />
      <MintJournalSection />
    </div>
  )
}
