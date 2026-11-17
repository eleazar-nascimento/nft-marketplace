import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  addCartItemSchema,
  applyCouponSchema,
  changePasswordSchema,
  createOrderSchema,
  loginRequestSchema,
  networkSchema,
  nftCategories,
  nftListQuerySchema,
  quoteRequestSchema,
  registerRequestSchema,
  updateAvatarSchema,
  updateCartItemSchema,
  updateProfileSchema,
  walletSchema,
  type NftCategory,
} from '@/contracts'
import { store } from './db/store'
import {
  addFavorite,
  changePassword,
  connectWallet,
  disconnectWallet,
  getFavorites,
  listWallets,
  removeFavorite,
  updateAvatar,
  updateProfile,
  upsertWallet,
} from './domain/account'
import { expireSessions, login, logout, register, resolveSession } from './domain/auth'
import {
  acknowledgeChanges,
  addItem,
  applyCoupon,
  getOrCreateCart,
  mergeGuestCart,
  removeCoupon,
  removeItem,
  updateItem,
   type CartOwner,
} from './domain/cart'
import { getNftDetail, listFeatured, listNfts, updateEdition } from './domain/catalog'
import { errors, MockApiError, zodFieldErrors } from './domain/errors'
import { toCart, toProfile, toQuote } from './domain/mappers'
import { createOrder, forceOrderStatus, getOrder, listOrders } from './domain/orders'
import { computeQuote } from './domain/quote'
import { isPreset, scenario, type ScenarioConfig, type ScenarioPreset } from './scenarios'
import {
  activeSocketCount,
  allowSocketConnections,
  disconnectSockets,
  emitCustomNftEvent,
  emitCustomOrderEvent,
} from './ws'

function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1]?.trim() ?? null
}

function guestCartId(request: Request): string {
  return request.headers.get('x-guest-cart-id')?.trim() || 'guest_default'
}

function resolveCartOwner(request: Request): { owner: CartOwner; userId: string | null } {
  const token = bearerToken(request)
  if (token) {
    const { user } = resolveSession(token)
    return { owner: { type: 'user', id: user.id }, userId: user.id }
  }
  return { owner: { type: 'guest', id: guestCartId(request) }, userId: null }
}

async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw errors.validation({ form: ' Corpo da requisição inválido.' }, 'Corpo da requisição inválido.')
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw errors.validation(zodFieldErrors(parsed.error.issues))
  }
  return parsed.data
}

async function withSimulation(
  routeKey: string,
  handler: () => Promise<Response> | Response,
): Promise<Response> {
  if (scenario.current.offline) {
    await delay(80)
    return HttpResponse.error()
  }

  const waitMs = scenario.latencyFor(routeKey)
  if (waitMs > 0) {
    await delay(waitMs)
  }

  const failure = scenario.consumeFailure(routeKey)
  if (failure) {
    if (failure.mode === 'network') {
      return HttpResponse.error()
    }
    if (failure.mode === 'timeout') {
      await delay(250)
      return HttpResponse.json(
        { error: { code: 'TIMEOUT', message: 'A requisição excedeu o tempo limite.' } },
        { status: 504 },
      )
    }
    const err = errors.transient(failure.status ?? 503)
    return HttpResponse.json(err.toBody(), { status: err.status })
  }

  try {
    const response = await handler()
    store.save()
    return response
  } catch (error) {
    if (error instanceof MockApiError) {
      store.save()
      return HttpResponse.json(error.toBody(), { status: error.status })
    }
    throw error
  }
}

function parseNftQuery(url: URL) {
  const rawCategories = url.searchParams
    .getAll('category')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter((entry): entry is NftCategory => (nftCategories as readonly string[]).includes(entry))

  const pageParam = url.searchParams.get('page')
  const pageSizeParam = url.searchParams.get('pageSize')

  const candidate = {
    q: url.searchParams.get('q') || undefined,
    category: rawCategories.length > 0 ? rawCategories : undefined,
    network: url.searchParams.get('network') || undefined,
    minPrice: url.searchParams.get('minPrice') || undefined,
    maxPrice: url.searchParams.get('maxPrice') || undefined,
    availability: url.searchParams.get('availability') || undefined,
    sort: url.searchParams.get('sort') || undefined,
    page: pageParam ? Number(pageParam) : undefined,
    pageSize: pageSizeParam ? Number(pageSizeParam) : undefined,
  }

  const parsed = nftListQuerySchema.safeParse(candidate)
  if (!parsed.success) {
    throw errors.validation(zodFieldErrors(parsed.error.issues))
  }
  return parsed.data
}

