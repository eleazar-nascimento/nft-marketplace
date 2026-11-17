import type { Network, WalletKind, WalletProvider } from '@/contracts'

export interface UserFixture {
  id: string
  name: string
  username: string
  email: string
  password: string
  bio: string
  website: string
  avatarUrl: string | null
  favorites: string[]
  wallets: Array<{
    id: string
    kind: WalletKind
    label: string
    provider: WalletProvider
    address: string
    networks: Network[]
  }>
}

export const userFixtures: UserFixture[] = [
  {
    id: 'usr_ana',
    name: 'Ana Souza',
    username: 'ana_souza',
    email: 'ana@nft.dev',
    password: 'Senha@123',
    bio: 'Colecionadora de arte generativa e fotografia digital.',
    website: 'https://ana.nft.dev',
    avatarUrl: '/images/avatars/avatar-05.webp',
    favorites: ['nft_001', 'nft_004'],
    wallets: [
      {
        id: 'wal_ana_primary',
        kind: 'primary',
        label: 'Carteira principal',
        provider: 'metamask',
        address: '0x8f3a21c6b4e9d7a05f1c2b3d4e5f60718293a4b5',
        networks: ['ethereum', 'base'],
      },
    ],
  },
  {
    id: 'usr_bruno',
    name: 'Bruno Lima',
    username: 'bruno_lima',
    email: 'bruno@nft.dev',
    password: 'Senha@123',
    bio: 'Investidor em colecionáveis e mundos virtuais.',
    website: '',
    avatarUrl: null,
    favorites: ['nft_002'],
    wallets: [],
  },
]
