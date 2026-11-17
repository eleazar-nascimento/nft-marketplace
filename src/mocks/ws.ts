import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts'
import { store } from './db/store'
import { resolveSession } from './domain/auth'
import { editionStatus, priceFrom, toOrder, totalAvailable } from './domain/mappers'
import { settleDueOrders } from './domain/orders'
import { createId } from './lib/random'

interface ActiveClient {
  id: string
  userId: string | null
  token: string | null
  emit: (event: string, payload: unknown) => void
  close: () => void
}

const clients = new Map<string, ActiveClient>()
let rejectConnections = false

function buildNftUpdatedEvent(nftId: string, overrideVersion?: number, overrideId?: string): NftUpdatedEvent | null {
  const nft = store.data.nfts.find((candidate) => candidate.id === nftId)
  if (!nft) return null
  return {
    id: overrideId ?? createId('evt'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: overrideVersion ?? nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      nftId: nft.id,
      priceFromEth: priceFrom(nft),
      available: totalAvailable(nft),
      editions: nft.editions.map((edition) => ({
        id: edition.id,
        priceEth: edition.priceEth,
        available: edition.disabled ? 0 : edition.available,
        status: editionStatus(edition),
      })),
    },
  }
}

function buildOrderUpdatedEvent(
  orderId: string,
  overrideVersion?: number,
  overrideId?: string,
): { event: OrderUpdatedEvent; userId: string } | null {
  const order = store.data.orders.find((candidate) => candidate.id === orderId)
  if (!order) return null
  return {
    userId: order.userId,
    event: {
      id: overrideId ?? createId('evt'),
      type: 'order.updated',
      resource: { type: 'order', id: order.id },
      version: overrideVersion ?? order.version,
      occurredAt: new Date().toISOString(),
      data: {
        order: toOrder(order),
      },
    },
  }
}

store.subscribe((domainEvent) => {
  if (domainEvent.type === 'nft.updated') {
    const payload = buildNftUpdatedEvent(domainEvent.nftId)
    if (!payload) return
    clients.forEach((client) => client.emit('nft.updated', payload))
    return
  }

  if (domainEvent.type === 'order.updated') {
    const built = buildOrderUpdatedEvent(domainEvent.orderId)
    if (!built) return
    clients.forEach((client) => {
      if (client.userId && client.userId === built.userId) {
        client.emit('order.updated', built.event)
      }
    })
  }
})

const socketLink = ws.link(/^wss?:\/\//)

function parseTokenFromUrl(url: URL): string | null {
  return url.searchParams.get('token')
}

export const wsHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    if (rejectConnections) {
      connection.client.close(1013, 'Simulated socket outage')
      return
    }

    const io = toSocketIo(connection)
    const clientId = createId('ws')
    const initialToken = parseTokenFromUrl(connection.client.url)

    const client: ActiveClient = {
      id: clientId,
      userId: null,
      token: initialToken,
      emit: (event, payload) => {
        try {
          io.client.emit(event, payload)
        } catch {
          clients.delete(clientId)
        }
      },
      close: () => {
        clients.delete(clientId)
        connection.client.close(1012, 'Simulated disconnect')
      },
    }

    const applyToken = (token: string | null) => {
      client.token = token
      if (!token) {
        client.userId = null
        client.emit('session.ready', { userId: null })
        return
      }
      try {
        const resolved = resolveSession(token)
        client.userId = resolved.user.id
        client.emit('session.ready', { userId: resolved.user.id })
        settleDueOrders()
      } catch {
        client.userId = null
        client.emit('session.rejected', { reason: 'SESSION_EXPIRED' })
      }
    }

    clients.set(clientId, client)

    connection.client.addEventListener('message', (event) => {
      if (event.data === '2') {
        connection.client.send('3')
      }
    })

    connection.client.addEventListener('close', () => {
      clients.delete(clientId)
    })

    io.client.on('session.identify', (_event, payload: { token?: string | null } | undefined) => {
      applyToken(payload?.token ?? null)
    })

    queueMicrotask(() => {
      applyToken(initialToken)
    })
  }),
]

export function emitCustomNftEvent(options: {
  nftId: string
  version?: number
  eventId?: string
}): NftUpdatedEvent | null {
  const payload = buildNftUpdatedEvent(options.nftId, options.version, options.eventId)
  if (!payload) return null
  clients.forEach((client) => client.emit('nft.updated', payload))
  return payload
}

export function emitCustomOrderEvent(options: {
  orderId: string
  version?: number
  eventId?: string
}): OrderUpdatedEvent | null {
  const built = buildOrderUpdatedEvent(options.orderId, options.version, options.eventId)
  if (!built) return null
  clients.forEach((client) => {
    if (client.userId && client.userId === built.userId) {
      client.emit('order.updated', built.event)
    }
  })
  return built.event
}

export function disconnectSockets(options: { blockReconnect?: boolean } = {}): number {
  rejectConnections = Boolean(options.blockReconnect)
  const count = clients.size
  Array.from(clients.values()).forEach((client) => client.close())
  return count
}

export function allowSocketConnections(): void {
  rejectConnections = false
}

export function activeSocketCount(): number {
  return clients.size
}
