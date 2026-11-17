import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  AuthResponse,
  Cart,
  ChangePasswordRequest,
  CreateOrderRequest,
  FavoritesResponse,
  FeaturedNft,
  LoginRequest,
  Network,
  NftDetail,
  NftListQuery,
  NftSummary,
  Order,
  Paginated,
  Profile,
  Quote,
  RegisterRequest,
  SessionInfo,
  UpdateAvatarRequest,
  UpdateCartItemRequest,
  UpdateProfileRequest,
  Wallet,
  WalletConnection,
  WalletRequest,
} from '@/contracts'
import type { ScenarioConfig, ScenarioPreset } from '@/mocks/scenarios'
import { httpClient } from './client'

export const authApi = {
  async register(input: RegisterRequest): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>('/auth/register', input)
    return data
  },
  async login(input: LoginRequest): Promise<AuthResponse> {
    const { data } = await httpClient.post<AuthResponse>('/auth/login', input)
    return data
  },
  async getSession(signal?: AbortSignal): Promise<SessionInfo> {
    const { data } = await httpClient.get<SessionInfo>('/auth/session', { signal })
    return data
  },
  async logout(): Promise<void> {
    await httpClient.post('/auth/logout')
  },
  async expireSession(): Promise<{ expired: number }> {
    const { data } = await httpClient.post<{ expired: number }>('/auth/expire')
    return data
  },
}

export const nftsApi = {
  async listFeatured(signal?: AbortSignal): Promise<FeaturedNft[]> {
    const { data } = await httpClient.get<{ items: FeaturedNft[] }>('/nfts/featured', { signal })
    return data.items
  },
  async list(query: NftListQuery, signal?: AbortSignal): Promise<Paginated<NftSummary>> {
    const params: Record<string, string | number | undefined> = {
      q: query.q || undefined,
      category: query.category?.length ? query.category.join(',') : undefined,
      network: query.network || undefined,
      minPrice: query.minPrice || undefined,
      maxPrice: query.maxPrice || undefined,
      availability: query.availability && query.availability !== 'all' ? query.availability : undefined,
      sort: query.sort || undefined,
      page: query.page,
      pageSize: query.pageSize,
    }
    const { data } = await httpClient.get<Paginated<NftSummary>>('/nfts', { params, signal })
    return data
  },
  async detail(nftId: string, signal?: AbortSignal): Promise<NftDetail> {
    const { data } = await httpClient.get<NftDetail>(`/nfts/${encodeURIComponent(nftId)}`, { signal })
    return data
  },
}

