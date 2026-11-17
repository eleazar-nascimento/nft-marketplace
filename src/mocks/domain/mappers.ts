import type {
  Cart,
  CartLine,
  Creator,
  EditionStatus,
  NftDetail,
  NftEdition,
  NftSummary,
  Order,
  Profile,
  Quote,
  SessionUser,
  Wallet,
} from '@/contracts'
import { compareEth } from '@/lib/eth'
import { creatorFixtures } from '../fixtures/creators'
import { nftImage } from '../fixtures/nfts'
import type {
  CartRecord,
  EditionRecord,
  NftRecord,
  OrderRecord,
  QuoteRecord,
  UserRecord,
  WalletRecord,
} from '../db/schema'

const creatorsById = new Map(creatorFixtures.map((creator) => [creator.id, creator]))

export function creatorOf(nft: NftRecord): Creator {
  const creator = creatorsById.get(nft.creatorId)
  if (!creator) throw new Error(`Unknown creator ${nft.creatorId}`)
  return creator
}

export function editionStatus(edition: EditionRecord): EditionStatus {
  if (edition.disabled) return 'unavailable'
  return edition.available > 0 ? 'available' : 'sold_out'
}

export function priceFrom(nft: NftRecord): string {
  const candidates = nft.editions.filter((edition) => editionStatus(edition) === 'available')
  const pool = candidates.length > 0 ? candidates : nft.editions
  return pool.reduce((min, edition) => (compareEth(edition.priceEth, min) < 0 ? edition.priceEth : min), pool[0]!.priceEth)
}

export function totalAvailable(nft: NftRecord): number {
  return nft.editions.reduce((sum, edition) => sum + (edition.disabled ? 0 : edition.available), 0)
}

export function toNftSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    image: nftImage(nft.imageIndexes[0] ?? 0, nft.name),
    creator: creatorOf(nft),
    category: nft.category,
    network: nft.network,
    priceFromEth: priceFrom(nft),
    available: totalAvailable(nft),
    likes: nft.likes,
    createdAt: nft.createdAt,
    version: nft.version,
  }
}

export function toEdition(edition: EditionRecord): NftEdition {
  return {
    id: edition.id,
    name: edition.name,
    priceEth: edition.priceEth,
    supply: edition.supply,
    available: edition.disabled ? 0 : edition.available,
    maxPerOrder: edition.maxPerOrder,
    status: editionStatus(edition),
  }
}

export function toNftDetail(nft: NftRecord): NftDetail {
  return {
    ...toNftSummary(nft),
    description: nft.description,
    collection: nft.collection,
    tags: nft.tags,
    gallery: nft.imageIndexes.map((index, position) => nftImage(index, nft.name, position)),
    editions: nft.editions.map(toEdition),
    contractAddress: nft.contractAddress,
    tokenStandard: nft.tokenStandard,
  }
}

export function toSessionUser(user: UserRecord): SessionUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

export function toProfile(user: UserRecord): Profile {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    website: user.website,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export function toWallet(wallet: WalletRecord): Wallet {
  const { userId: _userId, ...rest } = wallet
  return rest
}

export function toCart(cart: CartRecord, nfts: NftRecord[]): Cart {
  const nftsById = new Map(nfts.map((nft) => [nft.id, nft]))
  const lines: CartLine[] = cart.lines.flatMap((line) => {
    const nft = nftsById.get(line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!nft || !edition) return []
    return [
      {
        id: line.id,
        nftId: nft.id,
        editionId: edition.id,
        name: nft.name,
        editionName: edition.name,
        image: nftImage(nft.imageIndexes[0] ?? 0, nft.name),
        creatorName: creatorOf(nft).displayName,
        quantity: line.quantity,
        unitPriceEth: edition.priceEth,
        addedUnitPriceEth: line.addedUnitPriceEth,
        available: edition.disabled ? 0 : edition.available,
        maxPerOrder: edition.maxPerOrder,
        status: editionStatus(edition),
        nftVersion: nft.version,
      },
    ]
  })
  return {
    id: cart.id,
    owner: cart.ownerType,
    lines,
    couponCode: cart.couponCode,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    updatedAt: cart.updatedAt,
    version: cart.version,
  }
}

export function toQuote(quote: QuoteRecord): Quote {
  const { cartId: _cartId, userId: _userId, ...rest } = quote
  return rest
}

export function toOrder(order: OrderRecord): Order {
  const {
    userId: _userId,
    cartId: _cartId,
    requestHash: _requestHash,
    outcome: _outcome,
    settleAt: _settleAt,
    ...rest
  } = order
  return rest
}
