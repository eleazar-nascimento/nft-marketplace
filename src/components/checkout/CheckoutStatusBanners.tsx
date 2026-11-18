import { AlertCircle, AlertTriangle, Clock, Loader2, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { networkLabels, type Order } from '@/contracts'

interface CheckoutStatusBannersProps {
  activeOrder: Order | undefined
  hasQuoteIssues: boolean
  staleQuoteNotice: string | null
  acknowledgePending: boolean
  onRetryAfterDecline: () => void
  onAcknowledgeChanges: () => void
}

export function CheckoutStatusBanners({
  activeOrder,
  hasQuoteIssues,
  staleQuoteNotice,
  acknowledgePending,
  onRetryAfterDecline,
  onAcknowledgeChanges,
}: CheckoutStatusBannersProps) {
  return (
    <>
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
              onClick={onRetryAfterDecline}
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
            disabled={acknowledgePending}
            onClick={onAcknowledgeChanges}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Confirmar novos valores
          </Button>
        </div>
      ) : null}
    </>
  )
}
