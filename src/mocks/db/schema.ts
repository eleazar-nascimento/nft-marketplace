import type { Collector, Network, NftCategory, OrderLine, OrderStatus, QuoteIssue, QuoteLine, Wallet } from '@/contracts'

export interface UserRecord {
  id: string
  name: string
  username: string
  email: string
  passwordHash: string
  passwordSalt: string
  bio: string
  website: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionRecord {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

export interface EditionRecord {
  id: string
  name: string
  priceEth: string
  supply: number
  available: number
  maxPerOrder: number
  disabled: boolean
}

export interface NftRecord {
  id: string
  name: string
  description: string
  collection: string
  creatorId: string
  category: NftCategory
  network: Network
  tags: string[]
  imageIndexes: number[]
  editions: EditionRecord[]
  likes: number
  createdAt: string
  featured: boolean
  contractAddress: string
  tokenStandard: 'ERC-721' | 'ERC-1155'
  version: number
}

export interface CartLineRecord {
  id: string
  nftId: string
  editionId: string
  quantity: number
  addedUnitPriceEth: string
}

export interface CartRecord {
  id: string
  ownerType: 'guest' | 'user'
  ownerId: string
  lines: CartLineRecord[]
  couponCode: string | null
  updatedAt: string
  version: number
}

export interface WalletRecord extends Wallet {
  userId: string
}

export interface QuoteRecord {
  id: string
  cartId: string
  userId: string | null
  fingerprint: string
  network: Network
  lines: QuoteLine[]
  coupon: { code: string; percentOff: number } | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  issues: QuoteIssue[]
  createdAt: string
  expiresAt: string
}

export interface OrderRecord {
  id: string
  userId: string
  cartId: string
  status: OrderStatus
  version: number
  idempotencyKey: string
  requestHash: string
  network: Network
  wallet: { id: string; label: string; address: string }
  collector: Collector
  lines: OrderLine[]
  couponCode: string | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  txHash: string | null
  explorerUrl: string | null
  declineReason: string | null
  outcome: 'confirm' | 'decline'
  settleAt: string
  createdAt: string
  updatedAt: string
}

export interface WalletConnectionRecord {
  walletId: string
  network: Network
  connectedAt: string
}

export interface MockState {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  carts: CartRecord[]
  favorites: Record<string, string[]>
  wallets: WalletRecord[]
  walletConnections: Record<string, WalletConnectionRecord | null>
  quotes: QuoteRecord[]
  orders: OrderRecord[]
}

export type DomainEvent =
  | { type: 'nft.updated'; nftId: string }
  | { type: 'order.updated'; orderId: string; userId: string }
