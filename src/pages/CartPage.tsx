import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { CartSummaryPanel } from '@/components/cart/CartSummaryPanel'
import { RelatedNftsSection } from '@/components/nft/RelatedNftsSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Network } from '@/contracts'
import { compareEth, formatEth, mulEth } from '@/lib/eth'
import { saveReturnTo } from '@/lib/storage'
import { formatTokenNumber } from '@/lib/validation'
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
              const tokenNumber = formatTokenNumber(line.nftId)

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

        <CartSummaryPanel
          network={network}
          couponCode={cart.couponCode}
          couponInput={couponInput}
          couponError={couponError}
          applyCouponPending={applyCoupon.isPending}
          quote={quote}
          quoteLoading={quoteQuery.isLoading}
          onChangeNetwork={setNetwork}
          onChangeCouponInput={setCouponInput}
          onApplyCoupon={(event) => void handleApplyCoupon(event)}
          onRemoveCoupon={() => removeCoupon.mutate()}
          onProceedToCheckout={handleProceedToCheckout}
        />
      </div>

      <RelatedNftsSection
        headingId="also-viewed-heading"
        title="Colecionadores também viram"
        items={relatedItems}
      />
    </div>
  )
}
