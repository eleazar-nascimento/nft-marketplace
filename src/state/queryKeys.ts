import type { Network, NftListQuery } from '@/contracts'

export function normalizeNftQuery(query: NftListQuery): NftListQuery {
  return {
    q: query.q?.trim() || undefined,
    category: query.category?.length ? [...query.category].sort() : undefined,
    network: query.network || undefined,
    minPrice: query.minPrice?.trim() || undefined,
    maxPrice: query.maxPrice?.trim() || undefined,
    availability: query.availability && query.availability !== 'all' ? query.availability : undefined,
    sort: query.sort ?? 'recent',
    page: query.page ?? 1,
    pageSize: query.pageSize,
  }
}

export const queryKeys = {
  nfts: {
    all: ['nfts'] as const,
    featured: () => ['nfts', 'featured'] as const,
    lists: () => ['nfts', 'list'] as const,
    list: (query: NftListQuery) => ['nfts', 'list', normalizeNftQuery(query)] as const,
    details: () => ['nfts', 'detail'] as const,
    detail: (nftId: string) => ['nfts', 'detail', nftId] as const,
  },
  favorites: {
    byUser: (userId: string) => ['private', userId, 'favorites'] as const,
  },
  cart: {
    byScope: (scope: string) => ['cart', scope] as const,
  },
  quote: {
    byScope: (scope: string, network: Network, cartVersion: number) =>
      ['quote', scope, network, cartVersion] as const,
    allByScope: (scope: string) => ['quote', scope] as const,
  },
  orders: {
    allByUser: (userId: string) => ['private', userId, 'orders'] as const,
    list: (userId: string) => ['private', userId, 'orders', 'list'] as const,
    detail: (userId: string, orderId: string) => ['private', userId, 'orders', 'detail', orderId] as const,
  },
  profile: {
    byUser: (userId: string) => ['private', userId, 'profile'] as const,
  },
  wallets: {
    byUser: (userId: string) => ['private', userId, 'wallets'] as const,
  },
}
