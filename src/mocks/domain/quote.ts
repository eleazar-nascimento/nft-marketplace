import type { Network, QuoteIssue, QuoteLine } from '@/contracts'
import { addEth, compareEth, isZeroEth, mulEth, percentOfEth, subEth } from '@/lib/eth'
import { nftImage } from '../fixtures/nfts'
import { store } from '../db/store'
import type { CartRecord, QuoteRecord } from '../db/schema'
import { fingerprint } from '../lib/crypto'
import { createId } from '../lib/random'
import { lineLimit, validateCoupon } from './cart'
import { MockApiError } from './errors'

export const networkFees: Record<Network, string> = {
  ethereum: '0.0042',
  polygon: '0.0004',
  base: '0.0009',
}

const QUOTE_TTL_MS = 5 * 60 * 1000

export async function computeQuote(cart: CartRecord, network: Network, userId: string | null): Promise<QuoteRecord> {
  const issues: QuoteIssue[] = []
  const lines: QuoteLine[] = []

  for (const line of cart.lines) {
    const nft = store.data.nfts.find((candidate) => candidate.id === line.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === line.editionId)
    if (!nft || !edition) continue
    const max = lineLimit(edition)
    if (max === 0) {
      issues.push({ type: 'sold_out', lineId: line.id })
      continue
    }
    if (line.quantity > max) {
      issues.push({ type: 'quantity_reduced', lineId: line.id, requested: line.quantity, available: max })
    }
    if (compareEth(line.addedUnitPriceEth, edition.priceEth) !== 0) {
      issues.push({
        type: 'price_changed',
        lineId: line.id,
        previousUnitPriceEth: line.addedUnitPriceEth,
        unitPriceEth: edition.priceEth,
      })
    }
    const quantity = Math.min(line.quantity, max)
    lines.push({
      lineId: line.id,
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      editionName: edition.name,
      image: nftImage(nft.imageIndexes[0] ?? 0, nft.name),
      quantity,
      unitPriceEth: edition.priceEth,
      lineTotalEth: mulEth(edition.priceEth, quantity),
    })
  }

  let coupon: QuoteRecord['coupon'] = null
  if (cart.couponCode) {
    try {
      coupon = validateCoupon(cart.couponCode)
    } catch (error) {
      if (error instanceof MockApiError && (error.code === 'COUPON_INVALID' || error.code === 'COUPON_EXPIRED')) {
        issues.push({ type: 'coupon_removed', code: cart.couponCode, reason: error.code })
      }
    }
  }

  const subtotalEth = addEth('0', ...lines.map((line) => line.lineTotalEth))
  const discountEth = coupon ? percentOfEth(subtotalEth, coupon.percentOff) : '0'
  const networkFeeEth = lines.length > 0 ? networkFees[network] : '0'
  const totalEth = addEth(subEth(subtotalEth, discountEth), networkFeeEth)
  const createdAt = Date.now()

  const quote: QuoteRecord = {
    id: createId('qt'),
    cartId: cart.id,
    userId,
    fingerprint: await fingerprint({
      lines: lines.map((line) => [line.lineId, line.editionId, line.quantity, line.unitPriceEth]),
      coupon: coupon?.code ?? null,
      network,
      networkFeeEth,
      totalEth,
    }),
    network,
    lines,
    coupon,
    subtotalEth,
    discountEth: isZeroEth(discountEth) ? '0' : discountEth,
    networkFeeEth,
    totalEth,
    issues,
    createdAt: new Date(createdAt).toISOString(),
    expiresAt: new Date(createdAt + QUOTE_TTL_MS).toISOString(),
  }

  store.data.quotes = [...store.data.quotes.filter((candidate) => Date.parse(candidate.expiresAt) > createdAt), quote].slice(-30)
  return quote
}
