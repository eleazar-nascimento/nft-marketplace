import type {
  ChangePasswordRequest,
  Network,
  Profile,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  Wallet,
  WalletConnection,
  WalletRequest,
} from '@/contracts'
import { store } from '../db/store'
import type { UserRecord, WalletRecord } from '../db/schema'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { createId } from '../lib/random'
import { scenario } from '../scenarios'
import { findNft } from './catalog'
import { errors, MockApiError } from './errors'
import { toProfile, toWallet } from './mappers'

export function getFavorites(userId: string): string[] {
  return [...(store.data.favorites[userId] ?? [])]
}

export function addFavorite(userId: string, nftId: string): string[] {
  const nft = findNft(nftId)
  const current = new Set(store.data.favorites[userId] ?? [])
  if (!current.has(nftId)) {
    current.add(nftId)
    nft.likes += 1
  }
  const next = Array.from(current)
  store.data.favorites[userId] = next
  return next
}

export function removeFavorite(userId: string, nftId: string): string[] {
  const nft = store.data.nfts.find((candidate) => candidate.id === nftId)
  const current = new Set(store.data.favorites[userId] ?? [])
  if (current.delete(nftId) && nft && nft.likes > 0) {
    nft.likes -= 1
  }
  const next = Array.from(current)
  store.data.favorites[userId] = next
  return next
}

export function updateProfile(user: UserRecord, input: UpdateProfileRequest): Profile {
  const normalizedEmail = input.email.trim().toLowerCase()
  const fieldErrors: Record<string, string> = {}
  if (
    store.data.users.some((candidate) => candidate.id !== user.id && candidate.email.toLowerCase() === normalizedEmail)
  ) {
    fieldErrors.email = 'Este e-mail já está em uso.'
  }
  if (store.data.users.some((candidate) => candidate.id !== user.id && candidate.username === input.username)) {
    fieldErrors.username = 'Este nome de usuário já está em uso.'
  }
  if (fieldErrors.email || fieldErrors.username) {
    throw errors.conflict(
      fieldErrors.email ? 'EMAIL_TAKEN' : 'USERNAME_TAKEN',
      'Os dados informados já pertencem a outra conta.',
      undefined,
      fieldErrors,
    )
  }

  user.name = input.name.trim()
  user.username = input.username
  user.email = normalizedEmail
  user.bio = input.bio.trim()
  user.website = input.website.trim()
  user.updatedAt = new Date().toISOString()
  return toProfile(user)
}

export function updateAvatar(user: UserRecord, input: UpdateAvatarRequest): Profile {
  user.avatarUrl = input.dataUrl
  user.updatedAt = new Date().toISOString()
  return toProfile(user)
}

export async function changePassword(user: UserRecord, input: ChangePasswordRequest): Promise<void> {
  const valid = await verifyPassword(input.currentPassword, user.passwordHash, user.passwordSalt)
  if (!valid) {
    throw errors.validation({ currentPassword: 'Senha atual incorreta.' }, 'Senha atual incorreta.')
  }
  const { hash, salt } = await hashPassword(input.newPassword)
  user.passwordHash = hash
  user.passwordSalt = salt
  user.updatedAt = new Date().toISOString()
}

export function listWallets(userId: string): { wallets: Wallet[]; connection: WalletConnection | null } {
  const wallets = store.data.wallets.filter((wallet) => wallet.userId === userId).map(toWallet)
  const record = store.data.walletConnections[userId] ?? null
  const connection: WalletConnection | null = record
    ? { walletId: record.walletId, network: record.network, status: 'connected', connectedAt: record.connectedAt }
    : null
  return { wallets, connection }
}

export function upsertWallet(userId: string, input: WalletRequest, walletId?: string): Wallet {
  const duplicateAddress = store.data.wallets.find(
    (candidate) =>
      candidate.userId === userId &&
      candidate.id !== walletId &&
      candidate.address.toLowerCase() === input.address.toLowerCase(),
  )
  if (duplicateAddress) {
    throw errors.conflict('CONFLICT', 'Este endereço já está cadastrado em outra carteira.', undefined, {
      address: 'Este endereço já está cadastrado.',
    })
  }

  const existingById = walletId
    ? store.data.wallets.find((candidate) => candidate.id === walletId && candidate.userId === userId)
    : undefined
  const existingByKind = store.data.wallets.find(
    (candidate) => candidate.userId === userId && candidate.kind === input.kind,
  )
  const target = existingById ?? existingByKind
  const now = new Date().toISOString()

  if (target) {
    target.kind = input.kind
    target.label = input.label.trim()
    target.provider = input.provider
    target.address = input.address
    target.networks = [...input.networks]
    target.updatedAt = now
    return toWallet(target)
  }

  const created: WalletRecord = {
    id: createId('wal'),
    userId,
    kind: input.kind,
    label: input.label.trim(),
    provider: input.provider,
    address: input.address,
    networks: [...input.networks],
    createdAt: now,
    updatedAt: now,
  }
  store.data.wallets.push(created)
  return toWallet(created)
}

export function connectWallet(userId: string, walletId: string, network: Network): WalletConnection {
  const wallet = store.data.wallets.find((candidate) => candidate.id === walletId && candidate.userId === userId)
  if (!wallet) throw errors.notFound('Carteira')
  if (!wallet.networks.includes(network)) {
    throw errors.validation({ network: 'Esta carteira não está habilitada para a rede selecionada.' })
  }
  if (scenario.current.walletConnect === 'reject') {
    throw new MockApiError(409, 'WALLET_REJECTED', 'A conexão com a carteira foi recusada.')
  }
  const connectedAt = new Date().toISOString()
  store.data.walletConnections[userId] = { walletId: wallet.id, network, connectedAt }
  return { walletId: wallet.id, network, status: 'connected', connectedAt }
}

export function disconnectWallet(userId: string): void {
  store.data.walletConnections[userId] = null
}
