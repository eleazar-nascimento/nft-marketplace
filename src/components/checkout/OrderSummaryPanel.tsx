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
    <div className="flex w-full flex-col gap-[16px] lg:w-[405px] lg:shrink-0">
      <h2 className="text-[17px] font-bold leading-[16px] text-text-primary">Seus NFTs</h2>

      {quoteLoading || !quote ? (
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
              const tokenNumber = formatTokenNumber(line.nftId)
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
                onClick={() => onSelectWallet(wallet)}
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
          className="flex h-[45px] w-full items-center justify-center rounded-[8px] bg-accent px-[16px] py-[12px] text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
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
