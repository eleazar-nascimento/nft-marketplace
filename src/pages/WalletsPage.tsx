import { CheckCircle2, Plug, Save, Unplug, Wallet as WalletIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppApiError } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useWalletMutations, useWallets } from '@/state/queries'

interface WalletFormCardProps {
  kind: WalletKind
  existing: Wallet | undefined
  isConnected: boolean
  connectedNetwork: Network | null
}

function WalletFormCard({ kind, existing, isConnected, connectedNetwork }: WalletFormCardProps) {
  const { upsertWallet, connectWallet, disconnectWallet } = useWalletMutations()

  const defaultLabel = kind === 'primary' ? 'Carteira principal' : 'Carteira secundária'
  const [label, setLabel] = useState(existing?.label ?? defaultLabel)
  const [provider, setProvider] = useState<WalletProvider>(existing?.provider ?? 'metamask')
  const [address, setAddress] = useState(existing?.address ?? '')
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
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!next[key]) next[key] = issue.message
      }
      setFieldErrors(next)
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

  return (
    <Card data-testid={`wallet-card-${kind}`} className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20 text-accent-bright">
            <WalletIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">
              {kind === 'primary' ? 'Carteira Principal' : 'Carteira Secundária'}
            </h2>
            <p className="text-xs text-text-secondary">
              {existing ? `Cadastrada (${existing.id})` : 'Ainda não cadastrada'}
            </p>
          </div>
        </div>

        {isConnected && connectedNetwork ? (
          <Badge variant="success" data-testid={`wallet-connected-badge-${kind}`}>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Conectada (
            {networkLabels[connectedNetwork]})
          </Badge>
        ) : (
          <Badge variant="default">{existing ? 'Cadastrada' : 'Nova'}</Badge>
        )}
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`wallet-label-${kind}`}>Identificação da carteira</Label>
            <Input
              id={`wallet-label-${kind}`}
              data-testid={`wallet-label-${kind}`}
              value={label}
              aria-invalid={Boolean(fieldErrors.label)}
              aria-describedby={fieldErrors.label ? `wallet-label-err-${kind}` : undefined}
              onChange={(event) => setLabel(event.target.value)}
              className="mt-1.5 bg-bg-primary"
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

          <div>
            <Label htmlFor={`wallet-provider-${kind}`}>Provedor</Label>
            <select
              id={`wallet-provider-${kind}`}
              data-testid={`wallet-provider-${kind}`}
              value={provider}
              onChange={(event) => setProvider(event.target.value as WalletProvider)}
              className="mt-1.5 h-12 w-full rounded-[20px] border border-border-subtle bg-bg-primary px-4 text-sm text-white"
            >
              {walletProviders.map((prov) => (
                <option key={prov} value={prov}>
                  {walletProviderLabels[prov]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor={`wallet-address-${kind}`}>Endereço público (0x...)</Label>
            <button
              type="button"
              data-testid={`wallet-fill-sample-${kind}`}
              onClick={() => setAddress(sampleAddress)}
              className="text-xs font-semibold text-accent-bright hover:underline cursor-pointer"
            >
              Preencher exemplo válido
            </button>
          </div>
          <Input
            id={`wallet-address-${kind}`}
            data-testid={`wallet-address-${kind}`}
            placeholder="0x..."
            value={address}
            aria-invalid={Boolean(fieldErrors.address)}
            aria-describedby={fieldErrors.address ? `wallet-address-err-${kind}` : undefined}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-1.5 bg-bg-primary font-mono text-sm"
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

        <div>
          <span className="block text-sm font-medium text-text-secondary">Redes habilitadas</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {networks.map((net) => {
              const checked = selectedNetworks.includes(net)
              return (
                <button
                  key={net}
                  type="button"
                  data-testid={`wallet-network-${kind}-${net}`}
                  aria-pressed={checked}
                  onClick={() => toggleNetwork(net)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                    checked
                      ? 'border-accent-bright bg-accent text-white'
                      : 'border-border-subtle bg-bg-primary text-text-secondary hover:text-white'
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

        {fieldErrors.form ? (
          <p role="alert" className="text-xs text-red-400">
            {fieldErrors.form}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="submit"
            data-testid={`wallet-save-${kind}`}
            disabled={upsertWallet.isPending}
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {upsertWallet.isPending
              ? 'Salvando...'
              : existing
                ? 'Atualizar carteira'
                : 'Cadastrar carteira'}
          </Button>

          {existing ? (
            isConnected ? (
              <Button
                variant="secondary"
                size="sm"
                data-testid={`wallet-disconnect-${kind}`}
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
                data-testid={`wallet-connect-${kind}`}
                disabled={connectWallet.isPending}
                onClick={() =>
                  connectWallet.mutate({
                    walletId: existing.id,
                    network: existing.networks[0] ?? 'ethereum',
                  })
                }
              >
                <Plug className="h-4 w-4 text-accent-bright" aria-hidden="true" />
                Simular conexão ({networkLabels[existing.networks[0] ?? 'ethereum']})
              </Button>
            )
          ) : null}
        </div>
      </form>
    </Card>
  )
}

export function WalletsPage() {
  const walletsQuery = useWallets()

  if (walletsQuery.isLoading) {
    return (
      <div data-testid="wallets-skeleton" className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const wallets = walletsQuery.data?.wallets ?? []
  const connection = walletsQuery.data?.connection ?? null
  const primary = wallets.find((wallet) => wallet.kind === 'primary')
  const secondary = wallets.find((wallet) => wallet.kind === 'secondary')

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Carteiras do Colecionador</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Cadastre e edite suas carteiras principal e secundária para utilização nos fluxos de compra.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <WalletFormCard
          key={primary?.updatedAt ?? 'primary-new'}
          kind="primary"
          existing={primary}
          isConnected={Boolean(primary && connection?.walletId === primary.id)}
          connectedNetwork={primary && connection?.walletId === primary.id ? connection.network : null}
        />
        <WalletFormCard
          key={secondary?.updatedAt ?? 'secondary-new'}
          kind="secondary"
          existing={secondary}
          isConnected={Boolean(secondary && connection?.walletId === secondary.id)}
          connectedNetwork={
            secondary && connection?.walletId === secondary.id ? connection.network : null
          }
        />
      </div>
    </div>
  )
}
