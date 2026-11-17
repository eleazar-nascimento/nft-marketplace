import { z } from 'zod'
import type { EthAmount, Network } from './common'
import { networkSchema } from './common'

export const nftCategories = [
  'art',
  'collectibles',
  'music',
  'photography',
  'video',
  'utility',
  'sport',
  'virtual-worlds',
] as const

export type NftCategory = (typeof nftCategories)[number]

export const nftCategoryLabels: Record<NftCategory, string> = {
  art: 'Arte',
  collectibles: 'Colecionáveis',
  music: 'Música',
  photography: 'Fotografia',
  video: 'Vídeo',
  utility: 'Utilidade',
  sport: 'Esporte',
  'virtual-worlds': 'Mundos virtuais',
}

export const nftSorts = ['recent', 'price_asc', 'price_desc', 'popular', 'name_asc'] as const
export type NftSort = (typeof nftSorts)[number]

export const nftSortLabels: Record<NftSort, string> = {
  recent: 'Mais recentes',
  price_asc: 'Menor preço',
  price_desc: 'Maior preço',
  popular: 'Mais populares',
  name_asc: 'Nome (A–Z)',
}

export const availabilityFilters = ['all', 'available'] as const
export type AvailabilityFilter = (typeof availabilityFilters)[number]

export const NFT_PAGE_SIZE = 9

export const nftListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.array(z.enum(nftCategories)).optional(),
  network: networkSchema.optional(),
  minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional(),
  availability: z.enum(availabilityFilters).optional(),
  sort: z.enum(nftSorts).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(48).optional(),
})

export type NftListQuery = z.infer<typeof nftListQuerySchema>

export interface Creator {
  id: string
  username: string
  displayName: string
  avatarUrl: string
}

export type EditionStatus = 'available' | 'sold_out' | 'unavailable'

export interface NftEdition {
  id: string
  name: string
  priceEth: EthAmount
  supply: number
  available: number
  maxPerOrder: number
  status: EditionStatus
}

export interface NftImage {
  url: string
  alt: string
  width: number
  height: number
}

export interface NftSummary {
  id: string
  name: string
  image: NftImage
  creator: Creator
  category: NftCategory
  network: Network
  priceFromEth: EthAmount
  available: number
  likes: number
  createdAt: string
  version: number
}

export interface NftDetail extends NftSummary {
  description: string
  collection: string
  tags: string[]
  gallery: NftImage[]
  editions: NftEdition[]
  contractAddress: string
  tokenStandard: 'ERC-721' | 'ERC-1155'
}

export interface FeaturedNft {
  nft: NftSummary
  headline: string
}

export interface FavoritesResponse {
  nftIds: string[]
}
