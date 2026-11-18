import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  cartApi,
  favoritesApi,
  nftsApi,
  ordersApi,
  profileApi,
  quotesApi,
  walletsApi,
} from '@/api/endpoints'
import { AppApiError } from '@/api/client'
import type {
  AddCartItemRequest,
  ChangePasswordRequest,
  CreateOrderRequest,
  FavoritesResponse,
  Network,
  NftDetail,
  NftListQuery,
  NftSummary,
  Order,
  Paginated,
  Quote,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  WalletRequest,
} from '@/contracts'
import { terminalOrderStatuses } from '@/contracts'
import { useNotifications } from './notifications'
import { queryKeys } from './queryKeys'
import { useRealtime } from './realtime'
import { useSession } from './session'

export function useFeaturedNfts() {
  const { recordResourceVersion } = useRealtime()
  const query = useQuery({
    queryKey: queryKeys.nfts.featured(),
    queryFn: ({ signal }) => nftsApi.listFeatured(signal),
    staleTime: 30_000,
  })

  useEffect(() => {
    query.data?.forEach((entry) => {
      recordResourceVersion('nft', entry.nft.id, entry.nft.version)
    })
  }, [query.data, recordResourceVersion])

  return query
}

export function useNftsList(params: NftListQuery) {
  const { recordResourceVersion } = useRealtime()
  const query = useQuery({
    queryKey: queryKeys.nfts.list(params),
    queryFn: ({ signal }) => nftsApi.list(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

  useEffect(() => {
    query.data?.items.forEach((nft) => {
      recordResourceVersion('nft', nft.id, nft.version)
    })
  }, [query.data, recordResourceVersion])

  return query
}

export function useNftDetail(nftId: string) {
  const { recordResourceVersion } = useRealtime()
  const query = useQuery({
    queryKey: queryKeys.nfts.detail(nftId),
    queryFn: ({ signal }) => nftsApi.detail(nftId, signal),
    enabled: Boolean(nftId),
    staleTime: 15_000,
    retry: (failureCount, error) => {
      if (error instanceof AppApiError && error.status === 404) return false
      return failureCount < 1
    },
  })

  useEffect(() => {
    if (query.data) {
      recordResourceVersion('nft', query.data.id, query.data.version)
    }
  }, [query.data, recordResourceVersion])

  return query
}

export function useFavorites() {
  const { user, status } = useSession()
  const userId = user?.id ?? ''
  return useQuery({
    queryKey: queryKeys.favorites.byUser(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: status === 'authenticated' && Boolean(userId),
    staleTime: 30_000,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { notify } = useNotifications()

  return useMutation({
    mutationFn: async ({ nftId, isFavorite }: { nftId: string; isFavorite: boolean }) => {
      if (!user) {
        throw new AppApiError({
          status: 401,
          code: 'UNAUTHENTICATED',
          message: 'Entre na sua conta para salvar favoritos.',
        })
      }
      return isFavorite ? favoritesApi.remove(nftId) : favoritesApi.add(nftId)
    },
    onMutate: async ({ nftId, isFavorite }) => {
      if (!user) return undefined
      const favKey = queryKeys.favorites.byUser(user.id)
      const detailKey = queryKeys.nfts.detail(nftId)

      await Promise.all([
        queryClient.cancelQueries({ queryKey: favKey }),
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: queryKeys.nfts.lists() }),
      ])

      const previousFavorites = queryClient.getQueryData<FavoritesResponse>(favKey)
      const previousDetail = queryClient.getQueryData<NftDetail>(detailKey)
      const previousLists = queryClient.getQueriesData<Paginated<NftSummary>>({
        queryKey: queryKeys.nfts.lists(),
      })

      const currentIds = previousFavorites?.nftIds ?? []
      const nextIds = isFavorite
        ? currentIds.filter((id) => id !== nftId)
        : Array.from(new Set([...currentIds, nftId]))
      const delta = isFavorite ? -1 : 1

      queryClient.setQueryData<FavoritesResponse>(favKey, { nftIds: nextIds })

      if (previousDetail) {
        queryClient.setQueryData<NftDetail>(detailKey, {
          ...previousDetail,
          likes: Math.max(0, previousDetail.likes + delta),
        })
      }

      queryClient.setQueriesData<Paginated<NftSummary>>({ queryKey: queryKeys.nfts.lists() }, (current) => {
        if (!current) return current
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === nftId ? { ...item, likes: Math.max(0, item.likes + delta) } : item,
          ),
        }
      })

      return { previousFavorites, previousDetail, previousLists, userId: user.id, nftId }
    },
    onError: (error, _variables, context) => {
      if (context) {
        const favKey = queryKeys.favorites.byUser(context.userId)
        if (context.previousFavorites) {
          queryClient.setQueryData(favKey, context.previousFavorites)
        } else {
          queryClient.removeQueries({ queryKey: favKey })
        }
        if (context.previousDetail) {
          queryClient.setQueryData(queryKeys.nfts.detail(context.nftId), context.previousDetail)
        }
        for (const [key, value] of context.previousLists) {
          queryClient.setQueryData(key, value)
        }
      }
      notify({
        tone: 'error',
        title: 'Não foi possível atualizar os favoritos',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      })
    },
    onSuccess: (data, { isFavorite }) => {
      if (user) {
        queryClient.setQueryData(queryKeys.favorites.byUser(user.id), data)
      }
      notify({
        tone: 'success',
        title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      })
    },
    onSettled: (_data, _error, variables) => {
      if (user) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.byUser(user.id) })
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.detail(variables.nftId) })
    },
  })
}

