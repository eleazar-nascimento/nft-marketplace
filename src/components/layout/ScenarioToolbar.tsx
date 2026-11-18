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
          className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-secondary px-3 py-1.5 text-xs font-mono text-text-secondary hover:bg-bg-elevated hover:text-white cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-accent-bright" aria-hidden="true" />
          <span className="sr-only">Painel de simulação, </span>
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
      <DialogContent className="sm:max-w-xl" closeLabel="Fechar painel de simulação">
        <DialogTitle className="text-sm leading-snug sm:text-xl">
          Painel de Simulação (MSW + Socket.IO)
        </DialogTitle>
        <DialogDescription className="mt-1 text-xs leading-relaxed sm:text-sm">
          Configure condições de rede, falhas determinísticas, eventos em tempo real e restaure o estado inicial.
        </DialogDescription>

        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-bg-primary p-2.5 font-mono text-[11px] sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:rounded-2xl sm:p-3 sm:text-xs">
          <div className="col-span-2 sm:col-span-1">
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
          </div>
          <span data-testid="socket-received-count">Eventos: {stats.receivedCount}</span>
          <span data-testid="socket-reconnect-count">Reconexões: {stats.reconnectCount}</span>
          <span data-testid="socket-duplicate-count">Duplicados ignorados: {stats.ignoredDuplicates}</span>
          <span data-testid="socket-stale-count">Antigos ignorados: {stats.ignoredStale}</span>
        </div>

        <div className="mt-3 sm:mt-4">
          <label
            htmlFor="scenario-preset-select"
            className="block text-xs font-medium text-text-secondary sm:text-sm"
          >
            Preset de cenário
          </label>
          <select
            id="scenario-preset-select"
            data-testid="scenario-preset-select"
            value={preset}
            disabled={busy}
            onChange={(event) => void handlePresetChange(event.target.value as ScenarioPreset)}
            className="mt-1 h-9 w-full rounded-xl border border-border-subtle bg-bg-primary px-2.5 text-xs text-white sm:mt-1.5 sm:h-11 sm:rounded-2xl sm:px-3 sm:text-sm"
          >
            {scenarioPresets.map((item) => (
              <option key={item} value={item}>
                {item} — {scenarioDescriptions[item]}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-1.5 sm:mt-5 sm:grid-cols-2 sm:gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-mutate-price"
            className="h-8 text-xs sm:h-9"
            onClick={() => void handleMutatePrice()}
          >
            <Radio className="h-3.5 w-3.5 shrink-0 text-accent-bright sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="truncate">Subir preço ({targetNftId}) +25%</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-mutate-soldout"
            className="h-8 text-xs sm:h-9"
            onClick={() => void handleMutateSoldOut()}
          >
            <Radio className="h-3.5 w-3.5 shrink-0 text-amber-400 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="truncate">Esgotar edição ({targetNftId})</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-socket-disconnect"
            className="h-8 text-xs sm:h-9"
            onClick={() => void handleDisconnectSocket()}
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="truncate">Cortar conexão Socket.IO</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            data-testid="sim-socket-reconnect"
            className="h-8 text-xs sm:h-9"
            onClick={() => void handleReconnectSocket()}
          >
            <Wifi className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="truncate">Restaurar Socket.IO</span>
          </Button>
          {user ? (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              data-testid="sim-expire-session"
              className="h-8 text-xs sm:h-9"
              onClick={() => void handleExpireSession()}
            >
              <span className="truncate">Expirar sessão atual</span>
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            data-testid="sim-reset-all"
            className="h-8 text-xs sm:h-9"
            onClick={() => void handleReset()}
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="truncate">Resetar estado completo</span>
          </Button>
        </div>

        <div className="mt-3 rounded-xl bg-bg-primary p-2.5 text-[11px] leading-snug text-text-secondary sm:mt-4 sm:rounded-2xl sm:p-3 sm:text-xs">
          <p className="font-semibold text-white">Credenciais de demonstração:</p>
          <p className="mt-1 font-mono break-words">ana@nft.dev / Senha@123 (carteira principal)</p>
          <p className="font-mono break-words">bruno@nft.dev / Senha@123 (segundo usuário)</p>
          <p className="mt-1 font-mono break-words">Cupons: NFT10 (10%), WELCOME15 (15%), EXPIRED20</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
