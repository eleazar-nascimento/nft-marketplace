import type { CreateOrderRequest, Network, Order } from '@/contracts'
import { terminalOrderStatuses } from '@/contracts'
import { store } from '../db/store'
import type { OrderRecord } from '../db/schema'
import { fingerprint } from '../lib/crypto'
import { createId, randomHex } from '../lib/random'
import { scenario } from '../scenarios'
import { applyPurchase, getOrCreateCart } from './cart'
import { errors, MockApiError } from './errors'
import { toOrder, toQuote } from './mappers'
import { computeQuote } from './quote'

const explorerBases: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  base: 'https://basescan.org/tx/',
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function settleOrderIfDue(order: OrderRecord, force = false): boolean {
  if (terminalOrderStatuses.includes(order.status)) return false
  if (!force && Date.parse(order.settleAt) > Date.now()) return false

  const timer = timers.get(order.id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(order.id)
  }

  const now = new Date().toISOString()
  order.version += 1
  order.updatedAt = now

  if (order.outcome === 'confirm') {
    const insufficient = order.lines.some((line) => {
      const nft = store.data.nfts.find((candidate) => candidate.id === line.nftId)
      const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
      return !edition || edition.disabled || edition.available < line.quantity
    })

    if (insufficient) {
      order.status = 'declined'
      order.declineReason = 'Disponibilidade insuficiente no momento da liquidação.'
    } else {
      const txHash = `0x${randomHex(64)}`
      order.status = 'confirmed'
      order.txHash = txHash
      order.explorerUrl = `${explorerBases[order.network]}${txHash}`
      const updatedNftIds: string[] = []
      for (const line of order.lines) {
        const nft = store.data.nfts.find((candidate) => candidate.id === line.nftId)
        const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
        if (nft && edition) {
          edition.available = Math.max(0, edition.available - line.quantity)
          nft.version += 1
          updatedNftIds.push(nft.id)
        }
      }
      applyPurchase(
        order.cartId,
        order.lines.map((line) => ({ editionId: line.editionId, quantity: line.quantity })),
      )
      store.save()
      store.emit({ type: 'order.updated', orderId: order.id, userId: order.userId })
      for (const nftId of updatedNftIds) {
        store.emit({ type: 'nft.updated', nftId })
      }
      return true
    }
  } else {
    order.status = 'declined'
    order.declineReason = 'Transação recusada pelo simulador de liquidação.'
  }

  store.save()
  store.emit({ type: 'order.updated', orderId: order.id, userId: order.userId })
  return true
}

function scheduleSettlement(order: OrderRecord): void {
  const existing = timers.get(order.id)
  if (existing) clearTimeout(existing)
  const delay = Math.max(50, Date.parse(order.settleAt) - Date.now())
  const handle = setTimeout(() => {
    timers.delete(order.id)
    settleOrderIfDue(order, true)
  }, delay)
  timers.set(order.id, handle)
}

export function settleDueOrders(): void {
  for (const order of store.data.orders) {
    if (!terminalOrderStatuses.includes(order.status)) {
      if (Date.parse(order.settleAt) <= Date.now()) {
        settleOrderIfDue(order, true)
      } else if (!timers.has(order.id)) {
        scheduleSettlement(order)
      }
    }
  }
}

export async function createOrder(
  userId: string,
  idempotencyKey: string,
  input: CreateOrderRequest,
): Promise<{ order: Order; reused: boolean }> {
  if (!idempotencyKey.trim()) {
    throw errors.validation({ idempotencyKey: 'Chave de idempotência obrigatória.' })
  }

  const requestHash = await fingerprint({
    quoteFingerprint: input.quoteFingerprint,
    walletId: input.walletId,
    network: input.network,
    collector: input.collector,
  })

  const existing = store.data.orders.find(
    (candidate) => candidate.userId === userId && candidate.idempotencyKey === idempotencyKey,
  )
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw errors.conflict(
        'IDEMPOTENCY_CONFLICT',
        'Esta chave de idempotência já foi utilizada com dados diferentes.',
      )
    }
    settleOrderIfDue(existing)
    return { order: toOrder(existing), reused: true }
  }

  const wallet = store.data.wallets.find(
    (candidate) => candidate.id === input.walletId && candidate.userId === userId,
  )
  if (!wallet) throw errors.notFound('Carteira')
  if (!wallet.networks.includes(input.network)) {
    throw errors.validation({ network: 'A carteira selecionada não suporta esta rede.' })
  }

  const connection = store.data.walletConnections[userId]
  if (!connection || connection.walletId !== wallet.id || connection.network !== input.network) {
    throw new MockApiError(409, 'WALLET_NOT_CONNECTED', 'Conecte a carteira na rede selecionada antes de finalizar.')
  }

  const cart = getOrCreateCart({ type: 'user', id: userId })
  if (cart.lines.length === 0) {
    throw errors.validation({ cart: 'Seu carrinho está vazio.' }, 'Seu carrinho está vazio.')
  }

  const savedQuote = store.data.quotes.find((candidate) => candidate.id === input.quoteId)
  if (savedQuote && Date.parse(savedQuote.expiresAt) <= Date.now()) {
    const fresh = await computeQuote(cart, input.network, userId)
    throw errors.conflict('QUOTE_EXPIRED', 'A cotação expirou. Revise os valores atualizados.', {
      quote: toQuote(fresh),
    })
  }

  const freshQuote = await computeQuote(cart, input.network, userId)
  if (freshQuote.issues.length > 0 || freshQuote.fingerprint !== input.quoteFingerprint) {
    throw errors.conflict(
      'QUOTE_STALE',
      'Preço ou disponibilidade mudou desde a última cotação. Revise e confirme novamente.',
      { quote: toQuote(freshQuote) },
    )
  }

  const createdAt = Date.now()
  const order: OrderRecord = {
    id: createId('ord'),
    userId,
    cartId: cart.id,
    status: 'pending',
    version: 1,
    idempotencyKey,
    requestHash,
    network: input.network,
    wallet: { id: wallet.id, label: wallet.label, address: wallet.address },
    collector: input.collector,
    lines: freshQuote.lines.map(({ lineId: _lineId, ...rest }) => rest),
    couponCode: freshQuote.coupon?.code ?? null,
    subtotalEth: freshQuote.subtotalEth,
    discountEth: freshQuote.discountEth,
    networkFeeEth: freshQuote.networkFeeEth,
    totalEth: freshQuote.totalEth,
    txHash: null,
    explorerUrl: null,
    declineReason: null,
    outcome: scenario.current.paymentOutcome,
    settleAt: new Date(createdAt + scenario.current.paymentDelayMs).toISOString(),
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(createdAt).toISOString(),
  }

  store.data.orders.unshift(order)
  store.save()
  scheduleSettlement(order)
  return { order: toOrder(order), reused: false }
}

export function getOrder(userId: string, orderId: string): Order {
  const order = store.data.orders.find((candidate) => candidate.id === orderId)
  if (!order) throw errors.notFound('Pedido')
  if (order.userId !== userId) throw errors.forbidden()
  settleOrderIfDue(order)
  return toOrder(order)
}

export function listOrders(userId: string): Order[] {
  settleDueOrders()
  return store.data.orders.filter((order) => order.userId === userId).map(toOrder)
}

export function forceOrderStatus(orderId: string, outcome: 'confirm' | 'decline'): Order {
  const order = store.data.orders.find((candidate) => candidate.id === orderId)
  if (!order) throw errors.notFound('Pedido')
  order.outcome = outcome
  settleOrderIfDue(order, true)
  return toOrder(order)
}