export function useCart() {
  const { scope } = useSession()
  const { recordResourceVersion } = useRealtime()
  const query = useQuery({
    queryKey: queryKeys.cart.byScope(scope),
    queryFn: ({ signal }) => cartApi.get(signal),
    staleTime: 10_000,
  })

  useEffect(() => {
    query.data?.lines.forEach((line) => {
      recordResourceVersion('nft', line.nftId, line.nftVersion)
    })
  }, [query.data, recordResourceVersion])

  return query
}

export function useCartMutations() {
  const queryClient = useQueryClient()
  const { scope } = useSession()
  const { notify } = useNotifications()
  const { clearCartAlerts } = useRealtime()

  const syncCart = (cart: Awaited<ReturnType<typeof cartApi.get>>) => {
    queryClient.setQueryData(queryKeys.cart.byScope(scope), cart)
    void queryClient.invalidateQueries({ queryKey: queryKeys.quote.allByScope(scope) })
  }

  const addItem = useMutation({
    mutationFn: (input: AddCartItemRequest) => cartApi.addItem(input),
    onSuccess: (cart) => {
      syncCart(cart)
      notify({
        tone: 'success',
        title: 'Item adicionado ao carrinho',
      })
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: 'Não foi possível adicionar ao carrinho',
        description: error instanceof Error ? error.message : 'Verifique a disponibilidade.',
      })
    },
  })

  const updateItem = useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) =>
      cartApi.updateItem(lineId, { quantity }),
    onSuccess: (cart) => {
      syncCart(cart)
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: 'Quantidade indisponível',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar a quantidade.',
      })
    },
  })

  const removeItem = useMutation({
    mutationFn: (lineId: string) => cartApi.removeItem(lineId),
    onSuccess: (cart) => {
      syncCart(cart)
      notify({
        tone: 'info',
        title: 'Item removido do carrinho',
      })
    },
  })

  const applyCoupon = useMutation({
    mutationFn: (code: string) => cartApi.applyCoupon({ code }),
    onSuccess: (cart) => {
      syncCart(cart)
      notify({
        tone: 'success',
        title: 'Cupom aplicado',
        description: cart.couponCode ? `Cupom ${cart.couponCode} ativo.` : undefined,
      })
    },
  })

  const removeCoupon = useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (cart) => {
      syncCart(cart)
      notify({
        tone: 'info',
        title: 'Cupom removido',
      })
    },
  })

  const acknowledge = useMutation({
    mutationFn: () => cartApi.acknowledge(),
    onSuccess: (cart) => {
      clearCartAlerts()
      syncCart(cart)
      notify({
        tone: 'info',
        title: 'Cotação atualizada confirmada',
      })
    },
  })

  return { addItem, updateItem, removeItem, applyCoupon, removeCoupon, acknowledge }
}

export function useQuote(network: Network, cartVersion: number, enabled = true) {
  const { scope } = useSession()
  return useQuery({
    queryKey: queryKeys.quote.byScope(scope, network, cartVersion),
    queryFn: ({ signal }) => quotesApi.create(network, signal),
    enabled,
    staleTime: 10_000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { user, scope } = useSession()

  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateOrderRequest; idempotencyKey: string }) =>
      ordersApi.create(input, idempotencyKey),
    onSuccess: (order) => {
      if (user) {
        queryClient.setQueryData(queryKeys.orders.detail(user.id, order.id), order)
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(user.id) })
      }
    },
    onError: (error) => {
      if (error instanceof AppApiError && (error.code === 'QUOTE_STALE' || error.code === 'QUOTE_EXPIRED')) {
        const freshQuote = error.details?.quote as Quote | undefined
        if (freshQuote) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.cart.byScope(scope) })
          void queryClient.invalidateQueries({ queryKey: queryKeys.quote.allByScope(scope) })
        }
      }
    },
  })
}

