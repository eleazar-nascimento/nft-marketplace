import type { EthAmount } from './common'
import type { EditionStatus } from './nft'
import type { Order } from './order'

export interface RealtimeEnvelope<TType extends string, TResource extends string, TData> {
  id: string
  type: TType
  resource: { type: TResource; id: string }
  version: number
  occurredAt: string
  data: TData
}

export interface NftUpdatedData {
  nftId: string
  priceFromEth: EthAmount
  available: number
  editions: Array<{
    id: string
    priceEth: EthAmount
    available: number
    status: EditionStatus
  }>
}

export type NftUpdatedEvent = RealtimeEnvelope<'nft.updated', 'nft', NftUpdatedData>

export type OrderUpdatedEvent = RealtimeEnvelope<'order.updated', 'order', { order: Order }>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export interface ServerToClientEvents {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
  'session.ready': (payload: { userId: string | null }) => void
  'session.rejected': (payload: { reason: 'SESSION_EXPIRED' | 'UNAUTHENTICATED' }) => void
}

export interface ClientToServerEvents {
  'session.identify': (payload: { token: string | null }) => void
}

export const realtimeEventNames = ['nft.updated', 'order.updated'] as const
