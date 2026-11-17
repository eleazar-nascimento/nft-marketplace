import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Plug,
  RefreshCw,
  Unplug,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  collectorSchema,
  networkLabels,
  networks,
  walletProviderLabels,
  type Collector,
  type Network,
} from '@/contracts'
import { formatEth, isZeroEth } from '@/lib/eth'
import { readCheckoutDraft, writeCheckoutDraft } from '@/lib/storage'
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

function createIdempotencyKey(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return `idem_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

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
  const [usernameField, setUsernameField] = useState(user?.username ?? 'ana_souza')
  const [secondaryEns, setSecondaryEns] = useState('nova.kurio.eth')
  const [collectorNote, setCollectorNote] = useState('')
  const [useAnotherWallet, setUseAnotherWallet] = useState(false)
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
      const nextErrors: Record<string, string> = {}
      for (const issue of parsedCollector.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
      setFieldErrors(nextErrors)
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
      <div data-testid="checkout-skeleton" className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-0">
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
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="inline-flex h-[35px] w-[35px] items-center justify-center rounded-full border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
            aria-label="Voltar ao carrinho"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <p className="hidden text-[15px] font-bold leading-[16px] text-text-primary lg:block">
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

      {activeOrder && activeOrder.status === 'pending' ? (
        <Card
          role="status"
          aria-live="polite"
          data-testid="order-pending-card"
          className="mt-6 border-accent bg-bg-secondary p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 h-6 w-6 animate-spin text-accent-bright" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Processando pedido <span className="font-mono">{activeOrder.id}</span>
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Aguardando confirmação da simulação na rede {networkLabels[activeOrder.network]}. Você pode
                  recarregar a página ou reconectar sem duplicar a compra.
                </p>
              </div>
            </div>
            <Badge variant="accent">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Pendente (v{activeOrder.version})
            </Badge>
          </div>
        </Card>
      ) : null}

      {activeOrder && activeOrder.status === 'declined' ? (
        <Card
          role="alert"
          data-testid="order-declined-card"
          className="mt-6 border-red-500/80 bg-red-950/60 p-6 text-red-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Pagamento recusado ({activeOrder.id})
                </h2>
                <p className="mt-1 text-sm text-red-200">
                  {activeOrder.declineReason ?? 'A transação não foi autorizada pelo simulador.'} Seus itens
                  foram preservados no carrinho.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              data-testid="order-retry-after-decline"
              onClick={handleRetryAfterDecline}
            >
              Nova tentativa de pagamento
            </Button>
          </div>
        </Card>
      ) : null}

      {hasQuoteIssues ? (
        <div
          role="alert"
          data-testid="checkout-stale-quote-banner"
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[6px] border border-amber-500/80 bg-amber-950/80 p-4 text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-bold">Cotação desatualizada — nova confirmação necessária</p>
              <p className="mt-0.5 text-amber-200">
                {staleQuoteNotice ??
                  'Preço ou disponibilidade mudou enquanto você estava no checkout. Revise e confirme os valores atualizados.'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            data-testid="checkout-acknowledge-quote-btn"
            disabled={acknowledge.isPending}
            onClick={() => void handleAcknowledgeChanges()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Confirmar novos valores
          </Button>
        </div>
      ) : null}

      <form
        onSubmit={(event) => void handleSubmitOrder(event)}
        noValidate
        className="mt-8 flex flex-col items-start justify-between gap-[32px] lg:flex-row"
      >
        <div className="flex w-full flex-1 flex-col gap-[20px]">
          <h2 className="text-[17px] font-bold leading-[16px] text-text-primary">
            Perfil do colecionador
          </h2>

          <div className="grid grid-cols-1 gap-x-[24px] gap-y-[16px] sm:grid-cols-2">
            <div className="flex flex-col">
              <label htmlFor="collector-fullName" className="flex items-center text-[15px] text-text-primary">
                <span>Nome de exibição</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <input
                id="collector-fullName"
                data-testid="collector-fullName"
                value={collector.fullName}
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? 'err-collector-fullName' : undefined}
                onChange={(event) => {
                  setCollector((prev) => ({ ...prev, fullName: event.target.value }))
                  setIdempotencyKey(createIdempotencyKey())
                }}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
              {fieldErrors.fullName ? (
                <p id="err-collector-fullName" role="alert" className="mt-1 text-xs text-red-400">
                  {fieldErrors.fullName}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <label htmlFor="checkout-username-input" className="flex items-center text-[15px] text-text-primary">
                <span>Nome de usuário</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <input
                id="checkout-username-input"
                value={usernameField}
                onChange={(event) => setUsernameField(event.target.value)}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="checkout-network-select" className="flex items-center text-[15px] text-text-primary">
                <span>Rede</span>
                <span className="ml-1 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <select
                id="checkout-network-select"
                data-testid="checkout-network-select"
                value={selectedNetwork}
                onChange={(event) => {
                  setSelectedNetwork(event.target.value as Network)
                  setIdempotencyKey(createIdempotencyKey())
                }}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-bg-primary px-3 text-[14px] text-text-muted focus:border-accent focus:outline-none"
              >
                {networks.map((net) => {
                  const supported = selectedWallet?.networks.includes(net) ?? true
                  return (
                    <option key={net} value={net} disabled={!supported}>
                      {networkLabels[net]} {!supported ? '(não habilitada)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="collector-country" className="flex items-center text-[15px] text-text-primary">
                <span>Nome do perfil</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <input
                id="collector-country"
                data-testid="collector-country"
                value={collector.country}
                aria-invalid={Boolean(fieldErrors.country)}
                aria-describedby={fieldErrors.country ? 'err-collector-country' : undefined}
                onChange={(event) => {
                  setCollector((prev) => ({ ...prev, country: event.target.value }))
                  setIdempotencyKey(createIdempotencyKey())
                }}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
              {fieldErrors.country ? (
                <p id="err-collector-country" role="alert" className="mt-1 text-xs text-red-400">
                  {fieldErrors.country}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <label htmlFor="checkout-wallet-address-view" className="flex items-center text-[15px] text-text-primary">
                <span>Endereço da carteira</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <input
                id="checkout-wallet-address-view"
                readOnly
                value={selectedWallet?.address ?? ''}
                placeholder="Endereço 0x da carteira"
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-muted focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label htmlFor="checkout-secondary-ens" className="sr-only">
                ENS ou carteira secundária
              </label>
              <input
                id="checkout-secondary-ens"
                value={secondaryEns}
                onChange={(event) => setSecondaryEns(event.target.value)}
                placeholder="ENS ou carteira secundária (opcional)"
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-muted placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="checkout-wallet-select-dropdown" className="flex items-center text-[15px] text-text-primary">
                <span>Tipo de carteira</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <select
                id="checkout-wallet-select-dropdown"
                value={effectiveWalletId}
                onChange={(event) => {
                  const nextId = event.target.value
                  setSelectedWalletId(nextId)
                  const nextWallet = wallets.find((w) => w.id === nextId)
                  if (nextWallet && !nextWallet.networks.includes(selectedNetwork)) {
                    setSelectedNetwork(nextWallet.networks[0] ?? 'ethereum')
                  }
                  setIdempotencyKey(createIdempotencyKey())
                }}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-bg-primary px-3 text-[14px] text-text-muted focus:border-accent focus:outline-none"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {walletProviderLabels[w.provider]} ({w.label})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="collector-phone" className="flex items-center text-[15px] text-text-primary">
                <span>Código de indicação</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <input
                id="collector-phone"
                data-testid="collector-phone"
                value={collector.phone}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'err-collector-phone' : undefined}
                onChange={(event) => {
                  setCollector((prev) => ({ ...prev, phone: event.target.value }))
                  setIdempotencyKey(createIdempotencyKey())
                }}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
              {fieldErrors.phone ? (
                <p id="err-collector-phone" role="alert" className="mt-1 text-xs text-red-400">
                  {fieldErrors.phone}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <label htmlFor="collector-email" className="flex items-center text-[15px] text-text-primary">
                <span>E-mail</span>
                <span className="ml-0.5 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <input
                id="collector-email"
                data-testid="collector-email"
                type="email"
                value={collector.email}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'err-collector-email' : undefined}
                onChange={(event) => {
                  setCollector((prev) => ({ ...prev, email: event.target.value }))
                  setIdempotencyKey(createIdempotencyKey())
                }}
                className="h-[40px] w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
              {fieldErrors.email ? (
                <p id="err-collector-email" role="alert" className="mt-1 text-xs text-red-400">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col">
              <label htmlFor="checkout-ens-select" className="flex items-center text-[15px] text-text-primary">
                <span>Nome ENS</span>
                <span className="ml-1 text-[22px] leading-[29px] text-coral">*</span>
              </label>
              <select
                id="checkout-ens-select"
                defaultValue=".eth"
                className="h-[40px] w-[78px] rounded-[3px] border border-border-subtle bg-bg-primary px-2.5 text-[15px] text-text-primary focus:border-accent focus:outline-none"
              >
                <option value=".eth">.eth</option>
                <option value=".xyz">.xyz</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setUseAnotherWallet((prev) => !prev)}
            className="inline-flex items-center gap-[8px] text-left text-[15px] text-text-primary cursor-pointer"
          >
            <span
              className={`inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-accent ${
                useAnotherWallet ? 'bg-accent' : 'bg-transparent'
              }`}
            />
            <span>Usar outra carteira?</span>
          </button>

          <div className="flex flex-col gap-[12px] sm:w-[350px]">
            <label htmlFor="checkout-collector-note" className="text-[15px] text-text-primary">
              Observação do colecionador (opcional)
            </label>
            <textarea
              id="checkout-collector-note"
              value={collectorNote}
              onChange={(event) => setCollectorNote(event.target.value)}
              className="h-[152px] w-full rounded-[3px] border border-border-subtle bg-transparent p-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[3px] border border-border-subtle bg-bg-secondary p-4">
            <div className="flex items-center gap-2 text-sm">
              {isWalletConnectedOnNetwork ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span data-testid="wallet-connection-status" className="text-text-primary">
                    Carteira conectada na rede {networkLabels[selectedNetwork]}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                  <span data-testid="wallet-connection-status" className="text-text-secondary">
                    Carteira desconectada na rede {networkLabels[selectedNetwork]}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isWalletConnectedOnNetwork ? (
                <Button
                  variant="secondary"
                  size="sm"
                  data-testid="checkout-disconnect-wallet-btn"
                  disabled={disconnectWallet.isPending}
                  onClick={() => disconnectWallet.mutate()}
                >
                  <Unplug className="h-4 w-4" aria-hidden="true" />
                  Desconectar
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  data-testid="checkout-connect-wallet-btn"
                  disabled={connectWallet.isPending || !selectedWallet}
                  onClick={() => void handleConnectWallet()}
                >
                  <Plug className="h-4 w-4" aria-hidden="true" />
                  {connectWallet.isPending ? 'Conectando...' : 'Conectar carteira'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-[16px] lg:w-[405px] lg:shrink-0">
          <h2 className="text-[17px] font-bold leading-[16px] text-text-primary">Seus NFTs</h2>

          {quoteQuery.isLoading || !quote ? (
            <div className="space-y-3">
              <Skeleton className="h-[70px] w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-accent/35 pb-3 text-[16px] text-text-primary">
                <span className="font-bold">NFTs</span>
                <span className="font-medium">Subtotal</span>
              </div>

              <ul className="flex flex-col gap-[12px]">
                {quote.lines.map((line) => {
                  const tokenNumber = line.nftId.replace(/\D/g, '').padStart(4, '0')
                  return (
                    <li
                      key={line.lineId}
                      data-testid={`checkout-line-${line.nftId}`}
                      className="flex h-[70px] items-center justify-between bg-bg-secondary pl-[4px] pr-[16px]"
                    >
                      <div className="flex items-center gap-[8px]">
                        <img
                          src={line.image.url}
                          alt={line.image.alt}
                          width={66}
                          height={66}
                          className="h-[66px] w-[66px] rounded-[8px] object-cover"
                        />
                        <div className="flex flex-col gap-[6px]">
                          <p className="text-[16px] font-bold leading-[16px] text-text-primary">
                            {line.name}
                          </p>
                          <p className="text-[14px] leading-[16px] text-text-muted">
                            ID do token: #{tokenNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-[12px]">
                        <span className="text-[14px] text-text-secondary">(x {line.quantity})</span>
                        <span
                          data-testid={`checkout-line-total-${line.nftId}`}
                          className="text-[18px] font-bold text-accent-bright"
                        >
                          {formatEth(line.lineTotalEth)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              <div className="flex flex-col items-center gap-[12px] pt-2">
                <p className="text-center text-[14px] text-text-primary">
                  Tem um código promocional?{' '}
                  <Link to="/cart" className="text-accent-bright hover:underline">
                    Aplique aqui
                  </Link>
                </p>

                <div className="flex w-full items-center justify-between text-text-primary">
                  <span className="text-[15px]">Subtotal</span>
                  <span data-testid="checkout-subtotal" className="text-[18px]">
                    {formatEth(quote.subtotalEth)}
                  </span>
                </div>

                <div className="flex w-full items-center justify-between text-[15px] text-text-primary">
                  <span>Desconto do lançamento</span>
                  <span data-testid="checkout-discount">
                    {isZeroEth(quote.discountEth) ? '(-) 00.00' : `(-) ${formatEth(quote.discountEth)}`}
                  </span>
                </div>

                <div className="flex w-full items-center justify-between text-text-primary">
                  <span className="text-[15px]">Taxa de rede</span>
                  <span data-testid="checkout-network-fee" className="text-[18px]">
                    {formatEth(quote.networkFeeEth)}
                  </span>
                </div>

                <p className="w-full text-center text-[12px] text-accent-bright">Taxa estimada</p>

                <div className="h-px w-full bg-accent/35" />

                <div className="flex w-full max-w-[321px] items-center justify-between font-bold">
                  <span className="text-[16px] text-text-primary">Total</span>
                  <span data-testid="checkout-total" className="text-[18px] text-accent-bright">
                    {formatEth(quote.totalEth)}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="mt-2 flex flex-col gap-[16px]">
            <h3 className="text-center text-[17px] font-bold leading-[16px] text-text-primary">
              Carteira e rede
            </h3>

            <div role="radiogroup" aria-label="Selecione a carteira" className="flex flex-col gap-[12px]">
              <div className="flex h-[45px] items-center gap-[10px] rounded-[3px] border border-border-subtle px-[12px]">
                <span className="h-[16px] w-[16px] rounded-full border border-accent" />
                <div className="flex h-[26px] items-center justify-center rounded-[6px] border border-border-soft bg-surface-dark px-2.5">
                  <span className="text-[9px] font-bold tracking-[0.1px] text-accent-bright">
                    METAMASK • WALLETCONNECT • COINBASE
                  </span>
                </div>
              </div>

              {wallets.map((wallet) => {
                const isSelected = wallet.id === effectiveWalletId
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`checkout-wallet-${wallet.kind}`}
                    onClick={() => {
                      setSelectedWalletId(wallet.id)
                      if (!wallet.networks.includes(selectedNetwork)) {
                        setSelectedNetwork(wallet.networks[0] ?? 'ethereum')
                      }
                      setIdempotencyKey(createIdempotencyKey())
                    }}
                    className={`flex h-[45px] items-center justify-between rounded-[3px] border px-[12px] text-left transition-colors cursor-pointer ${
                      isSelected ? 'border-accent' : 'border-border-subtle hover:border-accent/60'
                    }`}
                  >
                    <div className="flex items-center gap-[10px]">
                      <span
                        className={`flex h-[16px] w-[16px] items-center justify-center rounded-full border border-accent ${
                          isSelected ? 'bg-accent' : 'bg-transparent'
                        }`}
                      />
                      <span className="text-[15px] text-text-primary">
                        {walletProviderLabels[wallet.provider]} ({wallet.label})
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-start gap-2.5 rounded-[3px] border border-border-subtle bg-bg-secondary p-3">
              <input
                id="checkout-review-checkbox"
                data-testid="checkout-review-checkbox"
                type="checkbox"
                checked={reviewConfirmed}
                onChange={(event) => {
                  setReviewConfirmed(event.target.checked)
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    delete next.reviewConfirmed
                    return next
                  })
                }}
                className="mt-0.5 h-4 w-4 accent-accent cursor-pointer"
              />
              <label htmlFor="checkout-review-checkbox" className="cursor-pointer text-xs text-text-secondary">
                Revisei os itens, a carteira selecionada, a rede e a cotação final em ETH.
              </label>
            </div>
            {fieldErrors.reviewConfirmed ? (
              <p role="alert" className="text-xs text-red-400">
                {fieldErrors.reviewConfirmed}
              </p>
            ) : null}

            {submitError ? (
              <div
                role="alert"
                data-testid="checkout-submit-error"
                className="rounded-[3px] border border-red-500/80 bg-red-950/70 p-3 text-xs text-red-100"
              >
                <p className="font-bold">{submitError}</p>
              </div>
            ) : null}

            <button
              type="submit"
              data-testid="checkout-submit-btn"
              disabled={
                createOrder.isPending ||
                activeOrder?.status === 'pending' ||
                hasQuoteIssues ||
                !quote ||
                quote.lines.length === 0
              }
              className="flex h-[45px] w-full items-center justify-center rounded-[8px] bg-accent px-[16px] py-[12px] text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
            >
              {createOrder.isPending
                ? 'Enviando pedido...'
                : activeOrder?.status === 'pending'
                  ? 'Aguardando liquidação...'
                  : submitError
                    ? 'Confirmar compra'
                    : 'Confirmar compra'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
