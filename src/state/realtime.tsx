import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  Cart,
  ClientToServerEvents,
  FeaturedNft,
  NftDetail,
  NftSummary,
  NftUpdatedEvent,
  Order,
  OrderUpdatedEvent,
  Paginated,
  ServerToClientEvents,
} from '@/contracts'
import { formatEth } from '@/lib/eth'
import { useNotifications } from './notifications'
import { queryKeys } from './queryKeys'
import { useSession } from './session'

export interface RealtimeStats {
  connected: boolean
  reconnectCount: number
  receivedCount: number
  ignoredDuplicates: number
  ignoredStale: number
  lastEventId: string | null
}

export interface CartRealtimeAlert {
  id: string
  scope: string
  nftId: string
  nftName: string
  message: string
  occurredAt: string
}

interface RealtimeContextValue {
  stats: RealtimeStats
  cartAlerts: CartRealtimeAlert[]
  dismissCartAlert: (id: string) => void
  clearCartAlerts: () => void
  recordResourceVersion: (resourceType: 'nft' | 'order', id: string, version: number) => void
  reconnectNow: () => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { session, scope, refreshSession } = useSession()
  const { notify } = useNotifications()

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const seenEventsRef = useRef<Set<string>>(new Set())
  const versionsRef = useRef<Map<string, number>>(new Map())
  const hadConnectedRef = useRef(false)
  const sessionRef = useRef(session)
  const scopeRef = useRef(scope)

  const [stats, setStats] = useState<RealtimeStats>({
    connected: false,
    reconnectCount: 0,
    receivedCount: 0,
    ignoredDuplicates: 0,
    ignoredStale: 0,
    lastEventId: null,
  })
  const [cartAlerts, setCartAlerts] = useState<CartRealtimeAlert[]>([])

  useEffect(() => {
    sessionRef.current = session
    scopeRef.current = scope
  }, [session, scope])

  const recordResourceVersion = useCallback(
    (resourceType: 'nft' | 'order', id: string, version: number) => {
      const key = `${resourceType}:${id}`
      const current = versionsRef.current.get(key) ?? 0
      if (version > current) {
        versionsRef.current.set(key, version)
      }
    },
    [],
  )

  const dismissCartAlert = useCallback((id: string) => {
    setCartAlerts((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearCartAlerts = useCallback(() => {
    setCartAlerts([])
  }, [])

  useEffect(() => {
    versionsRef.current.forEach((_version, key) => {
      if (key.startsWith('order:')) {
        versionsRef.current.delete(key)
      }
    })
    if (socketRef.current?.connected) {
      socketRef.current.emit('session.identify', { token: session?.token ?? null })
    }
  }, [session?.user.id, session?.token])

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(window.location.origin, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 250,
      reconnectionDelayMax: 1000,
      query: {
        token: sessionRef.current?.token ?? '',
      },
    })

    socketRef.current = socket

    const reconcileActiveResources = () => {
      const activeScope = scopeRef.current
      const activeUserId = sessionRef.current?.user.id
      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.byScope(activeScope) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.quote.allByScope(activeScope) })
      if (activeUserId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.allByUser(activeUserId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.byUser(activeUserId) })
      }
    }

    const handleConnect = () => {
      const isReconnect = hadConnectedRef.current
      hadConnectedRef.current = true
      socket.emit('session.identify', { token: sessionRef.current?.token ?? null })
      setStats((current) => ({
        ...current,
        connected: true,
        reconnectCount: isReconnect ? current.reconnectCount + 1 : current.reconnectCount,
      }))
      if (isReconnect) {
        reconcileActiveResources()
      }
    }

    const handleDisconnect = () => {
      setStats((current) => ({ ...current, connected: false }))
    }

    const shouldAcceptEvent = (id: string, resourceType: 'nft' | 'order', resourceId: string, version: number) => {
      if (seenEventsRef.current.has(id)) {
        setStats((current) => ({
          ...current,
          ignoredDuplicates: current.ignoredDuplicates + 1,
        }))
        return false
      }
      const key = `${resourceType}:${resourceId}`
      const knownVersion = versionsRef.current.get(key) ?? 0
      if (version <= knownVersion) {
        seenEventsRef.current.add(id)
        setStats((current) => ({
          ...current,
          ignoredStale: current.ignoredStale + 1,
        }))
        return false
      }
      seenEventsRef.current.add(id)
      versionsRef.current.set(key, version)
      setStats((current) => ({
        ...current,
        receivedCount: current.receivedCount + 1,
        lastEventId: id,
      }))
      return true
    }