export const restHandlers = [
  http.post('/api/auth/register', ({ request }) =>
    withSimulation('POST /auth/register', async () => {
      const input = await parseJson(request, registerRequestSchema)
      const { session, user } = await register(input)
      const mergedCartItems = mergeGuestCart(guestCartId(request), user.id)
      return HttpResponse.json({ session, mergedCartItems }, { status: 201 })
    }),
  ),

  http.post('/api/auth/login', ({ request }) =>
    withSimulation('POST /auth/login', async () => {
      const input = await parseJson(request, loginRequestSchema)
      const { session, user } = await login(input)
      const mergedCartItems = mergeGuestCart(guestCartId(request), user.id)
      return HttpResponse.json({ session, mergedCartItems })
    }),
  ),

  http.get('/api/auth/session', ({ request }) =>
    withSimulation('GET /auth/session', () => {
      const { session, user } = resolveSession(bearerToken(request))
      return HttpResponse.json({
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      })
    }),
  ),

  http.post('/api/auth/logout', ({ request }) =>
    withSimulation('POST /auth/logout', () => {
      logout(bearerToken(request))
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.post('/api/auth/expire', ({ request }) =>
    withSimulation('POST /auth/expire', () => {
      const token = bearerToken(request)
      const session = store.data.sessions.find((candidate) => candidate.token === token)
      const expired = expireSessions(session?.userId)
      return HttpResponse.json({ expired })
    }),
  ),

  http.get('/api/nfts/featured', () =>
    withSimulation('GET /nfts/featured', () => HttpResponse.json({ items: listFeatured() })),
  ),

  http.get('/api/nfts', ({ request }) =>
    withSimulation('GET /nfts', () => {
      const query = parseNftQuery(new URL(request.url))
      return HttpResponse.json(listNfts(query))
    }),
  ),

  http.get('/api/nfts/:nftId', ({ params }) =>
    withSimulation('GET /nfts/:nftId', () => {
      const nftId = String(params.nftId ?? '')
      return HttpResponse.json(getNftDetail(nftId))
    }),
  ),

  http.get('/api/favorites', ({ request }) =>
    withSimulation('GET /favorites', () => {
      const { user } = resolveSession(bearerToken(request))
      return HttpResponse.json({ nftIds: getFavorites(user.id) })
    }),
  ),

  http.post('/api/favorites', ({ request }) =>
    withSimulation('POST /favorites', async () => {
      const { user } = resolveSession(bearerToken(request))
      const body = await parseJson(request, z.object({ nftId: z.string().min(1) }))
      return HttpResponse.json({ nftIds: addFavorite(user.id, body.nftId) })
    }),
  ),

  http.delete('/api/favorites/:nftId', ({ request, params }) =>
    withSimulation('DELETE /favorites/:nftId', () => {
      const { user } = resolveSession(bearerToken(request))
      const nftId = String(params.nftId ?? '')
      return HttpResponse.json({ nftIds: removeFavorite(user.id, nftId) })
    }),
  ),

  http.get('/api/cart', ({ request }) =>
    withSimulation('GET /cart', () => {
      const { owner } = resolveCartOwner(request)
      const cart = getOrCreateCart(owner)
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.post('/api/cart/items', ({ request }) =>
    withSimulation('POST /cart/items', async () => {
      const { owner } = resolveCartOwner(request)
      const input = await parseJson(request, addCartItemSchema)
      const cart = addItem(getOrCreateCart(owner), input)
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.patch('/api/cart/items/:lineId', ({ request, params }) =>
    withSimulation('PATCH /cart/items/:lineId', async () => {
      const { owner } = resolveCartOwner(request)
      const input = await parseJson(request, updateCartItemSchema)
      const lineId = String(params.lineId ?? '')
      const cart = updateItem(getOrCreateCart(owner), lineId, input.quantity)
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.delete('/api/cart/items/:lineId', ({ request, params }) =>
    withSimulation('DELETE /cart/items/:lineId', () => {
      const { owner } = resolveCartOwner(request)
      const lineId = String(params.lineId ?? '')
      const cart = removeItem(getOrCreateCart(owner), lineId)
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.post('/api/cart/coupon', ({ request }) =>
    withSimulation('POST /cart/coupon', async () => {
      const { owner } = resolveCartOwner(request)
      const input = await parseJson(request, applyCouponSchema)
      const cart = applyCoupon(getOrCreateCart(owner), input.code)
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.delete('/api/cart/coupon', ({ request }) =>
    withSimulation('DELETE /cart/coupon', () => {
      const { owner } = resolveCartOwner(request)
      const cart = removeCoupon(getOrCreateCart(owner))
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.post('/api/cart/acknowledge', ({ request }) =>
    withSimulation('POST /cart/acknowledge', () => {
      const { owner } = resolveCartOwner(request)
      const cart = acknowledgeChanges(getOrCreateCart(owner))
      return HttpResponse.json(toCart(cart, store.data.nfts))
    }),
  ),

  http.post('/api/quotes', ({ request }) =>
    withSimulation('POST /quotes', async () => {
      const { owner, userId } = resolveCartOwner(request)
      const input = await parseJson(request, quoteRequestSchema)
      const cart = getOrCreateCart(owner)
      const quote = await computeQuote(cart, input.network, userId)

      const scheduledMutation = scenario.consumeCheckoutMutation()
      const firstLine = cart.lines[0]
      if (scheduledMutation !== 'none' && firstLine) {
        const wait = scenario.current.checkoutMutationDelayMs
        setTimeout(() => {
          if (scheduledMutation === 'price') {
            updateEdition(firstLine.nftId, { editionId: firstLine.editionId, priceDeltaPercent: 25 })
          } else {
            updateEdition(firstLine.nftId, { editionId: firstLine.editionId, available: 0 })
          }
        }, wait)
      }

      return HttpResponse.json(toQuote(quote))
    }),
  ),

  http.post('/api/orders', ({ request }) =>
    withSimulation('POST /orders', async () => {
      const { user } = resolveSession(bearerToken(request))
      const idempotencyKey =
        request.headers.get('idempotency-key') ?? request.headers.get('x-idempotency-key') ?? ''
      const input = await parseJson(request, createOrderSchema)
      const { order, reused } = await createOrder(user.id, idempotencyKey, input)

      if (!reused && scenario.consumeOrderTimeout()) {
        store.save()
        await delay(250)
        return HttpResponse.json(
          {
            error: {
              code: 'TIMEOUT',
              message: 'A confirmação do envio excedeu o tempo limite. Tente novamente para recuperar o pedido.',
            },
          },
          { status: 504 },
        )
      }

      return HttpResponse.json(order, { status: reused ? 200 : 201 })
    }),
  ),

  http.get('/api/orders', ({ request }) =>
    withSimulation('GET /orders', () => {
      const { user } = resolveSession(bearerToken(request))
      return HttpResponse.json({ items: listOrders(user.id) })
    }),
  ),

  http.get('/api/orders/:orderId', ({ request, params }) =>
    withSimulation('GET /orders/:orderId', () => {
      const { user } = resolveSession(bearerToken(request))
      const orderId = String(params.orderId ?? '')
      return HttpResponse.json(getOrder(user.id, orderId))
    }),
  ),

  http.get('/api/profile', ({ request }) =>
    withSimulation('GET /profile', () => {
      const { user } = resolveSession(bearerToken(request))
      return HttpResponse.json(toProfile(user))
    }),
  ),

  http.put('/api/profile', ({ request }) =>
    withSimulation('PUT /profile', async () => {
      const { user } = resolveSession(bearerToken(request))
      const input = await parseJson(request, updateProfileSchema)
      return HttpResponse.json(updateProfile(user, input))
    }),
  ),

  http.put('/api/profile/avatar', ({ request }) =>
    withSimulation('PUT /profile/avatar', async () => {
      const { user } = resolveSession(bearerToken(request))
      const input = await parseJson(request, updateAvatarSchema)
      return HttpResponse.json(updateAvatar(user, input))
    }),
  ),

  http.put('/api/profile/password', ({ request }) =>
    withSimulation('PUT /profile/password', async () => {
      const { user } = resolveSession(bearerToken(request))
      const input = await parseJson(request, changePasswordSchema)
      await changePassword(user, input)
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get('/api/wallets', ({ request }) =>
    withSimulation('GET /wallets', () => {
      const { user } = resolveSession(bearerToken(request))
      return HttpResponse.json(listWallets(user.id))
    }),
  ),

  http.post('/api/wallets', ({ request }) =>
    withSimulation('POST /wallets', async () => {
      const { user } = resolveSession(bearerToken(request))
      const input = await parseJson(request, walletSchema)
      return HttpResponse.json(upsertWallet(user.id, input), { status: 201 })
    }),
  ),

  http.put('/api/wallets/:walletId', ({ request, params }) =>
    withSimulation('PUT /wallets/:walletId', async () => {
      const { user } = resolveSession(bearerToken(request))
      const input = await parseJson(request, walletSchema)
      const walletId = String(params.walletId ?? '')
      return HttpResponse.json(upsertWallet(user.id, input, walletId))
    }),
  ),

  http.post('/api/wallets/:walletId/connect', ({ request, params }) =>
    withSimulation('POST /wallets/:walletId/connect', async () => {
      const { user } = resolveSession(bearerToken(request))
      const input = await parseJson(request, z.object({ network: networkSchema }))
      const walletId = String(params.walletId ?? '')
      return HttpResponse.json(connectWallet(user.id, walletId, input.network))
    }),
  ),

  http.post('/api/wallets/disconnect', ({ request }) =>
    withSimulation('POST /wallets/disconnect', () => {
      const { user } = resolveSession(bearerToken(request))
      disconnectWallet(user.id)
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get('/api/__sim/state', () =>
    HttpResponse.json({
      scenario: scenario.current,
      activeSockets: activeSocketCount(),
    }),
  ),

  http.post('/api/__sim/scenario', async ({ request }) => {
    const body = (await request.json()) as { preset?: ScenarioPreset } & Partial<ScenarioConfig>
    const updated = body.preset && isPreset(body.preset) ? scenario.set(body.preset) : scenario.set(body)
    return HttpResponse.json({ scenario: updated })
  }),

  http.post('/api/__sim/reset', async ({ request }) => {
    let preset: ScenarioPreset = 'default'
    try {
      const body = (await request.json()) as { preset?: string }
      if (body.preset && isPreset(body.preset)) preset = body.preset
    } catch {
      preset = 'default'
    }
    allowSocketConnections()
    await store.reset()
    const updated = scenario.set(preset)
    return HttpResponse.json({ scenario: updated })
  }),

  http.post('/api/__sim/nft-mutate', async ({ request }) => {
    const body = (await request.json()) as {
      nftId: string
      editionId?: string
      priceEth?: string
      available?: number
      priceDeltaPercent?: number
    }
    const nft = updateEdition(body.nftId, body)
    return HttpResponse.json({ nftId: nft.id, version: nft.version })
  }),

  http.post('/api/__sim/socket-event', async ({ request }) => {
    const body = (await request.json()) as
      | { type: 'nft.updated'; nftId: string; version?: number; eventId?: string }
      | { type: 'order.updated'; orderId: string; version?: number; eventId?: string }
    const emitted =
      body.type === 'nft.updated' ? emitCustomNftEvent(body) : emitCustomOrderEvent(body)
    return HttpResponse.json({ emitted })
  }),

  http.post('/api/__sim/socket-disconnect', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { blockReconnect?: boolean }
    const blockReconnect = Boolean(body.blockReconnect)
    const disconnected = disconnectSockets({ blockReconnect })
    return HttpResponse.json({ disconnected, blockReconnect })
  }),

  http.post('/api/__sim/socket-allow', () => {
    allowSocketConnections()
    return HttpResponse.json({ allowed: true })
  }),

  http.post('/api/__sim/order-settle', async ({ request }) => {
    const body = (await request.json()) as { orderId: string; outcome: 'confirm' | 'decline' }
    const order = forceOrderStatus(body.orderId, body.outcome)
    return HttpResponse.json({ order })
  }),
]
