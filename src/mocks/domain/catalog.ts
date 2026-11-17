import type { FeaturedNft, NftListQuery, NftSummary, Paginated } from '@/contracts'
import { NFT_PAGE_SIZE } from '@/contracts'
import { compareEth, fromWei, toWei } from '@/lib/eth'
import { store } from '../db/store'
import type { NftRecord } from '../db/schema'
import { scenario } from '../scenarios'
import { errors } from './errors'
import { creatorOf, priceFrom, toNftDetail, toNftSummary, totalAvailable } from './mappers'

export function findNft(nftId: string): NftRecord {
  const nft = store.data.nfts.find((candidate) => candidate.id === nftId)
  if (!nft) throw errors.notFound('NFT')
  return nft
}

export function listNfts(query: NftListQuery): Paginated<NftSummary> {
  const pageSize = query.pageSize ?? NFT_PAGE_SIZE
  const page = query.page ?? 1
  const term = query.q?.trim().toLowerCase()

  let items = scenario.current.emptyCatalog ? [] : [...store.data.nfts]

  if (term) {
    items = items.filter((nft) => {
      const creator = creatorOf(nft)
      return [nft.name, nft.collection, creator.displayName, creator.username, ...nft.tags]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }
  if (query.category?.length) {
    const categories = new Set(query.category)
    items = items.filter((nft) => categories.has(nft.category))
  }
  if (query.network) {
    items = items.filter((nft) => nft.network === query.network)
  }
  if (query.minPrice) {
    const min = query.minPrice
    items = items.filter((nft) => compareEth(priceFrom(nft), min) >= 0)
  }
  if (query.maxPrice) {
    const max = query.maxPrice
    items = items.filter((nft) => compareEth(priceFrom(nft), max) <= 0)
  }
  if (query.availability === 'available') {
    items = items.filter((nft) => totalAvailable(nft) > 0)
  }

  const sort = query.sort ?? 'recent'
  items.sort((a, b) => {
    switch (sort) {
      case 'price_asc':
        return compareEth(priceFrom(a), priceFrom(b)) || a.id.localeCompare(b.id)
      case 'price_desc':
        return compareEth(priceFrom(b), priceFrom(a)) || a.id.localeCompare(b.id)
      case 'popular':
        return b.likes - a.likes || a.id.localeCompare(b.id)
      case 'name_asc':
        return a.name.localeCompare(b.name, 'pt-BR')
      default:
        return Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id)
    }
  })

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize).map(toNftSummary),
    page,
    pageSize,
    total,
    totalPages,
  }
}

export function getNftDetail(nftId: string) {
  return toNftDetail(findNft(nftId))
}

export function listFeatured(): FeaturedNft[] {
  if (scenario.current.emptyCatalog) return []
  return store.data.nfts
    .filter((nft) => nft.featured)
    .map((nft) => ({ nft: toNftSummary(nft), headline: `${nft.collection} · coleção em destaque` }))
}

export interface EditionChange {
  editionId?: string
  priceEth?: string
  available?: number
  priceDeltaPercent?: number
}

export function updateEdition(nftId: string, change: EditionChange): NftRecord {
  const nft = findNft(nftId)
  const edition = change.editionId
    ? nft.editions.find((candidate) => candidate.id === change.editionId)
    : nft.editions[0]
  if (!edition) throw errors.notFound('Edição')
  if (change.priceEth) edition.priceEth = change.priceEth
  if (change.priceDeltaPercent) {
    const precision = 10n ** 12n
    const next = (toWei(edition.priceEth) * BigInt(100 + change.priceDeltaPercent)) / 100n
    edition.priceEth = fromWei((next / precision) * precision)
  }
  if (typeof change.available === 'number') {
    edition.available = Math.max(0, Math.min(edition.supply, change.available))
  }
  touchNft(nft)
  return nft
}

export function touchNft(nft: NftRecord): void {
  nft.version += 1
  store.save()
  store.emit({ type: 'nft.updated', nftId: nft.id })
}
