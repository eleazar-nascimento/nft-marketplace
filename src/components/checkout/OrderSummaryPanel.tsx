import { Link } from '@tanstack/react-router'
import { AlertCircle, CheckCircle2, MoreVertical, Plug, Unplug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  networkLabels,
  networks,
  walletProviderLabels,
  type Network,
  type Order,
  type Quote,
  type Wallet,
} from '@/contracts'
import { formatEth, isZeroEth } from '@/lib/eth'
import { formatTokenNumber } from '@/lib/validation'

interface OrderSummaryPanelProps {
  quote: Quote | undefined
  quoteLoading: boolean
  wallets: Wallet[]
  effectiveWalletId: string
  selectedNetwork: Network
  isWalletConnectedOnNetwork: boolean
  connectWalletPending: boolean
  disconnectWalletPending: boolean
  reviewConfirmed: boolean
  reviewError: string | undefined
  submitError: string | null
  createOrderPending: boolean
  activeOrderStatus: Order['status'] | undefined
  hasQuoteIssues: boolean
  onSelectWallet: (wallet: Wallet) => void
  onSelectNetwork: (network: Network) => void
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  onToggleReviewConfirmed: (checked: boolean) => void
}

const networkShortBadge: Record<Network, string> = {
  ethereum: 'E',
  polygon: 'P',
  base: 'B',
}

export function OrderSummaryPanel({
  quote,
  quoteLoading,
  wallets,
  effectiveWalletId,
  selectedNetwork,
  isWalletConnectedOnNetwork,
  connectWalletPending,
  disconnectWalletPending,
  reviewConfirmed,
  reviewError,
  submitError,
  createOrderPending,
  activeOrderStatus,
  hasQuoteIssues,
  onSelectWallet,
  onSelectNetwork,
  onConnectWallet,
  onDisconnectWallet,
  onToggleReviewConfirmed,
}: OrderSummaryPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 w-full flex-col justify-between gap-4 lg:w-101.25 lg:flex-none lg:shrink-0">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-0.5 lg:overflow-visible lg:pr-0">
        <div className="hidden flex-col gap-4 lg:flex">
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
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold leading-4 text-text-primary lg:text-[17px]">
              <span className="lg:hidden">Carteira conectada</span>
              <span className="hidden lg:inline">Carteira selecionada</span>
            </h3>
            <Link
              to="/wallets"
              className="text-[12px] font-medium text-accent-bright hover:underline lg:hidden"
            >
              Trocar carteira
            </Link>
          </div>

          <div role="radiogroup" aria-label="Selecione a carteira" className="flex flex-col gap-3">
            {wallets.map((wallet) => {
              const isSelected = wallet.id === effectiveWalletId
              const primaryNet = wallet.networks[0] ?? 'ethereum'
              return (
                <button
                  key={wallet.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`checkout-wallet-${wallet.kind}`}
                  onClick={() => onSelectWallet(wallet)}
                  className={`flex items-center justify-between rounded-xl border bg-bg-secondary px-4 py-3 text-left transition-colors lg:h-11.25 lg:rounded-[3px] lg:bg-transparent lg:px-3 lg:py-0 cursor-pointer ${
                    isSelected ? 'border-accent' : 'border-border-subtle hover:border-accent/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-accent ${
                        isSelected ? 'bg-accent/20' : 'bg-transparent'
                      }`}
                    >
                      {isSelected ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-text-primary lg:text-[15px] lg:font-normal">
                        <span className="lg:hidden">{wallet.label}</span>
                        <span className="hidden lg:inline">
                          {walletProviderLabels[wallet.provider]} ({wallet.label})
                        </span>
                      </span>
                      <span className="text-[12px] text-text-secondary lg:hidden">
                        {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                      </span>
                      <span className="text-[12px] text-text-secondary lg:hidden">
                        {walletProviderLabels[wallet.provider]} · Rede {networkLabels[primaryNet]}
                      </span>
                    </div>
                  </div>
                  <span className="hidden text-xs text-text-secondary lg:inline">
                    {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
                  </span>
                  <MoreVertical className="h-4 w-4 text-text-muted lg:hidden" aria-hidden="true" />
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-secondary px-3.5 py-2.5 lg:rounded-[3px] lg:p-3">
            <div className="flex items-center gap-2 text-xs">
              {isWalletConnectedOnNetwork ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <span data-testid="wallet-connection-status" className="text-text-primary">
                    Carteira conectada na rede {networkLabels[selectedNetwork]}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0 text-accent-bright" aria-hidden="true" />
                  <span data-testid="wallet-connection-status" className="text-text-secondary">
                    Carteira desconectada na rede {networkLabels[selectedNetwork]}
                  </span>
                </>
              )}
            </div>

            {isWalletConnectedOnNetwork ? (
              <Button
                variant="secondary"
                size="sm"
                data-testid="checkout-disconnect-wallet-btn"
                disabled={disconnectWalletPending}
                onClick={onDisconnectWallet}
              >
                <Unplug className="h-3.5 w-3.5" aria-hidden="true" />
                Desconectar
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                data-testid="checkout-connect-wallet-btn"
                disabled={connectWalletPending || !wallets.length}
                onClick={onConnectWallet}
              >
                <Plug className="h-3.5 w-3.5" aria-hidden="true" />
                {connectWalletPending ? 'Conectando...' : 'Conectar carteira'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          <h3 className="text-[15px] font-bold leading-4 text-text-primary">Carteira e rede</h3>
          <div role="radiogroup" aria-label="Selecione a rede" className="flex flex-col gap-2.5">
            {networks.map((net) => {
              const supported =
                wallets.find((w) => w.id === effectiveWalletId)?.networks.includes(net) ?? true
              const isSelected = selectedNetwork === net
              return (
                <button
                  key={net}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={!supported}
                  data-testid={`mobile-network-${net}`}
                  onClick={() => onSelectNetwork(net)}
                  className={`flex h-14 items-center justify-between rounded-xl border bg-bg-secondary px-4 text-left transition-colors disabled:opacity-45 cursor-pointer ${
                    isSelected ? 'border-accent' : 'border-border-subtle hover:border-accent/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-bg-elevated text-xs font-bold text-accent-bright">
                      {networkShortBadge[net]}
                    </span>
                    <span className="text-[14px] text-text-primary">
                      {networkLabels[net]} {!supported ? '(não habilitada)' : ''}
                    </span>
                  </div>
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-accent ${
                      isSelected ? 'bg-accent/20' : 'bg-transparent'
                    }`}
                  >
                    {isSelected ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-bg-secondary p-3 lg:rounded-[3px]">
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
            className="rounded-xl border border-red-500/80 bg-red-950/70 p-3 text-xs text-red-100 lg:rounded-[3px]"
          >
            <p className="font-bold">{submitError}</p>
          </div>
        ) : null}
      </div>

      <div className="-mx-4 shrink-0 border-t border-border-subtle/70 bg-bg-primary/95 px-4 pt-3 pb-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:mx-0 lg:border-t-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        {quote ? (
          <div className="mb-3 flex w-full items-center justify-end gap-4 font-bold lg:justify-between">
            <span className="text-[15px] text-text-primary lg:text-[16px]">
              Total<span className="lg:hidden">:</span>
            </span>
            <span data-testid="checkout-total" className="text-[18px] text-accent-bright">
              {formatEth(quote.totalEth)}
            </span>
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
          className="flex h-12 w-full items-center justify-center rounded-full bg-accent px-4 py-3 text-[15px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 lg:h-11.25 lg:rounded-lg cursor-pointer"
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
