import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  networkLabels,
  networks,
  nftCategories,
  nftCategoryCounts,
  nftCategoryLabels,
  type AvailabilityFilter,
  type Network,
  type NftCategory,
} from '@/contracts'

const networkCounts: Record<Network, number> = {
  ethereum: 119,
  polygon: 78,
  base: 86,
}

interface CatalogFiltersProps {
  idPrefix: string
  selectedCategories: NftCategory[] | undefined
  selectedNetwork: Network | undefined
  availability: AvailabilityFilter | undefined
  minPriceInput: string
  maxPriceInput: string
  priceError: string | null
  activeFilterCount: number
  onToggleCategory: (category: NftCategory) => void
  onSelectNetwork: (network: Network | undefined) => void
  onChangeMinPrice: (value: string) => void
  onChangeMaxPrice: (value: string) => void
  onApplyPriceRange: () => void
  onToggleOnlyAvailable: (onlyAvailable: boolean) => void
  onClearFilters: () => void
}

export function CatalogFilters({
  idPrefix,
  selectedCategories,
  selectedNetwork,
  availability,
  minPriceInput,
  maxPriceInput,
  priceError,
  activeFilterCount,
  onToggleCategory,
  onSelectNetwork,
  onChangeMinPrice,
  onChangeMaxPrice,
  onApplyPriceRange,
  onToggleOnlyAvailable,
  onClearFilters,
}: CatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col gap-3">
        <h3 className="text-[18px] font-bold leading-4 text-text-primary">Coleções</h3>
        <div className="flex flex-col px-3">
          {nftCategories.map((cat) => {
            const selected = selectedCategories?.includes(cat) ?? false
            return (
              <button
                key={cat}
                type="button"
                data-testid={`${idPrefix}-category-${cat}`}
                aria-pressed={selected}
                onClick={() => onToggleCategory(cat)}
                className={`flex w-full items-center justify-between text-left text-[15px] leading-10 transition-colors cursor-pointer ${
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

      <div className="flex flex-col gap-3">
        <h3 className="text-[18px] font-bold leading-4 text-text-primary">Faixa de preço</h3>
        <div className="flex flex-col gap-3 pl-3">
          <div className="flex items-center">
            <span className="h-3.75 w-3.75 rounded-full bg-accent" />
            <span className="h-1 flex-1 bg-accent" />
            <span className="h-3.75 w-3.75 rounded-full bg-accent" />
            <span className="h-1 w-12 bg-accent/30" />
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
                onChange={(event) => onChangeMinPrice(event.target.value)}
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
                onChange={(event) => onChangeMaxPrice(event.target.value)}
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
              onClick={onApplyPriceRange}
              className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-4 py-2 text-[16px] font-bold leading-5 text-bg-primary hover:bg-accent-hover cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label
          htmlFor={`${idPrefix}-network-select`}
          className="text-[18px] font-bold leading-4 text-text-primary"
        >
          Rede
        </Label>
        <select
          id={`${idPrefix}-network-select`}
          data-testid={`${idPrefix}-network-select`}
          value={selectedNetwork ?? ''}
          onChange={(event) =>
            onSelectNetwork((event.target.value || undefined) as Network | undefined)
          }
          className="h-9.5 w-full rounded-sm border border-border-subtle bg-bg-primary px-3 text-xs text-text-primary"
        >
          <option value="">Todas as redes</option>
          {networks.map((net) => (
            <option key={net} value={net}>
              {networkLabels[net]}
            </option>
          ))}
        </select>

        <div className="flex flex-col pl-3 text-[15px] leading-10 text-text-secondary">
          {networks.map((net) => {
            const active = selectedNetwork === net
            const displayLabel = net === 'base' ? 'Solana' : networkLabels[net]
            return (
              <button
                key={net}
                type="button"
                onClick={() => onSelectNetwork(active ? undefined : net)}
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

      <div className="flex items-center justify-between border-t border-border-subtle pt-3 pl-3">
        <Label htmlFor={`${idPrefix}-only-available`} className="cursor-pointer text-xs text-text-secondary">
          Apenas disponíveis
        </Label>
        <input
          id={`${idPrefix}-only-available`}
          data-testid={`${idPrefix}-only-available`}
          type="checkbox"
          checked={availability === 'available'}
          onChange={(event) => onToggleOnlyAvailable(event.target.checked)}
          className="h-4 w-4 accent-accent cursor-pointer"
        />
      </div>

      {activeFilterCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          data-testid={`${idPrefix}-clear-filters`}
          className="w-full"
          onClick={onClearFilters}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpar filtros ({activeFilterCount})
        </Button>
      ) : null}
    </div>
  )
}
