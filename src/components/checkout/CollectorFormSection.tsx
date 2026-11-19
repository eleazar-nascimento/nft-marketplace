import {
  networkLabels,
  networks,
  walletProviderLabels,
  type Collector,
  type Network,
  type Wallet,
} from '@/contracts'
import { useState } from 'react'

interface CollectorFormSectionProps {
  collector: Collector
  defaultUsername: string
  fieldErrors: Record<string, string>
  wallets: Wallet[]
  effectiveWalletId: string
  selectedWallet: Wallet | null
  selectedNetwork: Network
  onChangeCollectorField: (field: keyof Collector, value: string) => void
  onSelectNetwork: (network: Network) => void
  onSelectWalletId: (walletId: string) => void
}

export function CollectorFormSection({
  collector,
  defaultUsername,
  fieldErrors,
  wallets,
  effectiveWalletId,
  selectedWallet,
  selectedNetwork,
  onChangeCollectorField,
  onSelectNetwork,
  onSelectWalletId,
}: CollectorFormSectionProps) {
  const [usernameField, setUsernameField] = useState(defaultUsername)
  const [secondaryEns, setSecondaryEns] = useState('nova.kurio.eth')
  const [collectorNote, setCollectorNote] = useState('')
  const [useAnotherWallet, setUseAnotherWallet] = useState(false)

  return (
    <div className="hidden min-w-0 w-full flex-1 flex-col gap-5 lg:flex">
      <h2 className="text-[17px] font-bold leading-4 text-text-primary">
        Perfil do colecionador
      </h2>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="collector-fullName" className="flex items-center text-[15px] text-text-primary">
            <span>Nome de exibição</span>
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <input
            id="collector-fullName"
            data-testid="collector-fullName"
            value={collector.fullName}
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={fieldErrors.fullName ? 'err-collector-fullName' : undefined}
            onChange={(event) => onChangeCollectorField('fullName', event.target.value)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
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
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <input
            id="checkout-username-input"
            value={usernameField}
            onChange={(event) => setUsernameField(event.target.value)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="checkout-network-select" className="flex items-center text-[15px] text-text-primary">
            <span>Rede</span>
            <span className="ml-1 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <select
            id="checkout-network-select"
            data-testid="checkout-network-select"
            value={selectedNetwork}
            onChange={(event) => onSelectNetwork(event.target.value as Network)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-bg-primary px-3 text-[14px] text-text-muted focus:border-accent focus:outline-none"
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
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <input
            id="collector-country"
            data-testid="collector-country"
            value={collector.country}
            aria-invalid={Boolean(fieldErrors.country)}
            aria-describedby={fieldErrors.country ? 'err-collector-country' : undefined}
            onChange={(event) => onChangeCollectorField('country', event.target.value)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
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
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <input
            id="checkout-wallet-address-view"
            readOnly
            value={selectedWallet?.address ?? ''}
            placeholder="Endereço 0x da carteira"
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-muted focus:outline-none"
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
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-muted placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="checkout-wallet-select-dropdown" className="flex items-center text-[15px] text-text-primary">
            <span>Tipo de carteira</span>
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <select
            id="checkout-wallet-select-dropdown"
            value={effectiveWalletId}
            onChange={(event) => onSelectWalletId(event.target.value)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-bg-primary px-3 text-[14px] text-text-muted focus:border-accent focus:outline-none"
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
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <input
            id="collector-phone"
            data-testid="collector-phone"
            value={collector.phone}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? 'err-collector-phone' : undefined}
            onChange={(event) => onChangeCollectorField('phone', event.target.value)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
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
            <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <input
            id="collector-email"
            data-testid="collector-email"
            type="email"
            value={collector.email}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'err-collector-email' : undefined}
            onChange={(event) => onChangeCollectorField('email', event.target.value)}
            className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
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
            <span className="ml-1 text-[22px] leading-7.25 text-coral">*</span>
          </label>
          <select
            id="checkout-ens-select"
            defaultValue=".eth"
            className="h-10 w-19.5 rounded-[3px] border border-border-subtle bg-bg-primary px-2.5 text-[15px] text-text-primary focus:border-accent focus:outline-none"
          >
            <option value=".eth">.eth</option>
            <option value=".xyz">.xyz</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setUseAnotherWallet((prev) => !prev)}
        className="inline-flex items-center gap-2 text-left text-[15px] text-text-primary cursor-pointer"
      >
        <span
          className={`inline-flex h-3.75 w-3.75 items-center justify-center rounded-full border border-accent ${
            useAnotherWallet ? 'bg-accent' : 'bg-transparent'
          }`}
        />
        <span>Usar outra carteira?</span>
      </button>

      <div className="flex flex-col gap-3 sm:w-87.5">
        <label htmlFor="checkout-collector-note" className="text-[15px] text-text-primary">
          Observação do colecionador (opcional)
        </label>
        <textarea
          id="checkout-collector-note"
          value={collectorNote}
          onChange={(event) => setCollectorNote(event.target.value)}
          className="h-38 w-full rounded-[3px] border border-border-subtle bg-transparent p-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  )
}
