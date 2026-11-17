import { z } from 'zod'
import type { EthAmount, Network } from './common'
import { networkSchema } from './common'
import type { EditionStatus, NftImage } from './nft'

export const addCartItemSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export type AddCartItemRequest = z.infer<typeof addCartItemSchema>

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
})

export type UpdateCartItemRequest = z.infer<typeof updateCartItemSchema>

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Informe o cupom').max(32, 'Cupom inválido'),
})

export type ApplyCouponRequest = z.infer<typeof applyCouponSchema>

export interface CartLine {
  id: string
  nftId: string
  editionId: string
  name: string
  editionName: string
  image: NftImage
  creatorName: string
  quantity: number
  unitPriceEth: EthAmount
  addedUnitPriceEth: EthAmount
  available: number
  maxPerOrder: number
  status: EditionStatus
  nftVersion: number
}

export interface Cart {
  id: string
  owner: 'guest' | 'user'
  lines: CartLine[]
  couponCode: string | null
  itemCount: number
  updatedAt: string
  version: number
}

export type QuoteIssue =
  | { type: 'price_changed'; lineId: string; previousUnitPriceEth: EthAmount; unitPriceEth: EthAmount }
  | { type: 'quantity_reduced'; lineId: string; requested: number; available: number }
  | { type: 'sold_out'; lineId: string }
  | { type: 'coupon_removed'; code: string; reason: 'COUPON_INVALID' | 'COUPON_EXPIRED' }

export interface QuoteLine {
  lineId: string
  nftId: string
  editionId: string
  name: string
  editionName: string
  image: NftImage
  quantity: number
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
}

export interface Quote {
  id: string
  fingerprint: string
  network: Network
  lines: QuoteLine[]
  coupon: { code: string; percentOff: number } | null
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  issues: QuoteIssue[]
  createdAt: string
  expiresAt: string
}

export const quoteRequestSchema = z.object({
  network: networkSchema,
})

export type QuoteRequest = z.infer<typeof quoteRequestSchema>
