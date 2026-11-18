import { RotateCcw } from 'lucide-react'
import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
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

const SLIDER_MIN = 0.02
const SLIDER_MAX = 15
const DEFAULT_MIN_PRICE = 0.02
const DEFAULT_MAX_PRICE = 12.3

function parsePriceValue(raw: string, fallback: number): number {
  const normalized = raw.trim().replace(',', '.')
  if (!normalized) return fallback
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, parsed))
}

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
  const trackRef = useRef<HTMLDivElement | null>(null)
  const activeThumbRef = useRef<'min' | 'max' | null>(null)

  const rawMin = parsePriceValue(minPriceInput, DEFAULT_MIN_PRICE)
  const rawMax = parsePriceValue(maxPriceInput, DEFAULT_MAX_PRICE)
  const numericMin = Math.min(rawMin, rawMax)
  const numericMax = Math.max(rawMin, rawMax)

  const leftPercent = ((numericMin - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100
  const rightPercent = ((numericMax - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100

  const valueFromClientX = (clientX: number): number => {
    const track = trackRef.current
    if (!track) return DEFAULT_MIN_PRICE
    const rect = track.getBoundingClientRect()
    if (rect.width <= 0) return DEFAULT_MIN_PRICE
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const raw = SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN)
    return Math.round(raw * 100) / 100
  }

  const updateThumbValue = (thumb: 'min' | 'max', nextValue: number) => {
    if (thumb === 'min') {
      const clamped = Math.min(Math.max(SLIDER_MIN, nextValue), Math.max(SLIDER_MIN, numericMax - 0.05))
      onChangeMinPrice(clamped.toFixed(2))
    } else {
      const clamped = Math.max(Math.min(SLIDER_MAX, nextValue), Math.min(SLIDER_MAX, numericMin + 0.05))
      onChangeMaxPrice(clamped.toFixed(2))
    }
  }

  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const clickedValue = valueFromClientX(event.clientX)
    const distMin = Math.abs(clickedValue - numericMin)
    const distMax = Math.abs(clickedValue - numericMax)
    const chosenThumb: 'min' | 'max' =
      distMin < distMax ? 'min' : distMax < distMin ? 'max' : clickedValue < numericMin ? 'min' : 'max'
    activeThumbRef.current = chosenThumb
    event.currentTarget.setPointerCapture(event.pointerId)
    updateThumbValue(chosenThumb, clickedValue)
  }

  const handleTrackPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeThumbRef.current) return
    const nextValue = valueFromClientX(event.clientX)
    updateThumbValue(activeThumbRef.current, nextValue)
  }

  const handleTrackPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!activeThumbRef.current) return
    activeThumbRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleThumbKeyDown = (thumb: 'min' | 'max', event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 0.5 : 0.1
    const current = thumb === 'min' ? numericMin : numericMax
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      updateThumbValue(thumb, Math.round((current - step) * 100) / 100)
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      updateThumbValue(thumb, Math.round((current + step) * 100) / 100)
    }
  }

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
          <div
            ref={trackRef}
            data-testid={`${idPrefix}-price-slider`}
            onPointerDown={handleTrackPointerDown}
            onPointerMove={handleTrackPointerMove}
            onPointerUp={handleTrackPointerUp}
            onPointerCancel={handleTrackPointerUp}
            className="relative flex h-6 w-full touch-none items-center select-none cursor-pointer"
          >
            <div className="h-1 w-full rounded-full bg-accent/30" />
            <div
              className="pointer-events-none absolute h-1 rounded-full bg-accent"
              style={{
                left: `${leftPercent}%`,
                width: `${Math.max(0, rightPercent - leftPercent)}%`,
              }}
            />
            <button
              type="button"
              role="slider"
              aria-label="Indicador de preço mínimo em ETH"
              aria-valuemin={SLIDER_MIN}
              aria-valuemax={numericMax}
              aria-valuenow={numericMin}
              onKeyDown={(event) => handleThumbKeyDown('min', event)}
              style={{ left: `${leftPercent}%` }}
              className="absolute top-1/2 h-3.75 w-3.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow transition-transform hover:scale-125 focus-visible:scale-125 cursor-grab active:cursor-grabbing"
            />
            <button
              type="button"
              role="slider"
              aria-label="Indicador de preço máximo em ETH"
              aria-valuemin={numericMin}
              aria-valuemax={SLIDER_MAX}
              aria-valuenow={numericMax}
              onKeyDown={(event) => handleThumbKeyDown('max', event)}
              style={{ left: `${rightPercent}%` }}
              className="absolute top-1/2 h-3.75 w-3.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow transition-transform hover:scale-125 focus-visible:scale-125 cursor-grab active:cursor-grabbing"
            />
          </div>

          <p className="text-[15px] text-text-primary">
            Preço: {numericMin.toFixed(2).replace('.', ',')} - {numericMax.toFixed(2).replace('.', ',')} ETH
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