export const favoritesApi = {
  async list(signal?: AbortSignal): Promise<FavoritesResponse> {
    const { data } = await httpClient.get<FavoritesResponse>('/favorites', { signal })
    return data
  },
  async add(nftId: string): Promise<FavoritesResponse> {
    const { data } = await httpClient.post<FavoritesResponse>('/favorites', { nftId })
    return data
  },
  async remove(nftId: string): Promise<FavoritesResponse> {
    const { data } = await httpClient.delete<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`)
    return data
  },
}

export const cartApi = {
  async get(signal?: AbortSignal): Promise<Cart> {
    const { data } = await httpClient.get<Cart>('/cart', { signal })
    return data
  },
  async addItem(input: AddCartItemRequest): Promise<Cart> {
    const { data } = await httpClient.post<Cart>('/cart/items', input)
    return data
  },
  async updateItem(lineId: string, input: UpdateCartItemRequest): Promise<Cart> {
    const { data } = await httpClient.patch<Cart>(`/cart/items/${encodeURIComponent(lineId)}`, input)
    return data
  },
  async removeItem(lineId: string): Promise<Cart> {
    const { data } = await httpClient.delete<Cart>(`/cart/items/${encodeURIComponent(lineId)}`)
    return data
  },
  async applyCoupon(input: ApplyCouponRequest): Promise<Cart> {
    const { data } = await httpClient.post<Cart>('/cart/coupon', input)
    return data
  },
  async removeCoupon(): Promise<Cart> {
    const { data } = await httpClient.delete<Cart>('/cart/coupon')
    return data
  },
  async acknowledge(): Promise<Cart> {
    const { data } = await httpClient.post<Cart>('/cart/acknowledge')
    return data
  },
}

export const quotesApi = {
  async create(network: Network, signal?: AbortSignal): Promise<Quote> {
    const { data } = await httpClient.post<Quote>('/quotes', { network }, { signal })
    return data
  },
}

export const ordersApi = {
  async create(input: CreateOrderRequest, idempotencyKey: string): Promise<Order> {
    const { data } = await httpClient.post<Order>('/orders', input, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })
    return data
  },
  async list(signal?: AbortSignal): Promise<Order[]> {
    const { data } = await httpClient.get<{ items: Order[] }>('/orders', { signal })
    return data.items
  },
  async detail(orderId: string, signal?: AbortSignal): Promise<Order> {
    const { data } = await httpClient.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })
    return data
  },
}

export const profileApi = {
  async get(signal?: AbortSignal): Promise<Profile> {
    const { data } = await httpClient.get<Profile>('/profile', { signal })
    return data
  },
  async update(input: UpdateProfileRequest): Promise<Profile> {
    const { data } = await httpClient.put<Profile>('/profile', input)
    return data
  },
  async updateAvatar(input: UpdateAvatarRequest): Promise<Profile> {
    const { data } = await httpClient.put<Profile>('/profile/avatar', input)
    return data
  },
  async changePassword(input: ChangePasswordRequest): Promise<void> {
    await httpClient.put('/profile/password', input)
  },
}

export const walletsApi = {
  async list(signal?: AbortSignal): Promise<{ wallets: Wallet[]; connection: WalletConnection | null }> {
    const { data } = await httpClient.get<{ wallets: Wallet[]; connection: WalletConnection | null }>('/wallets', {
      signal,
    })
    return data
  },
  async create(input: WalletRequest): Promise<Wallet> {
    const { data } = await httpClient.post<Wallet>('/wallets', input)
    return data
  },
  async update(walletId: string, input: WalletRequest): Promise<Wallet> {
    const { data } = await httpClient.put<Wallet>(`/wallets/${encodeURIComponent(walletId)}`, input)
    return data
  },
  async connect(walletId: string, network: Network): Promise<WalletConnection> {
    const { data } = await httpClient.post<WalletConnection>(`/wallets/${encodeURIComponent(walletId)}/connect`, {
      network,
    })
    return data
  },
  async disconnect(): Promise<void> {
    await httpClient.post('/wallets/disconnect')
  },
}

export const simApi = {
  async getState(): Promise<{ scenario: ScenarioConfig; activeSockets: number }> {
    const { data } = await httpClient.get<{ scenario: ScenarioConfig; activeSockets: number }>('/__sim/state')
    return data
  },
  async setScenario(input: { preset?: ScenarioPreset } & Partial<ScenarioConfig>): Promise<ScenarioConfig> {
    const { data } = await httpClient.post<{ scenario: ScenarioConfig }>('/__sim/scenario', input)
    return data.scenario
  },
  async reset(preset?: ScenarioPreset): Promise<ScenarioConfig> {
    const { data } = await httpClient.post<{ scenario: ScenarioConfig }>('/__sim/reset', { preset })
    return data.scenario
  },
  async mutateNft(input: {
    nftId: string
    editionId?: string
    priceEth?: string
    available?: number
    priceDeltaPercent?: number
  }): Promise<{ nftId: string; version: number }> {
    const { data } = await httpClient.post<{ nftId: string; version: number }>('/__sim/nft-mutate', input)
    return data
  },
  async emitSocketEvent(
    input:
      | { type: 'nft.updated'; nftId: string; version?: number; eventId?: string }
      | { type: 'order.updated'; orderId: string; version?: number; eventId?: string },
  ): Promise<{ emitted: unknown }> {
    const { data } = await httpClient.post<{ emitted: unknown }>('/__sim/socket-event', input)
    return data
  },
  async disconnectSockets(blockReconnect = false): Promise<{ disconnected: number; blockReconnect: boolean }> {
    const { data } = await httpClient.post<{ disconnected: number; blockReconnect: boolean }>(
      '/__sim/socket-disconnect',
      { blockReconnect },
    )
    return data
  },
  async allowSockets(): Promise<void> {
    await httpClient.post('/__sim/socket-allow')
  },
  async settleOrder(orderId: string, outcome: 'confirm' | 'decline'): Promise<Order> {
    const { data } = await httpClient.post<{ order: Order }>('/__sim/order-settle', { orderId, outcome })
    return data.order
  },
}
