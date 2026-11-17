import { Link } from '@tanstack/react-router'
import { AlertCircle, Clock, X } from 'lucide-react'
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
        className="mx-auto max-w-[578px] px-4 py-10 sm:px-6"
      >
        <Skeleton className="h-[640px] w-full" />
      </div>
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <Card role="alert" data-testid="confirmation-error" className="p-10">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-bold text-text-primary">Pedido não encontrado</h1>
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
          <h1 className="mt-4 text-2xl font-bold text-text-primary">
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

  const shortTx = order.txHash
    ? `${order.txHash.slice(0, 6)}…${order.txHash.slice(-4)}`
    : order.id

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-0">
      <div
        data-testid="order-confirmation-receipt"
        className="relative mx-auto w-full max-w-[578px] overflow-hidden bg-bg-secondary shadow-2xl"
      >
        <Link
          to="/"
          aria-label="Fechar confirmação e voltar ao início"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="flex h-[156px] flex-col items-center justify-center gap-[16px] px-6">
          <img
            src="/images/figma/thank-you.svg"
            alt="Thank You"
            width={80}
            height={80}
            className="h-[80px] w-[80px] object-contain"
          />
          <h1 className="text-center text-[16px] font-bold leading-[16px] text-text-secondary">
            Seus NFTs agora estão na sua carteira
          </h1>
          <span data-testid="receipt-order-id" className="sr-only">
            {order.id}
          </span>
        </div>

        <div className="h-px w-full bg-accent" />

        <div className="grid grid-cols-2 gap-4 px-6 py-3 text-text-secondary sm:grid-cols-4 sm:px-[36px]">
          <div className="flex flex-col">
            <span className="text-[14px] font-bold leading-[16px]">ID da transação</span>
            <span data-testid="receipt-tx-hash" className="text-[15px]">
              {shortTx}
            </span>
          </div>
          <div className="flex flex-col sm:border-l sm:border-accent/40 sm:pl-3">
            <span className="text-[14px] leading-[16px]">Data</span>
            <span className="text-[15px]">29 Jul, 2026</span>
          </div>
          <div className="flex flex-col sm:border-l sm:border-accent/40 sm:pl-3">
            <span className="text-[14px] leading-[16px]">Total</span>
            <span className="text-[15px]">{formatEth(order.totalEth)}</span>
          </div>
          <div className="flex flex-col sm:border-l sm:border-accent/40 sm:pl-3">
            <span className="text-[14px] font-bold leading-[16px]">Carteira</span>
            <span className="text-[15px]">{order.wallet.label || 'MetaMask'}</span>
          </div>
        </div>

        <div className="h-px w-full bg-accent" />

        <div className="flex flex-col gap-[16px] px-6 pt-[20px] pb-[36px] sm:px-[44px]">
          <h2 className="text-[15px] font-bold leading-[16px] text-text-primary">
            Detalhes da transação
          </h2>

          <div className="flex items-center justify-between border-b border-accent/35 pb-3 text-[16px] text-text-primary">
            <span className="font-bold">NFTs</span>
            <div className="flex items-center gap-[48px]">
              <span className="font-bold">Edições</span>
              <span className="font-medium">Subtotal</span>
            </div>
          </div>

          <ul className="flex flex-col gap-[12px]">
            {order.lines.map((line) => {
              const tokenNumber = line.nftId.replace(/\D/g, '').padStart(4, '0')
              return (
                <li
                  key={`${line.nftId}_${line.editionId}`}
                  data-testid={`receipt-line-${line.nftId}`}
                  className="flex h-[70px] items-center justify-between bg-bg-secondary"
                >
                  <div className="flex items-center gap-[12px]">
                    <img
                      src={line.image.url}
                      alt={line.image.alt}
                      width={70}
                      height={70}
                      className="h-[70px] w-[70px] rounded-[8px] object-cover"
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
                  <div className="flex items-center gap-[32px] sm:gap-[48px]">
                    <span className="text-[14px] text-text-secondary">(x {line.quantity})</span>
                    <span
                      data-testid={`receipt-line-total-${line.nftId}`}
                      className="text-[18px] font-bold text-accent-bright"
                    >
                      {formatEth(line.lineTotalEth)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="flex flex-col items-end gap-[10px] border-b border-accent/35 pb-4 pt-2">
            <div className="flex w-full max-w-[321px] flex-col gap-[10px]">
              <div className="flex items-center justify-between text-text-primary">
                <span className="text-[15px]">Subtotal</span>
                <span data-testid="receipt-subtotal" className="text-[16px]">
                  {formatEth(order.subtotalEth)}
                </span>
              </div>
              {!isZeroEth(order.discountEth) ? (
                <div className="flex items-center justify-between text-text-primary">
                  <span className="text-[15px]">Desconto</span>
                  <span data-testid="receipt-discount" className="text-[16px] text-emerald-300">
                    - {formatEth(order.discountEth)}
                  </span>
                </div>
              ) : (
                <span data-testid="receipt-discount" className="sr-only">
                  0 ETH
                </span>
              )}
              <div className="flex items-center justify-between text-text-primary">
                <span className="text-[15px]">Taxa de rede</span>
                <span data-testid="receipt-network-fee" className="text-[18px]">
                  {formatEth(order.networkFeeEth)}
                </span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-[16px] text-text-primary">Total</span>
                <span data-testid="receipt-total" className="text-[18px] text-accent-bright">
                  {formatEth(order.totalEth)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-[14px] leading-[22px] text-text-secondary">
            Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para sua
            carteira conectada e registrada na rede.
          </p>

          <div className="mt-2 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-[5px] bg-accent px-6 py-[14px] text-[16px] font-bold leading-[16px] text-bg-primary hover:bg-accent-hover"
            >
              Ver no Etherscan
            </Link>
          </div>
        </div>

        <div className="h-[10px] w-full bg-accent" />
      </div>
    </div>
  )
}