    const handleNftUpdated = (event: NftUpdatedEvent) => {
      const { nftId, priceFromEth, available, editions } = event.data
      if (!shouldAcceptEvent(event.id, 'nft', nftId, event.version)) {
        return
      }

      const editionsMap = new Map(editions.map((edition) => [edition.id, edition]))

      queryClient.setQueryData<NftDetail | undefined>(queryKeys.nfts.detail(nftId), (current) => {
        if (!current || current.version >= event.version) return current
        return {
          ...current,
          priceFromEth,
          available,
          version: event.version,
          editions: current.editions.map((edition) => {
            const patch = editionsMap.get(edition.id)
            return patch
              ? {
                  ...edition,
                  priceEth: patch.priceEth,
                  available: patch.available,
                  status: patch.status,
                }
              : edition
          }),
        }
      })

      queryClient.setQueriesData<Paginated<NftSummary>>({ queryKey: queryKeys.nfts.lists() }, (current) => {
        if (!current) return current
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === nftId && item.version < event.version
              ? { ...item, priceFromEth, available, version: event.version }
              : item,
          ),
        }
      })

      queryClient.setQueryData<FeaturedNft[] | undefined>(queryKeys.nfts.featured(), (current) => {
        if (!current) return current
        return current.map((entry) =>
          entry.nft.id === nftId && entry.nft.version < event.version
            ? { ...entry, nft: { ...entry.nft, priceFromEth, available, version: event.version } }
            : entry,
        )
      })

      const activeScope = scopeRef.current
      const currentCart = queryClient.getQueryData<Cart>(queryKeys.cart.byScope(activeScope))
      const affectedLine = currentCart?.lines.find((line) => line.nftId === nftId)

      if (currentCart && affectedLine) {
        const editionPatch = editionsMap.get(affectedLine.editionId)
        queryClient.setQueryData<Cart>(queryKeys.cart.byScope(activeScope), (cached) => {
          if (!cached) return cached
          return {
            ...cached,
            version: cached.version + 1,
            updatedAt: event.occurredAt,
            lines: cached.lines.map((line) => {
              if (line.nftId !== nftId) return line
              const patch = editionsMap.get(line.editionId)
              if (!patch) return line
              return {
                ...line,
                unitPriceEth: patch.priceEth,
                available: patch.available,
                status: patch.status,
                nftVersion: event.version,
              }
            }),
          }
        })

        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.byScope(activeScope) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.quote.allByScope(activeScope) })

        const description = editionPatch
          ? editionPatch.available === 0
            ? `${affectedLine.name} (${affectedLine.editionName}) esgotou enquanto estava no carrinho.`
            : `${affectedLine.name} (${affectedLine.editionName}) teve atualização para ${formatEth(editionPatch.priceEth)} (${editionPatch.available} disponíveis).`
          : `${affectedLine.name} teve preço ou disponibilidade atualizados.`

        setCartAlerts((prev) => [
          ...prev.filter((item) => !(item.scope === activeScope && item.nftId === nftId)),
          {
            id: event.id,
            scope: activeScope,
            nftId,
            nftName: affectedLine.name,
            message: description,
            occurredAt: event.occurredAt,
          },
        ])

        notify({
          tone: 'warning',
          title: 'Item do carrinho atualizado',
          description,
        })
      }
    }

    const handleOrderUpdated = (event: OrderUpdatedEvent) => {
      const activeUserId = sessionRef.current?.user.id
      if (!activeUserId) return

      const { order } = event.data
      if (!shouldAcceptEvent(event.id, 'order', order.id, event.version)) {
        return
      }

      queryClient.setQueryData<Order>(queryKeys.orders.detail(activeUserId, order.id), order)
      queryClient.setQueryData<Order[] | undefined>(queryKeys.orders.list(activeUserId), (current) => {
        if (!current) return [order]
        const exists = current.some((item) => item.id === order.id)
        return exists ? current.map((item) => (item.id === order.id ? order : item)) : [order, ...current]
      })

      if (order.status === 'confirmed') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.byScope(activeUserId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.quote.allByScope(activeUserId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all })
        notify({
          tone: 'success',
          title: 'Pedido confirmado',
          description: `Seu pedido ${order.id} foi confirmado na rede ${order.network}.`,
        })
      } else if (order.status === 'declined') {
        notify({
          tone: 'error',
          title: 'Pagamento recusado',
          description: order.declineReason ?? 'Seu pedido não pôde ser confirmado. Seus itens continuam no carrinho.',
        })
      }
    }

    const handleSessionRejected = () => {
      void refreshSession()
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('nft.updated', handleNftUpdated)
    socket.on('order.updated', handleOrderUpdated)
    socket.on('session.rejected', handleSessionRejected)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('nft.updated', handleNftUpdated)
      socket.off('order.updated', handleOrderUpdated)
      socket.off('session.rejected', handleSessionRejected)
      socket.disconnect()
      socketRef.current = null
    }
  }, [notify, queryClient, refreshSession])

  const reconnectNow = useCallback(() => {
    const socket = socketRef.current
    if (!socket) return
    if (!socket.connected) {
      socket.connect()
    }
  }, [])

  const scopedCartAlerts = useMemo(
    () => cartAlerts.filter((item) => item.scope === scope),
    [cartAlerts, scope],
  )

  const value = useMemo<RealtimeContextValue>(
    () => ({
      stats,
      cartAlerts: scopedCartAlerts,
      dismissCartAlert,
      clearCartAlerts,
      recordResourceVersion,
      reconnectNow,
    }),
    [stats, scopedCartAlerts, dismissCartAlert, clearCartAlerts, recordResourceVersion, reconnectNow],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
