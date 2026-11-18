import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { CheckoutStatusBanners } from '@/components/checkout/CheckoutStatusBanners'
import { CollectorFormSection } from '@/components/checkout/CollectorFormSection'
import { OrderSummaryPanel } from '@/components/checkout/OrderSummaryPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { collectorSchema, type Collector, type Network } from '@/contracts'
import { readCheckoutDraft, writeCheckoutDraft } from '@/lib/storage'
import { createIdempotencyKey, zodIssuesToFieldErrors } from '@/lib/validation'
import {
  useCart,
  useCartMutations,
  useCreateOrder,
  useOrder,
  useQuote,
  useWalletMutations,
  useWallets,
} from '@/state/queries'
import { useRealtime } from '@/state/realtime'
import { useSession } from '@/state/session'

export function CheckoutPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const cartQuery = useCart()
  const { acknowledge } = useCartMutations()
  const walletsQuery = useWallets()
  const { connectWallet, disconnectWallet } = useWalletMutations()
  const createOrder = useCreateOrder()
  const { cartAlerts } = useRealtime()

  const userId = user?.id ?? 'guest'
  const savedDraft = readCheckoutDraft(userId)

  const [collector, setCollector] = useState<Collector>(() => ({
    fullName: savedDraft?.collector.fullName ?? user?.name ?? '',
    email: savedDraft?.collector.email ?? user?.email ?? '',
    phone: savedDraft?.collector.phone ?? '+55 11 98765-4321',
    country: savedDraft?.collector.country ?? 'Brasil',
  }))
  const [selectedWalletId, setSelectedWalletId] = useState<string>(savedDraft?.walletId ?? '')
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(savedDraft?.network ?? 'ethereum')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [staleQuoteNotice, setStaleQuoteNotice] = useState<string | null>(null)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => savedDraft?.idempotencyKey ?? createIdempotencyKey(),
  )
  const [activeOrderId, setActiveOrderId] = useState<string | null>(savedDraft?.pendingOrderId ?? null)

  const wallets = walletsQuery.data?.wallets ?? []
  const connection = walletsQuery.data?.connection ?? null

  const effectiveWalletId =
    wallets.find((wallet) => wallet.id === selectedWalletId)?.id ?? wallets[0]?.id ?? ''
  const selectedWallet = wallets.find((wallet) => wallet.id === effectiveWalletId) ?? null

  const cart = cartQuery.data
  const quoteQuery = useQuote(
    selectedNetwork,
    cart?.version ?? 0,
    Boolean(cart && cart.lines.length > 0),
  )
  const orderQuery = useOrder(activeOrderId)
  const activeOrder = orderQuery.data

  useEffect(() => {
    if (!user) return
    writeCheckoutDraft(user.id, {
      collector,
      walletId: effectiveWalletId,
      network: selectedNetwork,
      idempotencyKey,
      pendingOrderId: activeOrderId ?? undefined,
    })
  }, [user, collector, effectiveWalletId, selectedNetwork, idempotencyKey, activeOrderId])

  useEffect(() => {
    if (activeOrder?.status === 'confirmed') {
      if (user) {
        writeCheckoutDraft(user.id, null)
      }
      void navigate({
        to: '/orders/$orderId/confirmation',
        params: { orderId: activeOrder.id },
      })
    }
  }, [activeOrder, navigate, user])

  const quote = quoteQuery.data
  const hasQuoteIssues =
    Boolean(quote && quote.issues.length > 0) ||
    cartAlerts.length > 0 ||
    Boolean(staleQuoteNotice)

  const isWalletConnectedOnNetwork =
    Boolean(selectedWallet) &&
    connection?.walletId === selectedWallet?.id &&
    connection?.network === selectedNetwork

  const handleAcknowledgeChanges = async () => {
    setStaleQuoteNotice(null)
    setSubmitError(null)
    await acknowledge.mutateAsync()
    setIdempotencyKey(createIdempotencyKey())
    await quoteQuery.refetch()
  }

  const handleConnectWallet = async () => {
    if (!selectedWallet) return
    setSubmitError(null)
    try {
      await connectWallet.mutateAsync({ walletId: selectedWallet.id, network: selectedNetwork })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Conexão com a carteira recusada.')
    }
  }

  const handleSubmitOrder = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError(null)

    const parsedCollector = collectorSchema.safeParse(collector)
    if (!parsedCollector.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsedCollector.error))
      return
    }
    setFieldErrors({})

    if (!selectedWallet) {
      setSubmitError('Cadastre e selecione uma carteira antes de enviar o pedido.')
      return
    }

    if (!isWalletConnectedOnNetwork) {
      setSubmitError('Conecte a carteira selecionada na rede escolhida antes de enviar o pedido.')
      return
    }

    if (hasQuoteIssues || !quote) {
      setStaleQuoteNotice('A cotação mudou. Confirme os valores atualizados antes de finalizar.')
      return
    }

    if (!reviewConfirmed) {
      setFieldErrors({ reviewConfirmed: 'Confirme a revisão dos dados e valores do pedido.' })
      return
    }

    try {
      const created = await createOrder.mutateAsync({
        idempotencyKey,
        input: {
          quoteId: quote.id,
          quoteFingerprint: quote.fingerprint,
          walletId: selectedWallet.id,
          network: selectedNetwork,
          collector: parsedCollector.data,
        },
      })
      setActiveOrderId(created.id)
      if (created.status === 'confirmed') {
        if (user) {
          writeCheckoutDraft(user.id, null)
        }
        void navigate({
          to: '/orders/$orderId/confirmation',
          params: { orderId: created.id },
        })
      }
    } catch (error) {
      if (error instanceof AppApiError) {
        if (error.code === 'QUOTE_STALE' || error.code === 'QUOTE_EXPIRED') {
          setStaleQuoteNotice(error.message)
          return
        }
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors)
        }
      }
      setSubmitError(error instanceof Error ? error.message : 'Falha ao enviar o pedido.')
    }
  }

  const handleRetryAfterDecline = () => {
    setActiveOrderId(null)
    setSubmitError(null)
    setIdempotencyKey(createIdempotencyKey())
  }

  if (cartQuery.isLoading || walletsQuery.isLoading) {
    return (
      <div data-testid="checkout-skeleton" className="mx-auto max-w-300 px-4 py-8 sm:px-6 lg:px-0">
        <Skeleton className="h-8 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if ((!cart || cart.lines.length === 0) && !activeOrderId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Card className="p-10">
          <h1 className="text-2xl font-bold text-text-primary">Nenhum item para checkout</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Seu carrinho está vazio. Adicione um NFT antes de prosseguir para o pagamento.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao catálogo</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 px-4 pt-6 sm:px-6 lg:px-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="inline-flex h-8.75 w-8.75 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
            aria-label="Voltar ao carrinho"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <p className="hidden text-[15px] font-bold leading-4 text-text-primary lg:block">
              <Link to="/" className="hover:text-accent-bright">
                Início
              </Link>{' '}
              / Mercado / Pagamento
            </p>
            <h1 className="text-[20px] font-bold text-text-primary lg:sr-only">
              Pagamento com carteira
            </h1>
          </div>
        </div>
        <Badge variant="default" data-testid="checkout-idempotency-badge">
          Chave: {idempotencyKey.slice(0, 14)}
        </Badge>
      </div>

      <CheckoutStatusBanners
        activeOrder={activeOrder}
        hasQuoteIssues={hasQuoteIssues}
        staleQuoteNotice={staleQuoteNotice}
        acknowledgePending={acknowledge.isPending}
        onRetryAfterDecline={handleRetryAfterDecline}
        onAcknowledgeChanges={() => void handleAcknowledgeChanges()}
      />

      <form
        onSubmit={(event) => void handleSubmitOrder(event)}
        noValidate
        className="mt-8 flex flex-col items-start justify-between gap-8 lg:flex-row"
      >
        <CollectorFormSection
          collector={collector}
          defaultUsername={user?.username ?? 'ana_souza'}
          fieldErrors={fieldErrors}
          wallets={wallets}
          effectiveWalletId={effectiveWalletId}
          selectedWallet={selectedWallet}
          selectedNetwork={selectedNetwork}
          isWalletConnectedOnNetwork={isWalletConnectedOnNetwork}
          connectWalletPending={connectWallet.isPending}
          disconnectWalletPending={disconnectWallet.isPending}
          onChangeCollectorField={(field, value) => {
            setCollector((prev) => ({ ...prev, [field]: value }))
            setIdempotencyKey(createIdempotencyKey())
          }}
          onSelectNetwork={(network) => {
            setSelectedNetwork(network)
            setIdempotencyKey(createIdempotencyKey())
          }}
          onSelectWalletId={(nextId) => {
            setSelectedWalletId(nextId)
            const nextWallet = wallets.find((w) => w.id === nextId)
            if (nextWallet && !nextWallet.networks.includes(selectedNetwork)) {
              setSelectedNetwork(nextWallet.networks[0] ?? 'ethereum')
            }
            setIdempotencyKey(createIdempotencyKey())
          }}
          onConnectWallet={() => void handleConnectWallet()}
          onDisconnectWallet={() => disconnectWallet.mutate()}
        />

        <OrderSummaryPanel
          quote={quote}
          quoteLoading={quoteQuery.isLoading}
          wallets={wallets}
          effectiveWalletId={effectiveWalletId}
          reviewConfirmed={reviewConfirmed}
          reviewError={fieldErrors.reviewConfirmed}
          submitError={submitError}
          createOrderPending={createOrder.isPending}
          activeOrderStatus={activeOrder?.status}
          hasQuoteIssues={hasQuoteIssues}
          onSelectWallet={(wallet) => {
            setSelectedWalletId(wallet.id)
            if (!wallet.networks.includes(selectedNetwork)) {
              setSelectedNetwork(wallet.networks[0] ?? 'ethereum')
            }
            setIdempotencyKey(createIdempotencyKey())
          }}
          onToggleReviewConfirmed={(checked) => {
            setReviewConfirmed(checked)
            setFieldErrors((prev) => {
              const next = { ...prev }
              delete next.reviewConfirmed
              return next
            })
          }}
        />
      </form>
    </div>
  )
}
