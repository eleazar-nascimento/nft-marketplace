import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { walletProviderLabels, type Order, type Quote, type Wallet } from '@/contracts'
import { formatEth, isZeroEth } from '@/lib/eth'
import { formatTokenNumber } from '@/lib/validation'

interface OrderSummaryPanelProps {
  quote: Quote | undefined
  quoteLoading: boolean
  wallets: Wallet[]
  effectiveWalletId: string
  reviewConfirmed: boolean
  reviewError: string | undefined
  submitError: string | null
  createOrderPending: boolean
  activeOrderStatus: Order['status'] | undefined
  hasQuoteIssues: boolean
  onSelectWallet: (wallet: Wallet) => void
  onToggleReviewConfirmed: (checked: boolean) => void
}

export function OrderSummaryPanel({
  quote,
  quoteLoading,
  wallets,
  effectiveWalletId,
  reviewConfirmed,
  reviewError,
  submitError,
  createOrderPending,
  activeOrderStatus,
  hasQuoteIssues,
  onSelectWallet,
  onToggleReviewConfirmed,
}: OrderSummaryPanelProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:w-101.25 lg:shrink-0">
      <h2 className="text-[17px] font-bold leading-4 text-text-primary">Seus NFTs</h2>

      {quoteLoading || !quote ? (
        <div className="space-y-3">
          <Skeleton className="h-17.5 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-accent/35 pb-3 text-[16px] text-text-primary">
            <span className="font-bold">NFTs</span>
            <span className="font-medium">Subtotal</span>
          </div>

          <ul className="flex flex-col gap-3">
            {quote.lines.map((line) => {
              const tokenNumber = formatTokenNumber(line.nftId)
              return (
                <li
                  key={line.lineId}
                  data-testid={`checkout-line-${line.nftId}`}
                  className="flex h-17.5 items-center justify-between bg-bg-secondary pl-1 pr-4"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={line.image.url}
                      alt={line.image.alt}
                      width={66}
                      height={66}
                      className="h-16.5 w-16.5 rounded-lg object-cover"
                    />
                    <div className="flex flex-col gap-1.5">
                      <p className="text-[16px] font-bold leading-4 text-text-primary">
                        {line.name}
                      </p>
                      <p className="text-[14px] leading-4 text-text-muted">
                        ID do token: #{tokenNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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

          <div className="flex flex-col items-center gap-3 pt-2">
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

            <div className="flex w-full max-w-80.25 items-center justify-between font-bold">
              <span className="text-[16px] text-text-primary">Total</span>
              <span data-testid="checkout-total" className="text-[18px] text-accent-bright">
                {formatEth(quote.totalEth)}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="mt-2 flex flex-col gap-4">
        <h3 className="text-center text-[17px] font-bold leading-4 text-text-primary">
          Carteira e rede
        </h3>

        <div role="radiogroup" aria-label="Selecione a carteira" className="flex flex-col gap-3">
          <div className="flex h-11.25 items-center gap-2.5 rounded-[3px] border border-border-subtle px-3">
            <span className="h-4 w-4 rounded-full border border-accent" />
            <div className="flex h-6.5 items-center justify-center rounded-md border border-border-soft bg-surface-dark px-2.5">
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
                onClick={() => onSelectWallet(wallet)}
                className={`flex h-11.25 items-center justify-between rounded-[3px] border px-3 text-left transition-colors cursor-pointer ${
                  isSelected ? 'border-accent' : 'border-border-subtle hover:border-accent/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border border-accent ${
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
            onChange={(event) => onToggleReviewConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-accent cursor-pointer"
          />
          <label htmlFor="checkout-review-checkbox" className="cursor-pointer text-xs text-text-secondary">
            Revisei os itens, a carteira selecionada, a rede e a cotação final em ETH.
          </label>
        </div>
        {reviewError ? (
          <p role="alert" className="text-xs text-red-400">
            {reviewError}
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
            createOrderPending ||
            activeOrderStatus === 'pending' ||
            hasQuoteIssues ||
            !quote ||
            quote.lines.length === 0
          }
          className="flex h-11.25 w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
        >
          {createOrderPending
            ? 'Enviando pedido...'
            : activeOrderStatus === 'pending'
              ? 'Aguardando liquidação...'
              : 'Confirmar compra'}
        </button>
      </div>
    </div>
  )
}
