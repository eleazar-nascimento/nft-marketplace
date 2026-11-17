import { z } from 'zod'

export const ethAmountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/, 'Valor em ETH inválido')

export type EthAmount = z.infer<typeof ethAmountSchema>

export const errorCodes = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'EMAIL_TAKEN',
  'USERNAME_TAKEN',
  'INVALID_CREDENTIALS',
  'AVAILABILITY_CONFLICT',
  'EDITION_UNAVAILABLE',
  'QUANTITY_LIMIT',
  'QUOTE_STALE',
  'QUOTE_EXPIRED',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'IDEMPOTENCY_CONFLICT',
  'WALLET_REJECTED',
  'WALLET_NOT_CONNECTED',
  'PAYMENT_DECLINED',
  'TRANSIENT',
  'NETWORK_ERROR',
  'TIMEOUT',
  'UNKNOWN',
] as const

export type ErrorCode = (typeof errorCodes)[number]

export interface ApiErrorBody {
  error: {
    code: ErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: Record<string, unknown>
  }
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export const networks = ['ethereum', 'polygon', 'base'] as const
export const networkSchema = z.enum(networks)
export type Network = z.infer<typeof networkSchema>

export const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
}