export function useOrder(orderId: string | null) {
  const { user, status } = useSession()
  const { recordResourceVersion } = useRealtime()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: queryKeys.orders.detail(userId, orderId ?? ''),
    queryFn: ({ signal }) => ordersApi.detail(orderId!, signal),
    enabled: status === 'authenticated' && Boolean(userId) && Boolean(orderId),
    refetchInterval: (q) => {
      const current = q.state.data as Order | undefined
      if (!current) return 1200
      return terminalOrderStatuses.includes(current.status) ? false : 1200
    },
  })

  useEffect(() => {
    if (query.data) {
      recordResourceVersion('order', query.data.id, query.data.version)
    }
  }, [query.data, recordResourceVersion])

  return query
}

export function useOrdersList() {
  const { user, status } = useSession()
  const userId = user?.id ?? ''
  return useQuery({
    queryKey: queryKeys.orders.list(userId),
    queryFn: ({ signal }) => ordersApi.list(signal),
    enabled: status === 'authenticated' && Boolean(userId),
  })
}

export function useProfile() {
  const { user, status } = useSession()
  const userId = user?.id ?? ''
  return useQuery({
    queryKey: queryKeys.profile.byUser(userId),
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: status === 'authenticated' && Boolean(userId),
  })
}

export function useProfileMutations() {
  const queryClient = useQueryClient()
  const { user, updateSessionUser } = useSession()
  const { notify } = useNotifications()

  const updateProfile = useMutation({
    mutationFn: (input: UpdateProfileRequest) => profileApi.update(input),
    onSuccess: (profile) => {
      if (user) {
        queryClient.setQueryData(queryKeys.profile.byUser(user.id), profile)
      }
      updateSessionUser({
        name: profile.name,
        username: profile.username,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      })
      notify({
        tone: 'success',
        title: 'Perfil atualizado com sucesso',
      })
    },
  })

  const updateAvatar = useMutation({
    mutationFn: (input: UpdateAvatarRequest) => profileApi.updateAvatar(input),
    onSuccess: (profile) => {
      if (user) {
        queryClient.setQueryData(queryKeys.profile.byUser(user.id), profile)
      }
      updateSessionUser({ avatarUrl: profile.avatarUrl })
      notify({
        tone: 'success',
        title: 'Avatar atualizado',
      })
    },
  })

  const changePassword = useMutation({
    mutationFn: (input: ChangePasswordRequest) => profileApi.changePassword(input),
    onSuccess: () => {
      notify({
        tone: 'success',
        title: 'Senha alterada com sucesso',
      })
    },
  })

  return { updateProfile, updateAvatar, changePassword }
}

export function useWallets() {
  const { user, status } = useSession()
  const userId = user?.id ?? ''
  return useQuery({
    queryKey: queryKeys.wallets.byUser(userId),
    queryFn: ({ signal }) => walletsApi.list(signal),
    enabled: status === 'authenticated' && Boolean(userId),
  })
}

export function useWalletMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { notify } = useNotifications()

  const invalidate = () => {
    if (user) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets.byUser(user.id) })
    }
  }

  const upsertWallet = useMutation({
    mutationFn: ({ walletId, input }: { walletId?: string; input: WalletRequest }) =>
      walletId ? walletsApi.update(walletId, input) : walletsApi.create(input),
    onSuccess: () => {
      invalidate()
      notify({
        tone: 'success',
        title: 'Carteira salva com sucesso',
      })
    },
  })

  const connectWallet = useMutation({
    mutationFn: ({ walletId, network }: { walletId: string; network: Network }) =>
      walletsApi.connect(walletId, network),
    onSuccess: (connection) => {
      invalidate()
      notify({
        tone: 'success',
        title: 'Carteira conectada',
        description: `Conectada na rede ${connection.network}.`,
      })
    },
    onError: (error) => {
      notify({
        tone: 'error',
        title: 'Falha ao conectar carteira',
        description: error instanceof Error ? error.message : 'Conexão recusada.',
      })
    },
  })

  const disconnectWallet = useMutation({
    mutationFn: () => walletsApi.disconnect(),
    onSuccess: () => {
      invalidate()
      notify({
        tone: 'info',
        title: 'Carteira desconectada',
      })
    },
  })

  return { upsertWallet, connectWallet, disconnectWallet }
}
