import { Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, Clock, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { networkLabels } from '@/contracts'
import { formatEth, isZeroEth } from '@/lib/eth'
import { formatTokenNumber } from '@/lib/validation'
import { HomePage } from '@/pages/HomePage'
import { useOrder } from '@/state/queries'

export function OrderConfirmationPage({ orderId }: { orderId: string }) {
  const orderQuery = useOrder(orderId)
  const navigate = useNavigate()

  const handleClose = useCallback(() => {
    void navigate({ to: '/' })
  }, [navigate])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  if (orderQuery.isLoading) {
    return (
      <div
        data-testid="confirmation-skeleton"
        className="mx-auto max-w-144.5 px-4 py-10 sm:px-6"
      >
        <Skeleton className="h-160 w-full" />
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
    <div className="relative">
      <div aria-hidden="true" inert className="pointer-events-none select-none">
        <HomePage search={{}} onUpdateSearch={() => {}} onResetFilters={() => {}} />
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirmation-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            handleClose()
          }
        }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-xs sm:p-4"
      >
        <div
          data-testid="order-confirmation-receipt"
          className="relative my-auto w-full max-w-144.5 overflow-hidden bg-bg-secondary shadow-2xl"
        >
          <Link
            to="/"
            aria-label="Fechar confirmação e voltar ao início"
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center text-accent hover:text-text-primary sm:right-3.5 sm:top-3.5"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>

          <div className="flex min-h-39 flex-col items-center justify-center gap-3 bg-[#2B1911] px-6 py-5 sm:h-39 sm:gap-4 sm:py-0">
            <img
              src="/images/figma/thank-you.svg"
              alt="Thank You"
              width={66}
              height={80}
              className="h-16 w-13.5 object-contain sm:h-20 sm:w-16.5"
            />
            <h1
              id="order-confirmation-title"
              className="text-center text-[15px] font-bold leading-5 text-text-secondary sm:text-[16px] sm:leading-4"
            >
              Seus NFTs agora estão na sua carteira
            </h1>
            <span data-testid="receipt-order-id" className="sr-only">
              {order.id}
            </span>
          </div>

          <div className="h-px w-full bg-accent" />

          <div className="flex min-h-16.25 w-full items-center bg-[#2B1911]/60 px-4 py-3 sm:px-9 sm:py-2.5">
            <div className="grid w-full grid-cols-2 gap-3 text-text-secondary sm:flex sm:items-center sm:justify-between sm:gap-2">
              <div className="flex min-w-0 flex-col items-start">
                <span className="text-[13px] font-bold leading-4 whitespace-nowrap sm:text-[14px]">
                  ID da transação
                </span>
                <span
                  data-testid="receipt-tx-hash"
                  className="mt-1 text-[14px] leading-none whitespace-nowrap sm:text-[15px]"
                >
                  {shortTx}
                </span>
              </div>

              <div className="hidden h-7.75 w-px shrink-0 bg-accent/60 sm:block" />

              <div className="flex min-w-0 flex-col items-start">
                <span className="text-[13px] leading-4 whitespace-nowrap sm:text-[14px]">Data</span>
                <span className="mt-1 text-[14px] leading-none whitespace-nowrap sm:text-[15px]">
                  29 Jul, 2026
                </span>
              </div>

              <div className="hidden h-7.75 w-px shrink-0 bg-accent/60 sm:block" />

              <div className="flex min-w-0 flex-col items-start">
                <span className="text-[13px] leading-4 whitespace-nowrap sm:text-[14px]">Total</span>
                <span className="mt-1 text-[14px] leading-none whitespace-nowrap sm:text-[15px]">
                  {formatEth(order.totalEth)}
                </span>
              </div>

              <div className="hidden h-7.75 w-px shrink-0 bg-accent/60 sm:block" />

              <div className="flex min-w-0 flex-col items-start">
                <span className="text-[13px] font-bold leading-4 whitespace-nowrap sm:text-[14px]">
                  Carteira
                </span>
                <span className="mt-1 max-w-full truncate text-[14px] leading-none sm:text-[15px]">
                  {order.wallet.label || 'MetaMask'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-accent" />

          <div className="flex flex-col gap-3 px-4 pt-4 pb-6 sm:px-11 sm:pt-5 sm:pb-10">
            <h2 className="text-[15px] font-bold leading-4 text-text-primary">
              Detalhes da transação
            </h2>

            <div className="flex items-center justify-between gap-2 border-b border-accent/35 pb-2.5 text-[13px] leading-4 text-text-primary sm:pb-3 sm:text-[16px]">
              <span className="font-bold">NFTs</span>
              <div className="flex shrink-0 items-center gap-2 sm:gap-12">
                <span className="w-14 text-center font-bold sm:w-auto">Edições</span>
                <span className="w-20 text-right font-medium sm:w-auto">Subtotal</span>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {order.lines.map((line) => {
                const tokenNumber = formatTokenNumber(line.nftId)
                return (
                  <li
                    key={`${line.nftId}_${line.editionId}`}
                    data-testid={`receipt-line-${line.nftId}`}
                    className="flex min-h-14 items-center justify-between gap-2 bg-bg-secondary sm:min-h-17.5 sm:gap-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                      <img
                        src={line.image.url}
                        alt={line.image.alt}
                        width={70}
                        height={70}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover sm:h-17.5 sm:w-17.5"
                      />
                      <div className="flex min-w-0 flex-col gap-1 sm:gap-1.5">
                        <p className="text-[14px] font-bold leading-snug text-text-primary sm:text-[16px] sm:leading-4">
                          {line.name}
                        </p>
                        <p className="text-[11px] leading-snug text-text-muted sm:text-[14px] sm:leading-4">
                          ID do token: #{tokenNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-12">
                      <span className="w-14 text-center text-[13px] text-text-secondary whitespace-nowrap sm:w-auto sm:text-[14px]">
                        (x {line.quantity})
                      </span>
                      <span
                        data-testid={`receipt-line-total-${line.nftId}`}
                        className="w-20 text-right text-[14px] font-bold leading-4 text-accent-bright whitespace-nowrap sm:w-auto sm:text-[18px]"
                      >
                        {formatEth(line.lineTotalEth)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-col items-end gap-3 border-b border-accent/35 pb-4 pt-2">
              <div className="flex w-full flex-col gap-3 sm:max-w-80.25">
                <div className="flex items-center justify-between text-text-primary">
                  <span className="text-[14px] sm:text-[15px]">Subtotal</span>
                  <span data-testid="receipt-subtotal" className="text-[15px] leading-4 sm:text-[16px]">
                    {formatEth(order.subtotalEth)}
                  </span>
                </div>
                {!isZeroEth(order.discountEth) ? (
                  <div className="flex items-center justify-between text-text-primary">
                    <span className="text-[14px] sm:text-[15px]">Desconto</span>
                    <span
                      data-testid="receipt-discount"
                      className="text-[15px] leading-4 text-emerald-300 sm:text-[16px]"
                    >
                      - {formatEth(order.discountEth)}
                    </span>
                  </div>
                ) : (
                  <span data-testid="receipt-discount" className="sr-only">
                    0 ETH
                  </span>
                )}
                <div className="flex items-center justify-between text-text-primary">
                  <span className="text-[14px] sm:text-[15px]">Taxa de rede</span>
                  <span data-testid="receipt-network-fee" className="text-[15px] leading-4 sm:text-[18px]">
                    {formatEth(order.networkFeeEth)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-bold leading-4">
                  <span className="text-[15px] text-text-primary sm:text-[16px]">Total</span>
                  <span data-testid="receipt-total" className="text-[16px] text-accent-bright sm:text-[18px]">
                    {formatEth(order.totalEth)}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-1 text-center text-[13px] leading-5 text-text-secondary sm:text-[14px] sm:leading-5.5">
              Transação confirmada na {networkLabels[order.network]}. A propriedade foi transferida para sua
              carteira conectada e registrada na rede.
            </p>

            <div className="mt-2 flex justify-center">
              <Link
                to="/"
                className="inline-flex w-full items-center justify-center rounded-[5px] bg-accent p-4 text-[16px] font-bold leading-4 text-bg-primary hover:bg-accent-hover sm:w-auto"
              >
                Ver no Etherscan
              </Link>
            </div>
          </div>

          <div className="h-2.5 w-full bg-accent" />
        </div>
      </div>
    </div>
  )
}
