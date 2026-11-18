import { Link, useNavigate, useRouter } from '@tanstack/react-router'
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
  const router = useRouter()
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
      <div data-testid="cart-page-skeleton" className="mx-auto max-w-300 px-4 py-8 sm:px-6 lg:px-0">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-17.5 w-full" />
            <Skeleton className="h-17.5 w-full" />
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
    <div className="mx-auto flex min-h-dvh w-full max-w-300 flex-col px-4 pt-6 sm:px-6 lg:block lg:min-h-0 lg:px-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 lg:flex-none">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.history.back()
              } else {
                void navigate({ to: '/' })
              }
            }}
            className="inline-flex h-8.75 w-8.75 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary hover:border-accent lg:hidden cursor-pointer"
            aria-label="Voltar à página anterior"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex-1 text-center lg:flex-none lg:text-left">
            <p className="hidden text-[15px] font-bold leading-4 text-text-primary lg:block">
              <Link to="/" className="hover:text-accent-bright">
                Início
              </Link>{' '}
              / Mercado / Carrinho
            </p>
            <h1 className="text-[18px] font-bold text-text-primary lg:sr-only">Carrinho de NFTs</h1>
          </div>
          <div className="w-8.75 shrink-0 lg:hidden" aria-hidden="true" />
        </div>
        <span data-testid="cart-items-badge" className="hidden text-xs text-text-secondary sm:inline">
          {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {hasQuoteIssues ? (
        <div
          role="alert"
          data-testid="cart-issues-banner"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-md border border-amber-500/70 bg-amber-950/80 p-4 text-amber-100"
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

      <div className="mt-6 flex flex-1 flex-col items-start justify-between gap-8 lg:flex-row lg:gap-10">
        <div className="w-full lg:w-195.5">
          <div className="hidden items-center justify-between border-b border-accent/35 pb-3 pr-6 text-[16px] text-text-primary sm:flex">
            <span className="w-62.5 font-bold">NFTs</span>
            <span className="w-22.5 font-medium">Preço</span>
            <span className="w-23.75 font-bold text-center">Edições</span>
            <span className="w-25 font-medium">Total</span>
            <span className="w-6" />
          </div>

          <div className="mt-3 flex flex-col gap-3">
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
                  className="flex items-center justify-between gap-3 rounded-xl bg-bg-secondary p-2.5 sm:h-17.5 sm:rounded-none sm:p-0 sm:pr-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none sm:w-62.5 sm:gap-4">
                    <Link
                      to="/nft/$nftId"
                      params={{ nftId: line.nftId }}
                      className="h-19 w-19 shrink-0 overflow-hidden rounded-lg sm:h-17.5 sm:w-17.5 sm:rounded-md"
                    >
                      <img
                        src={line.image.url}
                        alt={line.image.alt}
                        width={76}
                        height={76}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: line.nftId }}
                        className="truncate text-[14px] font-bold leading-4 text-text-primary hover:text-accent-bright sm:text-[16px]"
                      >
                        {line.name}
                      </Link>
                      <p className="text-[12px] leading-4 text-text-muted sm:hidden">
                        Edição: {line.editionName}
                      </p>
                      <p className="hidden text-[14px] leading-4 text-text-muted sm:block">
                        ID do token: #{tokenNumber}
                      </p>
                      <p className="text-[14px] font-bold leading-4 text-accent-bright sm:hidden">
                        {formatEth(mulEth(line.unitPriceEth, line.quantity))}
                      </p>
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

                  <div className="flex shrink-0 items-center justify-end gap-2 sm:flex-1 sm:justify-between sm:gap-4">
                    <span
                      data-testid={`cart-line-unit-price-${line.nftId}`}
                      className="hidden text-[16px] font-bold leading-4 text-text-secondary sm:inline sm:w-22.5"
                    >
                      {formatEth(line.unitPriceEth)}
                    </span>

                    <div className="flex items-center justify-center gap-2 sm:w-23.75 sm:gap-3">
                      <button
                        type="button"
                        data-testid={`cart-qty-decrease-${line.nftId}`}
                        aria-label={`Diminuir quantidade de ${line.name}`}
                        disabled={line.quantity <= 1 || updateItem.isPending}
                        onClick={() =>
                          updateItem.mutate({ lineId: line.id, quantity: Math.max(1, line.quantity - 1) })
                        }
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-accent-bright disabled:opacity-40 sm:h-7.5 sm:w-5 sm:rounded-[20px] sm:border-bg-primary sm:bg-accent sm:text-bg-primary cursor-pointer"
                      >
                        <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                      </button>
                      <span
                        data-testid={`cart-qty-value-${line.nftId}`}
                        className="min-w-4 text-center text-[14px] leading-6 text-text-primary sm:text-[17px]"
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
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-accent-bright disabled:opacity-40 sm:h-7.5 sm:w-5 sm:rounded-[20px] sm:border-bg-primary sm:bg-accent sm:text-bg-primary cursor-pointer"
                      >
                        <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <span
                      data-testid={`cart-line-total-${line.nftId}`}
                      className="hidden text-[16px] font-bold leading-4 text-accent-bright sm:inline sm:w-25"
                    >
                      {formatEth(mulEth(line.unitPriceEth, line.quantity))}
                    </span>

                    <button
                      type="button"
                      data-testid={`cart-remove-${line.nftId}`}
                      aria-label={`Remover ${line.name} do carrinho`}
                      disabled={removeItem.isPending}
                      onClick={() => removeItem.mutate(line.id)}
                      className="inline-flex h-6 w-6 items-center justify-center text-text-secondary hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
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

      <div className="hidden lg:block">
        <RelatedNftsSection
          headingId="also-viewed-heading"
          title="Colecionadores também viram"
          items={relatedItems}
        />
      </div>
    </div>
  )
}
