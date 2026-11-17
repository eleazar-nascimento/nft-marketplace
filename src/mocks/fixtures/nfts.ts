import type { Network, NftCategory, NftImage } from '@/contracts'
import { creatorFixtures } from './creators'
import { createPrng } from '../lib/random'

export interface NftEditionFixture {
  id: string
  name: string
  priceEth: string
  supply: number
  available: number
  maxPerOrder: number
  disabled: boolean
}

export interface NftFixture {
  id: string
  name: string
  description: string
  collection: string
  creatorId: string
  category: NftCategory
  network: Network
  tags: string[]
  imageIndexes: number[]
  editions: NftEditionFixture[]
  likes: number
  createdAt: string
  featured: boolean
  contractAddress: string
  tokenStandard: 'ERC-721' | 'ERC-1155'
}

export const NFT_IMAGE_COUNT = 16

export function nftImage(index: number, name: string, position = 0): NftImage {
  const number = String((index % NFT_IMAGE_COUNT) + 1).padStart(2, '0')
  return {
    url: `/images/nfts/nft-${number}.svg`,
    alt: position === 0 ? `Arte do NFT ${name}` : `Arte do NFT ${name}, imagem ${position + 1}`,
    width: 600,
    height: 600,
  }
}

const baseNfts: Array<[string, NftCategory, string]> = [
  ['Distant Galaxy', 'art', 'Space Odyssey'],
  ['Life On Edena', 'virtual-worlds', 'Edena'],
  ['AstroFiction', 'art', 'Space Odyssey'],
  ['CryptoCity', 'virtual-worlds', 'Metro'],
  ['Colorful Dog', 'collectibles', 'Dog Park'],
  ['Mushroom King', 'collectibles', 'Shroomverse'],
  ['Magic Mushroom 0325', 'art', 'Shroomverse'],
  ['Happy Robot 032', 'collectibles', 'Robot Factory'],
  ['Happy Robot 024', 'collectibles', 'Robot Factory'],
  ['Designer Bear', 'art', 'Bear Club'],
  ['Dancing Robot 0312', 'video', 'Robot Factory'],
  ['Cherry Blossom', 'photography', 'Seasons'],
  ['Neon Skyline', 'photography', 'Night Cities'],
  ['Midnight Groove', 'music', 'Synthwave Sessions'],
  ['Lo-Fi Rain', 'music', 'Synthwave Sessions'],
  ['Pixel Knight', 'collectibles', 'Pixel Realm'],
  ['Golden Ticket', 'utility', 'Access Pass'],
  ['Arena Champion', 'sport', 'Legends League'],
  ['Final Whistle', 'sport', 'Legends League'],
  ['Orbit Station', 'virtual-worlds', 'Edena'],
  ['Desert Mirage', 'photography', 'Seasons'],
  ['Chromatic Waves', 'art', 'Fluid Forms'],
  ['Liquid Dreams', 'art', 'Fluid Forms'],
  ['Retro Arcade', 'video', 'Pixel Realm'],
  ['Moon Walker', 'art', 'Space Odyssey'],
  ['Cyber Samurai', 'collectibles', 'Metro'],
  ['Forest Spirit', 'art', 'Shroomverse'],
  ['Bass Drop', 'music', 'Synthwave Sessions'],
  ['VIP Backstage', 'utility', 'Access Pass'],
  ['Skate Legend', 'sport', 'Legends League'],
  ['Ocean Whisper', 'photography', 'Blue Planet'],
  ['Deep Sea Jelly', 'photography', 'Blue Planet'],
  ['Robo Pup', 'collectibles', 'Dog Park'],
  ['Galactic Cat', 'collectibles', 'Space Odyssey'],
  ['Time Capsule', 'utility', 'Access Pass'],
  ['Virtual Loft', 'virtual-worlds', 'Metro'],
  ['Aurora Loop', 'video', 'Fluid Forms'],
  ['Glitch Portrait', 'art', 'Night Cities'],
  ['Prism Heart', 'art', 'Fluid Forms'],
  ['Synth Rider', 'music', 'Synthwave Sessions'],
  ['Goal Rush', 'sport', 'Legends League'],
  ['Crystal Garden', 'virtual-worlds', 'Edena'],
  ['Paper Crane', 'art', 'Seasons'],
  ['Hologram Bear', 'collectibles', 'Bear Club'],
  ['Starlight Ballet', 'video', 'Night Cities'],
]

const networks: Network[] = ['ethereum', 'polygon', 'base']
const editionNames = ['Standard', 'Rare', 'Legendary']
const descriptions = [
  'Uma obra que explora cores vibrantes e formas orgânicas, criada para colecionadores que buscam peças únicas.',
  'Parte de uma série limitada com cunhagem verificada na blockchain e direitos de exibição para o colecionador.',
  'Edição digital inspirada em paisagens imaginárias, com detalhes que se revelam a cada nova observação.',
  'Uma peça colecionável com atributos raros, desenvolvida por um artista reconhecido pela comunidade.',
]

function toPrice(value: number): string {
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

function buildFixtures(): NftFixture[] {
  const random = createPrng(20261117)
  const baseDate = Date.UTC(2026, 9, 31, 12, 0, 0)

  return baseNfts.map(([name, category, collection], index) => {
    const id = `nft_${String(index + 1).padStart(3, '0')}`
    const creator = creatorFixtures[index % creatorFixtures.length]!
    const editionCount = index % 5 === 0 ? 1 : index % 3 === 0 ? 3 : 2
    const basePrice = 0.05 + Math.round(random() * 400) / 100
    const editions: NftEditionFixture[] = Array.from({ length: editionCount }, (_, editionIndex) => {
      const supply = editionIndex === 0 ? 20 + Math.floor(random() * 30) : editionIndex === 1 ? 8 : 2
      const isSoldOut = (index === 8 && editionIndex === 0) || (index === 2 && editionIndex === editionCount - 1)
      const available = isSoldOut ? 0 : Math.max(1, Math.floor(supply * (0.3 + random() * 0.7)))
      return {
        id: `${id}_ed${editionIndex + 1}`,
        name: editionNames[editionIndex]!,
        priceEth: toPrice(basePrice * (1 + editionIndex * 0.85)),
        supply,
        available,
        maxPerOrder: editionIndex === 0 ? 5 : editionIndex === 1 ? 3 : 1,
        disabled: index === 5 && editionIndex === 1,
      }
    })

    if (index === 12) {
      editions.forEach((edition) => {
        edition.available = 0
      })
    }

    return {
      id,
      name,
      description: descriptions[index % descriptions.length]!,
      collection,
      creatorId: creator.id,
      category,
      network: networks[index % networks.length]!,
      tags: [category, collection.toLowerCase().replace(/\s+/g, '-')],
      imageIndexes: [index, index + 5, index + 11],
      editions,
      likes: Math.floor(random() * 900) + 10,
      createdAt: new Date(baseDate - index * 36 * 60 * 60 * 1000).toISOString(),
      featured: index < 3,
      contractAddress: `0x${(0xabc000 + index).toString(16).padStart(40, '0')}`,
      tokenStandard: editionCount > 1 ? 'ERC-1155' : 'ERC-721',
    }
  })
}

export const nftFixtures: NftFixture[] = buildFixtures()
