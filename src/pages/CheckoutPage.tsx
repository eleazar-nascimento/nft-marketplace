import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plug,
  RefreshCw,
  ShieldCheck,
  Unplug,
  Wallet as WalletIcon,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <div data-testid="checkout-skeleton" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
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
          <h1 className="text-2xl font-bold text-white">Nenhum item para checkout</h1>
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Pagamento e Revisão</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Informe os dados do colecionador, conecte sua carteira na rede desejada e confirme a cotação.
          </p>
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
          className="mt-6 border-accent-bright bg-bg-secondary p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Loader2 className="mt-0.5 h-6 w-6 animate-spin text-accent-bright" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-bold text-white">
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
                <h2 className="text-lg font-bold text-white">
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
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/80 bg-amber-950/80 p-4 text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold">Cotação desatualizada — nova confirmação necessária</p>
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
        className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12"
      >
        <div className="space-y-6 lg:col-span-7">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-white">1. Dados do Colecionador</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="collector-fullName">Nome completo</Label>
                <Input
                  id="collector-fullName"
                  data-testid="collector-fullName"
                  value={collector.fullName}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'err-collector-fullName' : undefined}
                  onChange={(event) => {
                    setCollector((prev) => ({ ...prev, fullName: event.target.value }))
                    setIdempotencyKey(createIdempotencyKey())
                  }}
                  className="mt-1.5 bg-bg-primary"
                />
                {fieldErrors.fullName ? (
                  <p id="err-collector-fullName" role="alert" className="mt-1 text-xs text-red-400">
                    {fieldErrors.fullName}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="collector-email">E-mail para recibo</Label>
                <Input
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
                  className="mt-1.5 bg-bg-primary"
                />
                {fieldErrors.email ? (
                  <p id="err-collector-email" role="alert" className="mt-1 text-xs text-red-400">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="collector-phone">Telefone</Label>
                <Input
                  id="collector-phone"
                  data-testid="collector-phone"
                  value={collector.phone}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? 'err-collector-phone' : undefined}
                  onChange={(event) => {
                    setCollector((prev) => ({ ...prev, phone: event.target.value }))
                    setIdempotencyKey(createIdempotencyKey())
                  }}
                  className="mt-1.5 bg-bg-primary"
                />
                {fieldErrors.phone ? (
                  <p id="err-collector-phone" role="alert" className="mt-1 text-xs text-red-400">
                    {fieldErrors.phone}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="collector-country">País / Região</Label>
                <Input
                  id="collector-country"
                  data-testid="collector-country"
                  value={collector.country}
                  aria-invalid={Boolean(fieldErrors.country)}
                  aria-describedby={fieldErrors.country ? 'err-collector-country' : undefined}
                  onChange={(event) => {
                    setCollector((prev) => ({ ...prev, country: event.target.value }))
                    setIdempotencyKey(createIdempotencyKey())
                  }}
                  className="mt-1.5 bg-bg-primary"
                />
                {fieldErrors.country ? (
                  <p id="err-collector-country" role="alert" className="mt-1 text-xs text-red-400">
                    {fieldErrors.country}
                  </p>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white">2. Carteira e Rede</h2>
              <Link
                to="/wallets"
                className="text-xs font-semibold text-accent-bright underline underline-offset-4 hover:text-white"
              >
                Gerenciar carteiras
              </Link>
            </div>

            {wallets.length === 0 ? (
              <div
                data-testid="checkout-no-wallets"
                className="mt-4 rounded-2xl border border-border-subtle bg-bg-primary p-5 text-sm text-text-secondary"
              >
                <p>Você ainda não possui nenhuma carteira cadastrada para assinatura do pagamento.</p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/wallets">Cadastrar carteira agora</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div role="radiogroup" aria-label="Selecione a carteira" className="grid grid-cols-1 gap-3">
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
                        className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-accent-bright bg-accent/20 text-white'
                            : 'border-border-subtle bg-bg-primary text-text-secondary hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <WalletIcon className="h-5 w-5 text-accent-bright" aria-hidden="true" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{wallet.label}</span>
                              <Badge variant="default">
                                {wallet.kind === 'primary' ? 'Principal' : 'Secundária'}
                              </Badge>
                            </div>
                            <p className="mt-0.5 font-mono text-xs text-text-secondary">
                              {walletProviderLabels[wallet.provider]} · {wallet.address.slice(0, 10)}...
                              {wallet.address.slice(-6)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {wallet.networks.map((net) => (
                            <Badge key={net} variant="accent">
                              {networkLabels[net]}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div>
                  <Label htmlFor="checkout-network-select">Rede da transação</Label>
                  <select
                    id="checkout-network-select"
                    data-testid="checkout-network-select"
                    value={selectedNetwork}
                    onChange={(event) => {
                      setSelectedNetwork(event.target.value as Network)
                      setIdempotencyKey(createIdempotencyKey())
                    }}
                    className="mt-1.5 h-11 w-full rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-white"
                  >
                    {networks.map((net) => {
                      const supported = selectedWallet?.networks.includes(net) ?? true
                      return (
                        <option key={net} value={net} disabled={!supported}>
                          {networkLabels[net]} {!supported ? '(não habilitada nesta carteira)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-primary p-4">
                  <div className="flex items-center gap-2 text-sm">
                    {isWalletConnectedOnNetwork ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                        <span data-testid="wallet-connection-status" className="text-emerald-200">
                          Carteira conectada na rede {networkLabels[selectedNetwork]}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
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
                        variant="secondary"
                        size="sm"
                        data-testid="checkout-connect-wallet-btn"
                        disabled={connectWallet.isPending || !selectedWallet}
                        onClick={() => void handleConnectWallet()}
                      >
                        <Plug className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                        {connectWallet.isPending ? 'Conectando...' : 'Conectar carteira'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-24 p-6">
            <h2 className="text-xl font-bold text-white">3. Revisão do Pedido</h2>

            {quoteQuery.isLoading || !quote ? (
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <ul className="mt-4 divide-y divide-border-subtle">
                  {quote.lines.map((line) => (
                    <li
                      key={line.lineId}
                      data-testid={`checkout-line-${line.nftId}`}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={line.image.url}
                          alt={line.image.alt}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">{line.name}</p>
                          <p className="font-mono text-xs text-text-secondary">
                            {line.editionName} × {line.quantity}
                          </p>
                        </div>
                      </div>
                      <span
                        data-testid={`checkout-line-total-${line.nftId}`}
                        className="font-mono font-semibold text-white"
                      >
                        {formatEth(line.lineTotalEth)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 space-y-2.5 border-t border-border-subtle pt-4 font-mono text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Subtotal</dt>
                    <dd data-testid="checkout-subtotal" className="text-white">
                      {formatEth(quote.subtotalEth)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Desconto</dt>
                    <dd data-testid="checkout-discount" className="text-emerald-300">
                      {isZeroEth(quote.discountEth) ? '0 ETH' : `- ${formatEth(quote.discountEth)}`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">
                      Taxa de rede ({networkLabels[quote.network]})
                    </dt>
                    <dd data-testid="checkout-network-fee" className="text-white">
                      {formatEth(quote.networkFeeEth)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-3 text-base">
                    <dt className="font-bold text-white">Total a pagar</dt>
                    <dd data-testid="checkout-total" className="text-lg font-bold text-accent-bright">
                      {formatEth(quote.totalEth)}
                    </dd>
                  </div>
                </dl>
              </>
            )}

            <div className="mt-5 rounded-2xl border border-border-subtle bg-bg-primary p-3.5">
              <div className="flex items-start gap-2.5">
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
                  className="mt-1 h-4 w-4 accent-accent-bright cursor-pointer"
                />
                <Label htmlFor="checkout-review-checkbox" className="cursor-pointer text-xs leading-relaxed">
                  Revisei os itens, a carteira selecionada, a rede e a cotação final em ETH para envio do
                  pedido.
                </Label>
              </div>
              {fieldErrors.reviewConfirmed ? (
                <p role="alert" className="mt-1.5 text-xs text-red-400">
                  {fieldErrors.reviewConfirmed}
                </p>
              ) : null}
            </div>

            {submitError ? (
              <div
                role="alert"
                data-testid="checkout-submit-error"
                className="mt-4 rounded-2xl border border-red-500/80 bg-red-950/70 p-3.5 text-xs text-red-100"
              >
                <p className="font-semibold">{submitError}</p>
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              data-testid="checkout-submit-btn"
              disabled={
                createOrder.isPending ||
                activeOrder?.status === 'pending' ||
                hasQuoteIssues ||
                !quote ||
                quote.lines.length === 0
              }
              className="mt-5 w-full"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              {createOrder.isPending
                ? 'Enviando pedido...'
                : activeOrder?.status === 'pending'
                  ? 'Aguardando liquidação...'
                  : submitError
                    ? 'Tentar novamente com segurança'
                    : 'Confirmar e enviar pedido'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
