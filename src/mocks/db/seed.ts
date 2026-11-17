import { nftFixtures } from '../fixtures/nfts'
import { userFixtures } from '../fixtures/users'
import { hashPassword } from '../lib/crypto'
import type { MockState } from './schema'

export const SCHEMA_VERSION = 1

const SEED_DATE = '2026-10-01T12:00:00.000Z'

export async function createSeedState(): Promise<MockState> {
  const users = await Promise.all(
    userFixtures.map(async (fixture) => {
      const { hash, salt } = await hashPassword(fixture.password, `seed-${fixture.id}`)
      return {
        id: fixture.id,
        name: fixture.name,
        username: fixture.username,
        email: fixture.email,
        passwordHash: hash,
        passwordSalt: salt,
        bio: fixture.bio,
        website: fixture.website,
        avatarUrl: fixture.avatarUrl,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      }
    }),
  )

  return {
    schemaVersion: SCHEMA_VERSION,
    users,
    sessions: [],
    nfts: nftFixtures.map((fixture) => ({
      ...fixture,
      tags: [...fixture.tags],
      imageIndexes: [...fixture.imageIndexes],
      editions: fixture.editions.map((edition) => ({ ...edition })),
      version: 1,
    })),
    carts: [],
    favorites: Object.fromEntries(userFixtures.map((fixture) => [fixture.id, [...fixture.favorites]])),
    wallets: userFixtures.flatMap((fixture) =>
      fixture.wallets.map((wallet) => ({
        ...wallet,
        networks: [...wallet.networks],
        userId: fixture.id,
        createdAt: SEED_DATE,
        updatedAt: SEED_DATE,
      })),
    ),
    walletConnections: {},
    quotes: [],
    orders: [],
  }
}
