import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels, networks, type Network } from '@/contracts'
import { compareEth, formatEth, isZeroEth, mulEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { useCart, useCartMutations, useNftsList, useQuote } from '@/state/queries'
import { useSession } from '@/state/session'

export function CartPage() {
  const { status } = useSession()
  const navigate = useNavigate()
  const cartQuery = useCart()
  const relatedQuery = useNftsList({ page: 1, pageSize: 5 })
  const { updateItem, removeItem, applyCoupon, removeCoupon, acknowledge } = useCartMutations()

  const [network, setNetwork] = useState<Network>('ethereum')
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)

  const cart = cartQuery.data
  const hasItems = Boolean(cart && cart.lines.length > 0)
  const quoteQuery = useQuote(network, cart?.version ?? 0, hasItems)

  if (cartQuery.isLoading) {
    return (
      <div data-testid="cart-page-skeleton" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-0">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-[70px] w-full" />
            <Skeleton className="h-[70px] w-full" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton data-testid="cart-summary-skeleton" className="h-80 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Card data-testid="cart-empty-state" className="p-10">
          <ShoppingBag className="mx-auto h-12 w-12 text-accent-bright" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-text-primary">Seu carrinho está vazio</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Explore o catálogo para adicionar edições digitais exclusivas à sua coleção.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Explorar NFTs</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const handleApplyCoupon = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = couponInput.trim()
    if (!trimmed) {
      setCouponError('Informe um código de cupom.')
      return
    }
    setCouponError(null)
    try {
      await applyCoupon.mutateAsync(trimmed)
      setCouponInput('')
    } catch (error) {
      setCouponError(error instanceof Error ? error.message : 'Cupom inválido.')
    }
  }

  const handleProceedToCheckout = () => {
    if (status !== 'authenticated') {
      saveReturnTo('/checkout')
      void navigate({ to: '/login' })
      return
    }
    void navigate({ to: '/checkout' })
  }

  const quote = quoteQuery.data
  const hasLineChanges = cart.lines.some(
    (line) =>
      compareEth(line.unitPriceEth, line.addedUnitPriceEth) !== 0 ||
      line.status !== 'available' ||
      line.quantity > Math.min(line.available, line.maxPerOrder),
  )
  const hasQuoteIssues = Boolean(quote && quote.issues.length > 0) || hasLineChanges
  const relatedItems = (relatedQuery.data?.items ?? []).slice(0, 5)

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <p className="hidden text-[15px] font-bold leading-[16px] text-text-primary lg:block">
              <Link to="/" className="hover:text-accent-bright">
                Início
              </Link>{' '}
              / Mercado / Carrinho
            </p>
            <h1 className="text-[20px] font-bold text-text-primary lg:sr-only">Carrinho de NFTs</h1>
          </div>
        </div>
        <span data-testid="cart-items-badge" className="text-xs text-text-secondary">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {hasQuoteIssues ? (
        <div
          role="alert"
          data-testid="cart-issues-banner"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-amber-500/70 bg-amber-950/80 p-4 text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-bold">Alteração de preço ou disponibilidade detectada</p>
              <p className="mt-0.5 text-amber-200">
                Um ou mais itens sofreram mudanças desde que foram adicionados. Confirme a atualização para
                prosseguir com segurança.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            data-testid="cart-acknowledge-btn"
            disabled={acknowledge.isPending}
            onClick={() => acknowledge.mutate()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Atualizar itens e cotação
          </Button>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col items-start justify-between gap-[40px] lg:flex-row">
        <div className="w-full lg:w-[782px]">
          <div className="hidden items-center justify-between border-b border-accent/35 pb-3 pr-[24px] text-[16px] text-text-primary sm:flex">
            <span className="w-[250px] font-bold">NFTs</span>
            <span className="w-[90px] font-medium">Preço</span>
            <span className="w-[95px] font-bold text-center">Edições</span>
            <span className="w-[100px] font-medium">Total</span>
            <span className="w-[24px]" />
          </div>

          <div className="mt-3 flex flex-col gap-[12px]">
            {cart.lines.map((line) => {
              const maxAllowed =
                line.status === 'available' ? Math.min(line.available, line.maxPerOrder) : 0
              const priceChanged = compareEth(line.unitPriceEth, line.addedUnitPriceEth) !== 0
              const isSoldOut = maxAllowed === 0
              const tokenNumber = line.nftId.replace(/\D/g, '').padStart(4, '0')

              return (
                <div
                  key={line.id}
                  data-testid={`cart-line-${line.nftId}`}
                  className="flex flex-col justify-between gap-4 rounded-[14px] bg-bg-secondary p-3 pr-4 sm:h-[70px] sm:flex-row sm:items-center sm:rounded-none sm:p-0 sm:pr-[24px]"
                >
                  <div className="flex items-center gap-[16px] sm:w-[250px]">
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: line.nftId }}
                      className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[6px]"
                    >
                      <img
                        src={line.image.url}
                        alt={line.image.alt}
                        width={70}
                        height={70}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex flex-col gap-[6px]">
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: line.nftId }}
                        className="text-[16px] font-bold leading-[16px] text-text-primary hover:text-accent-bright"
                      >
                        {line.name}
                      </Link>
                      <p className="text-[14px] leading-[16px] text-text-muted">ID do token: #{tokenNumber}</p>
                      <div className="flex flex-wrap gap-1">
                        {priceChanged ? (
                          <Badge variant="warning" data-testid={`cart-line-price-changed-${line.nftId}`}>
                            Era {formatEth(line.addedUnitPriceEth)}
                          </Badge>
                        ) : null}
                        {isSoldOut ? (
                          <Badge variant="danger" data-testid={`cart-line-soldout-${line.nftId}`}>
                            Esgotado
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:flex-1">
                    <span
                      data-testid={`cart-line-unit-price-${line.nftId}`}
                      className="text-[16px] font-bold leading-[16px] text-text-secondary sm:w-[90px]"
                    >
                      {formatEth(line.unitPriceEth)}
                    </span>

                    <div className="flex items-center justify-center gap-[12px] sm:w-[95px]">
                      <button
                        type="button"
                        data-testid={`cart-qty-decrease-${line.nftId}`}
                        aria-label={`Diminuir quantidade de ${line.name}`}
                        disabled={line.quantity <= 1 || updateItem.isPending}
                        onClick={() =>
                          updateItem.mutate({ lineId: line.id, quantity: Math.max(1, line.quantity - 1) })
                        }
                        className="flex h-[30px] w-[20px] items-center justify-center rounded-[20px] border border-bg-primary bg-accent text-bg-primary disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span
                        data-testid={`cart-qty-value-${line.nftId}`}
                        className="text-[17px] leading-[24px] text-text-primary"
                      >
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        data-testid={`cart-qty-increase-${line.nftId}`}
                        aria-label={`Aumentar quantidade de ${line.name}`}
                        disabled={line.quantity >= maxAllowed || updateItem.isPending}
                        onClick={() =>
                          updateItem.mutate({ lineId: line.id, quantity: line.quantity + 1 })
                        }
                        className="flex h-[30px] w-[20px] items-center justify-center rounded-[20px] border border-bg-primary bg-accent text-bg-primary disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <span
                      data-testid={`cart-line-total-${line.nftId}`}
                      className="text-[16px] font-bold leading-[16px] text-accent-bright sm:w-[100px]"
                    >
                      {formatEth(mulEth(line.unitPriceEth, line.quantity))}
                    </span>

                    <button
                      type="button"
                      data-testid={`cart-remove-${line.nftId}`}
                      aria-label={`Remover ${line.name} do carrinho`}
                      disabled={removeItem.isPending}
                      onClick={() => removeItem.mutate(line.id)}
                      className="inline-flex h-[24px] w-[24px] items-center justify-center text-text-secondary hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

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
              onChange={(event) => setNetwork(event.target.value as Network)}
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
            {cart.couponCode ? (
              <div
                data-testid="active-coupon-pill"
                className="flex items-center justify-between rounded-[3px] border border-accent bg-bg-secondary px-3 py-2 text-xs text-text-primary"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
                  <span>Cupom: {cart.couponCode}</span>
                </div>
                <button
                  type="button"
                  data-testid="remove-coupon-btn"
                  aria-label={`Remover cupom ${cart.couponCode}`}
                  onClick={() => removeCoupon.mutate()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-accent-bright hover:text-text-primary cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Remover
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => void handleApplyCoupon(event)} noValidate className="flex flex-col gap-[8px]">
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
                    onChange={(event) => setCouponInput(event.target.value)}
                    className="flex-1 bg-transparent pl-[8px] pr-2 text-[12px] text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  <button
                    type="submit"
                    data-testid="apply-coupon-btn"
                    disabled={applyCoupon.isPending}
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

          {quoteQuery.isLoading || !quote ? (
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
              onClick={handleProceedToCheckout}
              className="flex h-[40px] w-full items-center justify-center rounded-[3px] bg-accent text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
            >
              Conectar e finalizar
            </button>
            <Link to="/" className="text-[15px] text-accent-bright hover:underline">
              Continuar explorando
            </Link>
          </div>
        </div>
      </div>

      {relatedItems.length > 0 ? (
        <section aria-labelledby="also-viewed-heading" className="mt-[64px]">
          <h2 id="also-viewed-heading" className="text-[17px] font-bold text-accent-bright">
            Colecionadores também viram
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
