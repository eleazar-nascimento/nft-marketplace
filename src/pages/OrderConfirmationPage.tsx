import { Link } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Receipt, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels } from '@/contracts'
import { formatEth, isZeroEth } from '@/lib/eth'
import { useOrder } from '@/state/queries'

export function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const orderQuery = useOrder(orderId)

  if (orderQuery.isLoading) {
    return (
      <div
        data-testid="confirmation-skeleton"
        className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <Skeleton className="h-40 w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Card role="alert" data-testid="confirmation-error" className="p-10">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-white">Pedido não encontrado</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {orderQuery.error instanceof Error
              ? orderQuery.error.message
              : 'Não foi possível localizar o recibo solicitado.'}
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Voltar ao catálogo</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const order = orderQuery.data

  if (order.status !== 'confirmed') {
    const isPending = order.status === 'pending'
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Card
          role="alert"
          data-testid="confirmation-not-confirmed"
          className="p-10"
        >
          {isPending ? (
            <Clock className="mx-auto h-12 w-12 text-amber-400" aria-hidden="true" />
          ) : (
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
          )}
          <h1 className="mt-4 text-2xl font-bold text-white">
            {isPending ? 'Pedido ainda pendente' : 'Pedido recusado'}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {isPending
              ? 'Este pedido ainda está em processamento na simulação. O recibo definitivo só é emitido após a confirmação.'
              : (order.declineReason ?? 'O pagamento deste pedido foi recusado e nenhuma cobrança foi efetivada.')}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/checkout">Voltar ao pagamento</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/cart">Ver carrinho</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Card data-testid="order-confirmation-receipt" className="p-6 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <Badge variant="success">Pedido confirmado</Badge>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Compra Concluída com Sucesso
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Este recibo reproduz o snapshot imutável do seu pedido no momento da confirmação.
              </p>
            </div>
          </div>

          <div className="font-mono text-xs text-text-secondary sm:text-right">
            <span className="block text-text-muted">Identificador do pedido</span>
            <span data-testid="receipt-order-id" className="text-sm font-bold text-white">
              {order.id}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-border-subtle bg-bg-primary p-5 font-mono text-xs sm:grid-cols-2">
          <div>
            <dt className="text-text-muted">Hash da transação (simulado)</dt>
            <dd data-testid="receipt-tx-hash" className="mt-1 break-all font-semibold text-white">
              {order.txHash}
            </dd>
            {order.explorerUrl ? (
              <span className="mt-1.5 inline-flex items-center gap-1 text-accent-bright">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Referência simulada ({networkLabels[order.network]})
              </span>
            ) : null}
          </div>

          <div>
            <dt className="text-text-muted">Carteira e Rede</dt>
            <dd className="mt-1 font-semibold text-white">
              {order.wallet.label} ({networkLabels[order.network]})
            </dd>
            <dd className="mt-0.5 truncate text-text-secondary">{order.wallet.address}</dd>
          </div>

          <div>
            <dt className="text-text-muted">Colecionador</dt>
            <dd className="mt-1 font-semibold text-white">{order.collector.fullName}</dd>
            <dd className="mt-0.5 text-text-secondary">
              {order.collector.email} · {order.collector.country}
            </dd>
          </div>

          <div>
            <dt className="text-text-muted">Chave de idempotência</dt>
            <dd className="mt-1 font-semibold text-white">{order.idempotencyKey}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Receipt className="h-5 w-5 text-accent-bright" aria-hidden="true" />
            Itens Adquiridos
          </h2>
          <ul className="mt-4 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-bg-primary px-5">
            {order.lines.map((line) => (
              <li
                key={`${line.nftId}_${line.editionId}`}
                data-testid={`receipt-line-${line.nftId}`}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={line.image.url}
                    alt={line.image.alt}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-white">{line.name}</p>
                    <p className="font-mono text-xs text-text-secondary">
                      Edição {line.editionName} · {line.quantity} × {formatEth(line.unitPriceEth)}
                    </p>
                  </div>
                </div>
                <span
                  data-testid={`receipt-line-total-${line.nftId}`}
                  className="font-mono text-sm font-bold text-white"
                >
                  {formatEth(line.lineTotalEth)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-6 space-y-2.5 border-t border-border-subtle pt-5 font-mono text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Subtotal</dt>
            <dd data-testid="receipt-subtotal" className="text-white">
              {formatEth(order.subtotalEth)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">
              Desconto {order.couponCode ? `(${order.couponCode})` : ''}
            </dt>
            <dd data-testid="receipt-discount" className="text-emerald-300">
              {isZeroEth(order.discountEth) ? '0 ETH' : `- ${formatEth(order.discountEth)}`}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Taxa de rede ({networkLabels[order.network]})</dt>
            <dd data-testid="receipt-network-fee" className="text-white">
              {formatEth(order.networkFeeEth)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-border-subtle pt-3 text-base">
            <dt className="font-bold text-white">Total liquidado</dt>
            <dd data-testid="receipt-total" className="text-xl font-bold text-accent-bright">
              {formatEth(order.totalEth)}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Button variant="secondary" asChild>
            <Link to="/cart">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Voltar ao carrinho
            </Link>
          </Button>
          <Button asChild>
            <Link to="/">Continuar explorando o catálogo</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
