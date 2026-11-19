import { CheckCircle2, Plug, Unplug } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { AccountSidebar } from '@/components/account/AccountSidebar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  networkLabels,
  networks,
  walletProviderLabels,
  walletProviders,
  walletSchema,
  type Network,
  type Wallet,
  type WalletKind,
  type WalletProvider,
} from '@/contracts'
import { zodIssuesToFieldErrors } from '@/lib/validation'
import { useNotifications } from '@/state/notifications'
import { useWalletMutations, useWallets } from '@/state/queries'
import { useSession } from '@/state/session'

interface WalletFormSectionProps {
  kind: WalletKind
  existing: Wallet | undefined
  primaryWallet?: Wallet
  isConnected: boolean
  connectedNetwork: Network | null
}

function WalletFormSection({
  kind,
  existing,
  primaryWallet,
  isConnected,
  connectedNetwork,
}: WalletFormSectionProps) {
  const { user } = useSession()
  const { notify } = useNotifications()
  const { upsertWallet, connectWallet, disconnectWallet } = useWalletMutations()
  const addressInputRef = useRef<HTMLInputElement | null>(null)

  const defaultLabel = kind === 'primary' ? 'Carteira principal' : 'Carteira secundária'
  const [displayName, setDisplayName] = useState(user?.name ?? 'Ana Souza')
  const [label, setLabel] = useState(existing?.label ?? defaultLabel)
  const [provider, setProvider] = useState<WalletProvider>(existing?.provider ?? 'metamask')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [secondaryRef, setSecondaryRef] = useState('')
  const [profileTag, setProfileTag] = useState(user?.username ?? 'ana_souza')
  const [referralCode, setReferralCode] = useState('KURIO2026')
  const [emailField, setEmailField] = useState(user?.email ?? 'ana@nft.dev')
  const [ensName, setEnsName] = useState('kurio')
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [selectedNetworks, setSelectedNetworks] = useState<Network[]>(
    existing?.networks ?? ['ethereum'],
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const toggleNetwork = (network: Network) => {
    setSelectedNetworks((current) =>
      current.includes(network) ? current.filter((item) => item !== network) : [...current, network],
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = walletSchema.safeParse({
      kind,
      label,
      provider,
      address,
      networks: selectedNetworks,
    })

    if (!parsed.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsed.error))
      return
    }
    setFieldErrors({})

    try {
      await upsertWallet.mutateAsync({
        walletId: existing?.id,
        input: parsed.data,
      })
    } catch (error) {
      if (error instanceof AppApiError && error.fieldErrors) {
        setFieldErrors(error.fieldErrors)
      } else {
        setFieldErrors({
          form: error instanceof Error ? error.message : 'Falha ao salvar carteira.',
        })
      }
    }
  }

  const sampleAddress =
    kind === 'primary'
      ? '0x8f3a21c6b4e9d7a05f1c2b3d4e5f60718293a4b5'
      : '0x4b7e91d0c3a2f8e5162738495a6b7c8d9e0f1a2b'

  const handleToggleSameAsPrimary = () => {
    const next = !sameAsPrimary
    setSameAsPrimary(next)
    setFieldErrors({})
    if (next && primaryWallet) {
      setProvider(primaryWallet.provider)
      setSelectedNetworks([...primaryWallet.networks])
      if (!label.trim()) setLabel('Carteira secundária')
      if (!address.trim()) setAddress(sampleAddress)
      notify({
        tone: 'info',
        title: 'Configuração copiada da carteira principal',
        description: 'Provedor e redes habilitadas sincronizados com a carteira principal.',
      })
    } else if (!next) {
      setProvider('metamask')
      setSelectedNetworks(['ethereum'])
    }
  }

  const handleQuickFill = () => {
    setAddress(sampleAddress)
    if (!label.trim()) setLabel(defaultLabel)
    setFieldErrors({})
    addressInputRef.current?.focus()
    notify({
      tone: 'info',
      title: 'Endereço de carteira preenchido',
      description: 'Revise as redes habilitadas e clique em Salvar carteira.',
    })
  }

  return (
    <div data-testid={`wallet-card-${kind}`} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[17px] font-bold leading-4 text-text-primary">
            {kind === 'primary' ? 'Carteira principal' : 'Carteira secundária'}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {isConnected && connectedNetwork ? (
              <Badge variant="success" data-testid={`wallet-connected-badge-${kind}`}>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Conectada (
                {networkLabels[connectedNetwork]})
              </Badge>
            ) : null}
            {kind === 'secondary' ? (
              <button
                type="button"
                role="switch"
                aria-checked={sameAsPrimary}
                data-testid="wallet-same-as-primary"
                onClick={handleToggleSameAsPrimary}
                className="inline-flex items-center gap-2 text-[14px] text-text-primary hover:text-accent-bright cursor-pointer"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-accent"
                >
                  {sameAsPrimary ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
                </span>
                <span>Igual à carteira principal</span>
              </button>
            ) : null}
            <button
              type="button"
              data-testid={`wallet-fill-sample-${kind}`}
              onClick={handleQuickFill}
              className="text-[16px] font-medium leading-4 text-accent-bright hover:underline cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>
        <p className="text-[14px] leading-3.75 text-text-secondary">
          {kind === 'primary'
            ? 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.'
            : existing
              ? `Carteira secundária cadastrada (${existing.address.slice(0, 10)}…).`
              : 'Você ainda não adicionou uma carteira secundária.'}
        </p>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-x-7 gap-y-4.5 sm:grid-cols-2">
          <div className="flex flex-col">
            <label htmlFor={`wallet-display-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Nome de exibição</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <input
              id={`wallet-display-${kind}`}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-label-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Apelido da carteira</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <input
              id={`wallet-label-${kind}`}
              data-testid={`wallet-label-${kind}`}
              value={label}
              aria-invalid={Boolean(fieldErrors.label)}
              aria-describedby={fieldErrors.label ? `wallet-label-err-${kind}` : undefined}
              onChange={(event) => setLabel(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
            {fieldErrors.label ? (
              <p
                id={`wallet-label-err-${kind}`}
                role="alert"
                data-testid={`wallet-label-err-${kind}`}
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.label}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col">
            <span className="flex items-center text-[15px] text-text-primary">
              <span>Rede</span>
              <span className="ml-1 text-[22px] leading-7.25 text-coral">*</span>
            </span>
            <div className="flex h-10 items-center gap-2 rounded-[3px] border border-border-subtle px-3">
              {networks.map((net) => {
                const checked = selectedNetworks.includes(net)
                return (
                  <button
                    key={net}
                    type="button"
                    data-testid={`wallet-network-${kind}-${net}`}
                    aria-pressed={checked}
                    onClick={() => toggleNetwork(net)}
                    className={`rounded-[3px] px-2 py-0.5 text-xs transition-colors cursor-pointer ${
                      checked
                        ? 'bg-accent font-bold text-bg-primary'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {networkLabels[net]}
                  </button>
                )
              })}
            </div>
            {fieldErrors.networks ? (
              <p
                role="alert"
                data-testid={`wallet-networks-err-${kind}`}
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.networks}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-profile-tag-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Nome do perfil</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <input
              id={`wallet-profile-tag-${kind}`}
              value={profileTag}
              onChange={(event) => setProfileTag(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-address-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Endereço da carteira</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <input
              ref={addressInputRef}
              id={`wallet-address-${kind}`}
              data-testid={`wallet-address-${kind}`}
              placeholder="Endereço 0x da carteira"
              value={address}
              aria-invalid={Boolean(fieldErrors.address)}
              aria-describedby={fieldErrors.address ? `wallet-address-err-${kind}` : undefined}
              onChange={(event) => setAddress(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            {fieldErrors.address ? (
              <p
                id={`wallet-address-err-${kind}`}
                role="alert"
                data-testid={`wallet-address-err-${kind}`}
                className="mt-1 text-xs text-red-400"
              >
                {fieldErrors.address}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col justify-end">
            <label htmlFor={`wallet-secondary-ref-${kind}`} className="sr-only">
              ENS ou carteira secundária
            </label>
            <input
              id={`wallet-secondary-ref-${kind}`}
              value={secondaryRef}
              onChange={(event) => setSecondaryRef(event.target.value)}
              placeholder="ENS ou carteira secundária (opcional)"
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-provider-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Tipo de carteira</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <select
              id={`wallet-provider-${kind}`}
              data-testid={`wallet-provider-${kind}`}
              value={provider}
              onChange={(event) => setProvider(event.target.value as WalletProvider)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-bg-primary px-3 text-[14px] text-text-muted focus:border-accent focus:outline-none"
            >
              {walletProviders.map((prov) => (
                <option key={prov} value={prov}>
                  {walletProviderLabels[prov]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-referral-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Código de indicação</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <input
              id={`wallet-referral-${kind}`}
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-email-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>E-mail</span>
              <span className="ml-0.5 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <input
              id={`wallet-email-${kind}`}
              type="email"
              value={emailField}
              onChange={(event) => setEmailField(event.target.value)}
              className="h-10 w-full rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor={`wallet-ens-${kind}`} className="flex items-center text-[15px] text-text-primary">
              <span>Nome ENS</span>
              <span className="ml-1 text-[22px] leading-7.25 text-coral">*</span>
            </label>
            <div className="flex gap-2.5">
              <select
                aria-label="Sufixo ENS"
                defaultValue=".eth"
                className="h-10 w-19.5 shrink-0 rounded-[3px] border border-border-subtle bg-bg-primary px-2 text-[15px] text-text-primary focus:border-accent focus:outline-none"
              >
                <option value=".eth">.eth</option>
                <option value=".xyz">.xyz</option>
              </select>
              <input
                id={`wallet-ens-${kind}`}
                value={ensName}
                onChange={(event) => setEnsName(event.target.value)}
                className="h-10 flex-1 rounded-[3px] border border-border-subtle bg-transparent px-3 text-[14px] text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        </div>

        {fieldErrors.form ? (
          <p role="alert" className="text-xs text-red-400">
            {fieldErrors.form}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            data-testid={`wallet-save-${kind}`}
            disabled={upsertWallet.isPending}
            className="inline-flex h-10 min-w-32.75 items-center justify-center rounded-[3px] bg-accent px-4 text-[14px] font-bold text-bg-primary hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
          >
            {upsertWallet.isPending ? 'Salvando...' : 'Salvar carteira'}
          </button>

          {existing ? (
            isConnected ? (
              <button
                type="button"
                data-testid={`wallet-disconnect-${kind}`}
                disabled={disconnectWallet.isPending}
                onClick={() => disconnectWallet.mutate()}
                className="inline-flex h-10 items-center gap-1.5 rounded-[3px] border border-border-subtle bg-bg-secondary px-4 text-xs font-bold text-text-primary hover:border-accent cursor-pointer"
              >
                <Unplug className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid={`wallet-connect-${kind}`}
                disabled={connectWallet.isPending}
                onClick={() =>
                  connectWallet.mutate({
                    walletId: existing.id,
                    network: existing.networks[0] ?? 'ethereum',
                  })
                }
                className="inline-flex h-10 items-center gap-1.5 rounded-[3px] border border-accent px-4 text-xs font-bold text-accent-bright hover:bg-accent/15 cursor-pointer"
              >
                <Plug className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simular conexão ({networkLabels[existing.networks[0] ?? 'ethereum']})</span>
              </button>
            )
          ) : null}
        </div>
      </form>
    </div>
  )
}

export function WalletsPage() {
  const { logout } = useSession()
  const walletsQuery = useWallets()

  if (walletsQuery.isLoading) {
    return (
      <div data-testid="wallets-skeleton" className="mx-auto max-w-300 px-4 py-8 sm:px-6 lg:px-0">
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 lg:col-span-3" />
          <Skeleton className="h-96 lg:col-span-9" />
        </div>
      </div>
    )
  }

  const wallets = walletsQuery.data?.wallets ?? []
  const connection = walletsQuery.data?.connection ?? null
  const primary = wallets.find((wallet) => wallet.kind === 'primary')
  const secondary = wallets.find((wallet) => wallet.kind === 'secondary')

  return (
    <div className="mx-auto w-full max-w-300 px-4 pt-5 pb-6 sm:px-6 lg:px-0 lg:pt-8 lg:pb-0">
      <div className="flex flex-col items-start gap-7 lg:flex-row">
        <AccountSidebar activeSection="wallets" onLogout={() => void logout()} />

        <div className="flex w-full flex-1 flex-col gap-10">
          <WalletFormSection
            key={primary?.updatedAt ?? 'primary-new'}
            kind="primary"
            existing={primary}
            isConnected={Boolean(primary && connection?.walletId === primary.id)}
            connectedNetwork={primary && connection?.walletId === primary.id ? connection.network : null}
          />

          <div className="h-px w-full bg-border-subtle" />

          <WalletFormSection
            key={secondary?.updatedAt ?? 'secondary-new'}
            kind="secondary"
            existing={secondary}
            primaryWallet={primary}
            isConnected={Boolean(secondary && connection?.walletId === secondary.id)}
            connectedNetwork={
              secondary && connection?.walletId === secondary.id ? connection.network : null
            }
          />
        </div>
      </div>
    </div>
  )
}
