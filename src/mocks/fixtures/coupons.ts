export interface CouponFixture {
  code: string
  percentOff: number
  expiresAt: string
}

export const couponFixtures: CouponFixture[] = [
  { code: 'NFT10', percentOff: 10, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'WELCOME15', percentOff: 15, expiresAt: '2099-12-31T23:59:59.000Z' },
  { code: 'EXPIRED20', percentOff: 20, expiresAt: '2024-01-01T00:00:00.000Z' },
]
