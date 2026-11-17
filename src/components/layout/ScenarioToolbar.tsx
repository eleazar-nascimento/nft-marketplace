import { useQueryClient } from '@tanstack/react-query'
import { Radio, RefreshCw, SlidersHorizontal, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { authApi, simApi } from '@/api/endpoints'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { scenarioDescriptions, scenarioPresets, type ScenarioPreset } from '@/mocks/scenarios'
import { useNotifications } from '@/state/notifications'
import { useCart } from '@/state/queries'
import { useRealtime } from '@/state/realtime'
import { useSession } from '@/state/session'

export function ScenarioToolbar() {
  const queryClient = useQueryClient()
  const { stats, reconnectNow } = useRealtime()
  const { data: cart } = useCart()
  const { user, refreshSession } = useSession()
  const { notify } = useNotifications()
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<ScenarioPreset>('default')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    void simApi.getState().then((state) => {
      setPreset(state.scenario.preset)
    })
  }, [open])

  const handlePresetChange = async (next: ScenarioPreset) => {
    setBusy(true)
    try {
      const updated = await simApi.setScenario({ preset: next })
      setPreset(updated.preset)
      notify({
        tone: 'info',
        title: `Cenário alterado: ${updated.preset}`,
        description: scenarioDescriptions[updated.preset],
      })
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async () => {
    setBusy(true)
    try {
      const updated = await simApi.reset('default')
      setPreset(updated.preset)
      await queryClient.invalidateQueries()
      notify({
        tone: 'success',
        title: 'Simulação restaurada',
        description: 'Catálogo, carrinhos, carteiras e cenários voltaram ao estado inicial.',
      })
    } finally {
      setBusy(false)
    }
  }

  const targetNftId = cart?.lines[0]?.nftId ?? 'nft_001'
  const targetEditionId = cart?.lines[0]?.editionId

  const handleMutatePrice = async () => {
    setBusy(true)
    try {
      await simApi.mutateNft({
        nftId: targetNftId,
        editionId: targetEditionId,
        priceDeltaPercent: 25,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleMutateSoldOut = async () => {
    setBusy(true)
    try {
      await simApi.mutateNft({
        nftId: targetNftId,
        editionId: targetEditionId,
        available: 0,
      })
    } finally {
      setBusy(false)
    }
  }

  const handleExpireSession = async () => {
    setBusy(true)
    try {
      setOpen(false)
      await authApi.expireSession()
      await refreshSession()
    } finally {
      setBusy(false)
    }
  }

  const handleDisconnectSocket = async () => {
    setBusy(true)
    try {
      await simApi.disconnectSockets(true)
    } finally {
      setBusy(false)
    }
  }

  const handleReconnectSocket = async () => {
    setBusy(true)
    try {
      await simApi.allowSockets()
      reconnectNow()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="scenario-toolbar-trigger"
          aria-label="Abrir painel de simulação MSW e Socket.IO"
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-secondary px-3 py-1.5 text-xs font-mono text-text-secondary hover:bg-bg-elevated hover:text-white cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
          <span className="hidden sm:inline">Cenário:</span>
          <span className="font-semibold text-white" data-testid="active-scenario-label">
            {preset}
          </span>
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${stats.connected ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl" closeLabel="Fechar painel de simulação">
        <DialogTitle>Painel de Simulação (MSW + Socket.IO)</DialogTitle>
        <DialogDescription className="mt-1">
          Configure condições de rede, falhas determinísticas, eventos em tempo real e restaure o estado inicial.
        </DialogDescription>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-bg-primary p-3 text-xs font-mono">
          <Badge variant={stats.connected ? 'success' : 'warning'} data-testid="socket-status-badge">
            {stats.connected ? (
              <>
                <Wifi className="h-3.5 w-3.5" aria-hidden="true" /> Socket conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> Socket desconectado
              </>
            )}
          </Badge>
          <span data-testid="socket-received-count">Eventos: {stats.receivedCount}</span>
          <span data-testid="socket-reconnect-count">Reconexões: {stats.reconnectCount}</span>
          <span data-testid="socket-duplicate-count">Duplicados ignorados: {stats.ignoredDuplicates}</span>
          <span data-testid="socket-stale-count">Antigos ignorados: {stats.ignoredStale}</span>
        </div>

        <div className="mt-4">
          <label htmlFor="scenario-preset-select" className="block text-sm font-medium text-text-secondary">
            Preset de cenário
          </label>
          <select
            id="scenario-preset-select"
            data-testid="scenario-preset-select"
            value={preset}
            disabled={busy}
            onChange={(event) => void handlePresetChange(event.target.value as ScenarioPreset)}
            className="mt-1.5 h-11 w-full rounded-2xl border border-border-subtle bg-bg-primary px-3 text-sm text-white"
          >
            {scenarioPresets.map((item) => (
              <option key={item} value={item}>
                {item} — {scenarioDescriptions[item]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-mutate-price"
            onClick={() => void handleMutatePrice()}
          >
            <Radio className="h-4 w-4 text-accent-bright" aria-hidden="true" />
            Subir preço ({targetNftId}) +25%
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-mutate-soldout"
            onClick={() => void handleMutateSoldOut()}
          >
            <Radio className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Esgotar edição ({targetNftId})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-socket-disconnect"
            onClick={() => void handleDisconnectSocket()}
          >
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            Cortar conexão Socket.IO
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-socket-reconnect"
            onClick={() => void handleReconnectSocket()}
          >
            <Wifi className="h-4 w-4" aria-hidden="true" />
            Restaurar Socket.IO
          </Button>
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              data-testid="sim-expire-session"
              onClick={() => void handleExpireSession()}
            >
              Expirar sessão atual
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            data-testid="sim-reset-all"
            onClick={() => void handleReset()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Resetar estado completo
          </Button>
        </div>

        <div className="mt-4 rounded-2xl bg-bg-primary p-3 text-xs text-text-secondary">
          <p className="font-semibold text-white">Credenciais de demonstração:</p>
          <p className="mt-1 font-mono">ana@nft.dev / Senha@123 (com carteira principal)</p>
          <p className="font-mono">bruno@nft.dev / Senha@123 (segundo usuário)</p>
          <p className="mt-1 font-mono">Cupons: NFT10 (10%), WELCOME15 (15%), EXPIRED20 (expirado)</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
