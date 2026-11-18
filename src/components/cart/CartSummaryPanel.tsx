import { Link } from '@tanstack/react-router'
import { Tag, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels, networks, type Network, type Quote } from '@/contracts'
import { formatEth, isZeroEth } from '@/lib/eth'

interface CartSummaryPanelProps {
  network: Network
  couponCode: string | null
  couponInput: string
  couponError: string | null
  applyCouponPending: boolean
  quote: Quote | undefined
  quoteLoading: boolean
  onChangeNetwork: (network: Network) => void
  onChangeCouponInput: (value: string) => void
  onApplyCoupon: (event: FormEvent) => void
  onRemoveCoupon: () => void
  onProceedToCheckout: () => void
}

export function CartSummaryPanel({
  network,
  couponCode,
  couponInput,
  couponError,
  applyCouponPending,
  quote,
  quoteLoading,
  onChangeNetwork,
  onChangeCouponInput,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToCheckout,
}: CartSummaryPanelProps) {
  return (
    <div className="w-full rounded-t-[32px] bg-bg-secondary p-6 lg:w-[332px] lg:rounded-none lg:bg-transparent lg:p-0">
      <div className="flex flex-col gap-[12px]">
        <h2 className="text-[18px] font-bold leading-[16px] text-text-primary">Resumo da carteira</h2>
        <div className="h-px w-full bg-accent/35" />
      </div>

      <div className="mt-4">
        <label htmlFor="cart-network-select" className="sr-only">
          Rede para estimativa de taxas
        </label>
        <select
          id="cart-network-select"
          data-testid="cart-network-select"
          value={network}
          onChange={(event) => onChangeNetwork(event.target.value as Network)}
          className="h-[34px] w-full rounded-[3px] border border-border-subtle bg-bg-primary px-2.5 text-xs text-text-secondary"
        >
          {networks.map((net) => (
            <option key={net} value={net}>
              Rede: {networkLabels[net]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-[20px]">
        {couponCode ? (
          <div
            data-testid="active-coupon-pill"
            className="flex items-center justify-between rounded-[3px] border border-accent bg-bg-secondary px-3 py-2 text-xs text-text-primary"
          >
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
              <span>Cupom: {couponCode}</span>
            </div>
            <button
              type="button"
              data-testid="remove-coupon-btn"
              aria-label={`Remover cupom ${couponCode}`}
              onClick={onRemoveCoupon}
              className="inline-flex items-center gap-1 text-xs font-bold text-accent-bright hover:text-text-primary cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Remover
            </button>
          </div>
        ) : (
          <form onSubmit={onApplyCoupon} noValidate className="flex flex-col gap-[8px]">
            <label
              htmlFor="cart-coupon-input"
              className="text-[14px] font-bold leading-[16px] text-text-primary"
            >
              Código promocional
            </label>
            <div className="flex h-[40px] w-full overflow-hidden rounded-[3px] border border-accent">
              <input
                id="cart-coupon-input"
                data-testid="cart-coupon-input"
                placeholder="Digite o código promocional..."
                value={couponInput}
                aria-invalid={Boolean(couponError)}
                aria-describedby={couponError ? 'cart-coupon-error' : undefined}
                onChange={(event) => onChangeCouponInput(event.target.value)}
                className="flex-1 bg-transparent pl-[8px] pr-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <button
                type="submit"
                data-testid="apply-coupon-btn"
                disabled={applyCouponPending}
                className="h-[40px] w-[102px] shrink-0 bg-accent text-[15px] font-bold text-bg-primary hover:bg-accent-hover cursor-pointer"
              >
                Aplicar
              </button>
            </div>
            {couponError ? (
              <p
                id="cart-coupon-error"
                role="alert"
                data-testid="cart-coupon-error"
                className="text-xs text-red-400"
              >
                {couponError}
              </p>
            ) : null}
          </form>
        )}
      </div>

      {quoteLoading || !quote ? (
        <div data-testid="cart-summary-skeleton" className="mt-6 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="mt-[24px] flex flex-col gap-[12px]">
          <div className="flex items-start justify-between text-text-primary">
            <span className="text-[15px]">Subtotal</span>
            <span data-testid="quote-subtotal" className="text-[18px] leading-[16px]">
              {formatEth(quote.subtotalEth)}
            </span>
          </div>
          <div className="flex items-start justify-between text-[15px] text-text-primary">
            <span>Desconto do lançamento</span>
            <span data-testid="quote-discount">
              {isZeroEth(quote.discountEth) ? '(-) 00.00' : `(-) ${formatEth(quote.discountEth)}`}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex w-full items-center justify-between text-text-primary">
              <span className="text-[15px]">Taxa de rede</span>
              <span data-testid="quote-network-fee" className="text-[18px] leading-[16px]">
                {formatEth(quote.networkFeeEth)}
              </span>
            </div>
            <span className="text-[12px] leading-[16px] text-accent-bright">Taxa estimada</span>
          </div>
          <div className="mt-2 flex items-start justify-between font-bold">
            <span className="text-[16px] text-text-primary">Total</span>
            <span data-testid="quote-total" className="text-[18px] text-accent-bright">
              {formatEth(quote.totalEth)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-[24px] flex flex-col items-center gap-[12px]">
        <button
          type="button"
          data-testid="proceed-to-checkout-btn"
          disabled={!quote || quote.lines.length === 0}
          onClick={onProceedToCheckout}
          className="flex h-[40px] w-full items-center justify-center rounded-[3px] bg-accent text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
        >
          Conectar e finalizar
        </button>
        <Link to="/" className="text-[15px] text-accent-bright hover:underline">
          Continuar explorando
        </Link>
      </div>
    </div>
  )
}
