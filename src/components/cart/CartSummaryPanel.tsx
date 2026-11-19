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
    <div className="-mx-4 w-[calc(100%+2rem)] shrink-0 rounded-t-4xl border-t border-border-subtle/70 bg-bg-secondary px-5 pt-4 pb-5 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:px-6 lg:mx-0 lg:w-78 lg:rounded-none lg:border-t-0 lg:bg-transparent lg:p-0 xl:w-83">
      <div className="hidden flex-col gap-3 lg:flex">
        <h2 className="text-[18px] font-bold leading-4 text-text-primary">Resumo da carteira</h2>
        <div className="h-px w-full bg-accent/35" />
      </div>

      <div className="mt-4 hidden lg:block">
        <label htmlFor="cart-network-select" className="sr-only">
          Rede para estimativa de taxas
        </label>
        <select
          id="cart-network-select"
          data-testid="cart-network-select"
          value={network}
          onChange={(event) => onChangeNetwork(event.target.value as Network)}
          className="h-8.5 w-full rounded-[3px] border border-border-subtle bg-bg-primary px-2.5 text-xs text-text-secondary"
        >
          {networks.map((net) => (
            <option key={net} value={net}>
              Rede: {networkLabels[net]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-0 lg:mt-5">
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
          <form onSubmit={onApplyCoupon} noValidate className="flex flex-col gap-2">
            <label
              htmlFor="cart-coupon-input"
              className="hidden text-[14px] font-bold leading-4 text-text-primary lg:block"
            >
              Código promocional
            </label>
            <div className="flex h-12.5 w-full items-center overflow-hidden rounded-[40px] border border-border-subtle bg-bg-secondary drop-shadow-[0px_6px_10px_rgba(10,6,4,0.45)] lg:h-10 lg:rounded-[3px] lg:border-accent lg:bg-transparent lg:drop-shadow-none">
              <input
                id="cart-coupon-input"
                data-testid="cart-coupon-input"
                placeholder="Digite o código promocional..."
                value={couponInput}
                aria-invalid={Boolean(couponError)}
                aria-describedby={couponError ? 'cart-coupon-error' : undefined}
                onChange={(event) => onChangeCouponInput(event.target.value)}
                className="min-w-0 flex-1 bg-transparent pl-4 pr-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none lg:pl-2 lg:text-[12px]"
              />
              <button
                type="submit"
                data-testid="apply-coupon-btn"
                disabled={applyCouponPending}
                className="h-12.5 w-24.25 shrink-0 rounded-[40px] bg-[linear-gradient(96deg,rgba(210,138,76,0.54)_0.94%,rgb(210,138,76)_105.02%)] text-[15px] font-bold leading-4 text-text-primary hover:opacity-95 lg:h-10 lg:w-23 lg:rounded-none lg:bg-accent lg:bg-none lg:text-bg-primary lg:hover:bg-accent-hover xl:w-25.5 cursor-pointer"
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
        <div data-testid="cart-summary-skeleton" className="mt-4 space-y-2.5 lg:mt-6 lg:space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5 lg:mt-6 lg:gap-3">
          <div className="flex items-start justify-between text-text-primary">
            <span className="text-[15px]">Subtotal</span>
            <span data-testid="quote-subtotal" className="text-[18px] leading-4">
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
              <span data-testid="quote-network-fee" className="text-[18px] leading-4">
                {formatEth(quote.networkFeeEth)}
              </span>
            </div>
            <span className="text-[12px] leading-4 text-accent-bright">Taxa estimada</span>
          </div>
          <div className="mt-2 flex items-start justify-between font-bold">
            <span className="text-[16px] text-text-primary">Total</span>
            <span data-testid="quote-total" className="text-[18px] text-accent-bright">
              {formatEth(quote.totalEth)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          data-testid="proceed-to-checkout-btn"
          disabled={!quote || quote.lines.length === 0}
          onClick={onProceedToCheckout}
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 lg:h-10 lg:rounded-[3px] cursor-pointer"
        >
          Conectar e finalizar
        </button>
        <Link to="/" className="hidden text-[15px] text-accent-bright hover:underline lg:inline">
          Continuar explorando
        </Link>
      </div>
    </div>
  )
}
