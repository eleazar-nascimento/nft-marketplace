import { z } from 'zod'
import type { EthAmount, Network } from './common'
import { emailSchema } from './auth'
import { networkSchema } from './common'
import type { NftImage } from './nft'

export const collectorSchema = z.object({
  fullName: z.string().trim().min(3, 'Informe seu nome completo').max(80, 'Use no máximo 80 caracteres'),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{10,20}$/, 'Telefone inválido'),
  country: z.string().trim().min(2, 'Informe o país'),
})

export type Collector = z.infer<typeof collectorSchema>

export const createOrderSchema = z.object({
  quoteId: z.string().min(1),
  quoteFingerprint: z.string().min(1),
  walletId: z.string().min(1),
  network: networkSchema,
  collector: collectorSchema,
})

export type CreateOrderRequest = z.infer<typeof createOrderSchema>

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface OrderLine {
  nftId: string
  editionId: string
  name: string
  editionName: string
  image: NftImage
  quantity: number
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
}

export interface Order {
  id: string
  status: OrderStatus
  version: number
  idempotencyKey: string
  network: Network
  wallet: { id: string; label: string; address: string }
  collector: Collector
  lines: OrderLine[]
  couponCode: string | null
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  txHash: string | null
  explorerUrl: string | null
  declineReason: string | null
  createdAt: string
  updatedAt: string
}

export const terminalOrderStatuses: OrderStatus[] = ['confirmed', 'declined']
