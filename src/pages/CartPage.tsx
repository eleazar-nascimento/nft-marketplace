import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels, networks, type Network } from '@/contracts'
import { compareEth, formatEth, isZeroEth, mulEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { useCart, useCartMutations, useQuote } from '@/state/queries'
import { useSession } from '@/state/session'

export function CartPage() {
  const { status } = useSession()
  const navigate = useNavigate()
  const cartQuery = useCart()
  const { updateItem, removeItem, applyCoupon, removeCoupon, acknowledge } = useCartMutations()

  const [network, setNetwork] = useState<Network>('ethereum')
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)

  const cart = cartQuery.data
  const hasItems = Boolean(cart && cart.lines.length > 0)
  const quoteQuery = useQuote(network, cart?.version ?? 0, hasItems)

  if (cartQuery.isLoading) {
    return (
      <div data-testid="cart-page-skeleton" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
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
          <h1 className="mt-4 text-2xl font-bold text-white">Seu carrinho está vazio</h1>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Carrinho de NFTs</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Revise quantidades, aplique cupons e confira a cotação atualizada antes do pagamento.
          </p>
        </div>
        <Badge variant="default" data-testid="cart-items-badge">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}
        </Badge>
      </div>

      {hasQuoteIssues ? (
        <div
          role="alert"
          data-testid="cart-issues-banner"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/70 bg-amber-950/80 p-4 text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold">Alteração de preço ou disponibilidade detectada</p>
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

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {cart.lines.map((line) => {
            const maxAllowed =
              line.status === 'available' ? Math.min(line.available, line.maxPerOrder) : 0
            const priceChanged = compareEth(line.unitPriceEth, line.addedUnitPriceEth) !== 0
            const isSoldOut = maxAllowed === 0

            return (
              <Card
                key={line.id}
                data-testid={`cart-line-${line.nftId}`}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <Link
                    to="/nft/$nftId"
                    params={{ nftId: line.nftId }}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-bg-primary"
                  >
                    <img
                      src={line.image.url}
                      alt={line.image.alt}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div>
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: line.nftId }}
                      className="text-lg font-bold text-white hover:text-accent-bright"
                    >
                      {line.name}
                    </Link>
                    <p className="font-mono text-xs text-text-secondary">
                      Edição: <span className="text-white">{line.editionName}</span> · por {line.creatorName}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span data-testid={`cart-line-unit-price-${line.nftId}`} className="text-white">
                        {formatEth(line.unitPriceEth)} / un.
                      </span>
                      {priceChanged ? (
                        <Badge variant="warning" data-testid={`cart-line-price-changed-${line.nftId}`}>
                          Era {formatEth(line.addedUnitPriceEth)}
                        </Badge>
                      ) : null}
                      {isSoldOut ? (
                        <Badge variant="danger" data-testid={`cart-line-soldout-${line.nftId}`}>
                          Esgotado
                        </Badge>
                      ) : (
                        <span className="text-text-muted">(máx. {maxAllowed})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-end">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      data-testid={`cart-qty-decrease-${line.nftId}`}
                      aria-label={`Diminuir quantidade de ${line.name}`}
                      disabled={line.quantity <= 1 || updateItem.isPending}
                      onClick={() =>
                        updateItem.mutate({ lineId: line.id, quantity: Math.max(1, line.quantity - 1) })
                      }
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <span
                      data-testid={`cart-qty-value-${line.nftId}`}
                      className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-primary px-3 font-mono text-sm font-bold text-white"
                    >
                      {line.quantity}
                    </span>
                    <Button
                      variant="secondary"
                      size="icon"
                      data-testid={`cart-qty-increase-${line.nftId}`}
                      aria-label={`Aumentar quantidade de ${line.name}`}
                      disabled={line.quantity >= maxAllowed || updateItem.isPending}
                      onClick={() =>
                        updateItem.mutate({ lineId: line.id, quantity: line.quantity + 1 })
                      }
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>

                  <div className="text-right font-mono">
                    <span className="block text-xs text-text-muted">Total do item</span>
                    <span
                      data-testid={`cart-line-total-${line.nftId}`}
                      className="text-base font-bold text-white"
                    >
                      {formatEth(mulEth(line.unitPriceEth, line.quantity))}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`cart-remove-${line.nftId}`}
                    aria-label={`Remover ${line.name} do carrinho`}
                    disabled={removeItem.isPending}
                    onClick={() => removeItem.mutate(line.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="lg:col-span-4">
          <Card className="sticky top-24 p-6">
            <h2 className="text-xl font-bold text-white">Resumo de Valores</h2>

            <div className="mt-4">
              <Label htmlFor="cart-network-select">Rede para estimativa de taxas</Label>
              <select
                id="cart-network-select"
                data-testid="cart-network-select"
                value={network}
                onChange={(event) => setNetwork(event.target.value as Network)}
                className="mt-1.5 h-11 w-full rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-white"
              >
                {networks.map((net) => (
                  <option key={net} value={net}>
                    {networkLabels[net]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 border-t border-border-subtle pt-4">
              {cart.couponCode ? (
                <div
                  data-testid="active-coupon-pill"
                  className="flex items-center justify-between rounded-2xl border border-emerald-500/60 bg-emerald-950/60 px-3.5 py-2.5 text-sm text-emerald-100"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <Tag className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    <span>Cupom: {cart.couponCode}</span>
                  </div>
                  <button
                    type="button"
                    data-testid="remove-coupon-btn"
                    aria-label={`Remover cupom ${cart.couponCode}`}
                    onClick={() => removeCoupon.mutate()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={(event) => void handleApplyCoupon(event)} noValidate>
                  <Label htmlFor="cart-coupon-input">Cupom de desconto</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="cart-coupon-input"
                      data-testid="cart-coupon-input"
                      placeholder="Ex: NFT10"
                      value={couponInput}
                      aria-invalid={Boolean(couponError)}
                      aria-describedby={couponError ? 'cart-coupon-error' : undefined}
                      onChange={(event) => setCouponInput(event.target.value)}
                      className="h-11 bg-bg-primary font-mono uppercase"
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      data-testid="apply-coupon-btn"
                      disabled={applyCoupon.isPending}
                      className="h-11 shrink-0"
                    >
                      Aplicar
                    </Button>
                  </div>
                  {couponError ? (
                    <p
                      id="cart-coupon-error"
                      role="alert"
                      data-testid="cart-coupon-error"
                      className="mt-1.5 text-xs text-red-400"
                    >
                      {couponError}
                    </p>
                  ) : null}
                </form>
              )}
            </div>

            {quoteQuery.isLoading || !quote ? (
              <div data-testid="cart-summary-skeleton" className="mt-5 space-y-3 border-t border-border-subtle pt-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <dl className="mt-5 space-y-3 border-t border-border-subtle pt-4 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Subtotal</dt>
                  <dd data-testid="quote-subtotal" className="font-semibold text-white">
                    {formatEth(quote.subtotalEth)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">
                    Desconto {quote.coupon ? `(${quote.coupon.code} -${quote.coupon.percentOff}%)` : ''}
                  </dt>
                  <dd data-testid="quote-discount" className="font-semibold text-emerald-300">
                    {isZeroEth(quote.discountEth) ? '0 ETH' : `- ${formatEth(quote.discountEth)}`}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Taxa de rede ({networkLabels[quote.network]})</dt>
                  <dd data-testid="quote-network-fee" className="font-semibold text-white">
                    {formatEth(quote.networkFeeEth)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-base">
                  <dt className="font-bold text-white">Total</dt>
                  <dd data-testid="quote-total" className="text-lg font-bold text-accent-bright">
                    {formatEth(quote.totalEth)}
                  </dd>
                </div>
              </dl>
            )}

            <Button
              size="lg"
              data-testid="proceed-to-checkout-btn"
              disabled={!quote || quote.lines.length === 0}
              onClick={handleProceedToCheckout}
              className="mt-6 w-full"
            >
              <span>Ir para o pagamento</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
