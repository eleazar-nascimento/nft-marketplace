import type { AddCartItemRequest } from '@/contracts'
import { couponFixtures } from '../fixtures/coupons'
import { store } from '../db/store'
import type { CartRecord, EditionRecord, NftRecord } from '../db/schema'
import { createId } from '../lib/random'
import { errors, MockApiError } from './errors'
import { findNft } from './catalog'
import { editionStatus } from './mappers'

export interface CartOwner {
  type: 'guest' | 'user'
  id: string
}

export function findCart(owner: CartOwner): CartRecord | undefined {
  return store.data.carts.find((cart) => cart.ownerType === owner.type && cart.ownerId === owner.id)
}

export function getOrCreateCart(owner: CartOwner): CartRecord {
  const existing = findCart(owner)
  if (existing) return existing
  const cart: CartRecord = {
    id: createId('cart'),
    ownerType: owner.type,
    ownerId: owner.id,
    lines: [],
    couponCode: null,
    updatedAt: new Date().toISOString(),
    version: 1,
  }
  store.data.carts.push(cart)
  return cart
}

function touch(cart: CartRecord): void {
  cart.version += 1
  cart.updatedAt = new Date().toISOString()
}

function resolveEdition(nftId: string, editionId: string): { nft: NftRecord; edition: EditionRecord } {
  const nft = findNft(nftId)
  const edition = nft.editions.find((candidate) => candidate.id === editionId)
  if (!edition) throw errors.notFound('Edição')
  return { nft, edition }
}

export function lineLimit(edition: EditionRecord): number {
  return editionStatus(edition) === 'available' ? Math.min(edition.available, edition.maxPerOrder) : 0
}

function assertQuantity(edition: EditionRecord, quantity: number): void {
  const status = editionStatus(edition)
  if (status !== 'available') {
    throw errors.conflict(
      'EDITION_UNAVAILABLE',
      status === 'sold_out' ? 'Esta edição está esgotada.' : 'Esta edição não está disponível para compra.',
      { editionId: edition.id, status },
    )
  }
  const max = lineLimit(edition)
  if (quantity > max) {
    throw errors.conflict('QUANTITY_LIMIT', `Quantidade máxima para esta edição: ${max}.`, {
      editionId: edition.id,
      max,
    })
  }
}

export function addItem(cart: CartRecord, input: AddCartItemRequest): CartRecord {
  const { edition } = resolveEdition(input.nftId, input.editionId)
  const existing = cart.lines.find((line) => line.editionId === input.editionId)
  const nextQuantity = (existing?.quantity ?? 0) + input.quantity
  assertQuantity(edition, nextQuantity)
  if (existing) {
    existing.quantity = nextQuantity
    existing.addedUnitPriceEth = edition.priceEth
  } else {
    cart.lines.push({
      id: createId('line'),
      nftId: input.nftId,
      editionId: input.editionId,
      quantity: input.quantity,
      addedUnitPriceEth: edition.priceEth,
    })
  }
  touch(cart)
  return cart
}

export function updateItem(cart: CartRecord, lineId: string, quantity: number): CartRecord {
  const line = cart.lines.find((candidate) => candidate.id === lineId)
  if (!line) throw errors.notFound('Item do carrinho')
  const { edition } = resolveEdition(line.nftId, line.editionId)
  if (quantity > line.quantity) {
    assertQuantity(edition, quantity)
  }
  line.quantity = quantity
  touch(cart)
  return cart
}

export function removeItem(cart: CartRecord, lineId: string): CartRecord {
  const before = cart.lines.length
  cart.lines = cart.lines.filter((line) => line.id !== lineId)
  if (cart.lines.length === before) throw errors.notFound('Item do carrinho')
  touch(cart)
  return cart
}

export function validateCoupon(code: string): { code: string; percentOff: number } {
  const normalized = code.trim().toUpperCase()
  const coupon = couponFixtures.find((candidate) => candidate.code === normalized)
  if (!coupon) {
    throw new MockApiError(422, 'COUPON_INVALID', 'Cupom inválido.', { code: 'Cupom inválido.' })
  }
  if (Date.parse(coupon.expiresAt) <= Date.now()) {
    throw new MockApiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { code: 'Este cupom expirou.' })
  }
  return { code: coupon.code, percentOff: coupon.percentOff }
}

export function applyCoupon(cart: CartRecord, code: string): CartRecord {
  if (cart.lines.length === 0) {
    throw new MockApiError(422, 'VALIDATION_ERROR', 'Adicione itens antes de aplicar um cupom.', {
      code: 'Adicione itens antes de aplicar um cupom.',
    })
  }
  cart.couponCode = validateCoupon(code).code
  touch(cart)
  return cart
}

export function removeCoupon(cart: CartRecord): CartRecord {
  cart.couponCode = null
  touch(cart)
  return cart
}

export function acknowledgeChanges(cart: CartRecord): CartRecord {
  cart.lines = cart.lines.flatMap((line) => {
    const nft = store.data.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!edition) return []
    const max = lineLimit(edition)
    if (max === 0) return []
    return [{ ...line, quantity: Math.min(line.quantity, max), addedUnitPriceEth: edition.priceEth }]
  })
  touch(cart)
  return cart
}

export function mergeGuestCart(guestCartId: string | null, userId: string): number {
  if (!guestCartId) return 0
  const guest = findCart({ type: 'guest', id: guestCartId })
  if (!guest || guest.lines.length === 0) return 0
  const target = getOrCreateCart({ type: 'user', id: userId })
  let merged = 0
  for (const line of guest.lines) {
    const nft = store.data.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!edition) continue
    const existing = target.lines.find((candidate) => candidate.editionId === line.editionId)
    const max = Math.max(lineLimit(edition), existing?.quantity ?? 0)
    if (existing) {
      const next = Math.min(existing.quantity + line.quantity, max)
      merged += next - existing.quantity
      existing.quantity = next
    } else {
      target.lines.push({ ...line, id: createId('line'), quantity: Math.min(line.quantity, Math.max(max, 1)) })
      merged += line.quantity
    }
  }
  if (!target.couponCode && guest.couponCode) target.couponCode = guest.couponCode
  touch(target)
  store.data.carts = store.data.carts.filter((cart) => cart !== guest)
  return merged
}

export function applyPurchase(cartId: string, purchased: Array<{ editionId: string; quantity: number }>): void {
  const cart = store.data.carts.find((candidate) => candidate.id === cartId)
  if (!cart) return
  for (const item of purchased) {
    const line = cart.lines.find((candidate) => candidate.editionId === item.editionId)
    if (!line) continue
    line.quantity -= item.quantity
  }
  cart.lines = cart.lines.filter((line) => line.quantity > 0)
  if (cart.lines.length === 0) cart.couponCode = null
  touch(cart)
}
