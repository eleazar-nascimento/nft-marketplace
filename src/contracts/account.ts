import { z } from 'zod'
import { emailSchema, passwordSchema, usernameSchema } from './auth'
import type { Network } from './common'
import { networkSchema } from './common'

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome').max(60, 'Use no máximo 60 caracteres'),
  username: usernameSchema,
  email: emailSchema,
  bio: z.string().trim().max(280, 'Use no máximo 280 caracteres'),
  website: z.union([z.literal(''), z.url('URL inválida')]),
})

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>

export const MAX_AVATAR_BYTES = 1024 * 1024

export const updateAvatarSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Envie uma imagem PNG, JPEG ou WEBP')
    .max(Math.ceil((MAX_AVATAR_BYTES * 4) / 3) + 64, 'A imagem deve ter até 1 MB'),
})

export type UpdateAvatarRequest = z.infer<typeof updateAvatarSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual',
  })

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>

export interface Profile {
  id: string
  name: string
  username: string
  email: string
  bio: string
  website: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export const walletProviders = ['metamask', 'coinbase', 'walletconnect'] as const
export type WalletProvider = (typeof walletProviders)[number]

export const walletProviderLabels: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  walletconnect: 'WalletConnect',
}

export const walletKinds = ['primary', 'secondary'] as const
export type WalletKind = (typeof walletKinds)[number]

export const walletSchema = z.object({
  kind: z.enum(walletKinds),
  label: z.string().trim().min(2, 'Informe um nome para a carteira').max(32, 'Use no máximo 32 caracteres'),
  provider: z.enum(walletProviders),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais'),
  networks: z.array(networkSchema).min(1, 'Selecione ao menos uma rede'),
})

export type WalletRequest = z.infer<typeof walletSchema>

export interface Wallet {
  id: string
  kind: WalletKind
  label: string
  provider: WalletProvider
  address: string
  networks: Network[]
  createdAt: string
  updatedAt: string
}

export interface WalletConnection {
  walletId: string
  network: Network
  status: 'connected'
  connectedAt: string
}
