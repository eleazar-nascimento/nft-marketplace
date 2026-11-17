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

const figmaImages = [
  '/images/figma/8f387.jpg',
  '/images/figma/83794.jpg',
  '/images/figma/9add2.jpg',
  '/images/figma/b7cfc.jpg',
]

export const NFT_IMAGE_COUNT = figmaImages.length

export function nftImage(index: number, name: string, position = 0): NftImage {
  const url = figmaImages[index % figmaImages.length]!
  return {
    url,
    alt: position === 0 ? `Arte do NFT ${name}` : `Arte do NFT ${name}, imagem ${position + 1}`,
    width: 600,
    height: 600,
  }
}

const baseNfts: Array<[string, NftCategory, string, number, string]> = [
  ['Emerald Ape #042', 'art', 'Kurio Apes', 0, '1.19'],
  ['Sage Nomad #009', 'art', 'Kurio Apes', 1, '1.69'],
  ['Neon Vessel #552', 'art', 'Kurio Apes', 2, '1.99'],
  ['Cosmic Bloom #118', 'photography', 'Kurio Editions', 1, '1.29'],
  ['Violet Nomad #314', 'collectibles', 'Kurio Apes', 1, '1.39'],
  ['Ivory Baron #088', 'collectibles', 'Kurio Apes', 2, '1.79'],
  ['Golden Beat #207', 'music', 'Kurio Beats', 3, '0.99'],
  ['Amber Pulse #104', 'music', 'Kurio Beats', 3, '0.79'],
  ['Golden Signal #160', 'utility', 'Kurio Signals', 3, '0.39'],
  ['Emerald Ape #077', 'art', 'Kurio Apes', 0, '1.49'],
  ['Sage Nomad #021', 'video', 'Kurio 3D', 1, '1.89'],
  ['Neon Vessel #610', 'photography', 'Kurio Editions', 2, '2.19'],
  ['Cosmic Bloom #204', 'photography', 'Kurio Editions', 1, '1.59'],
  ['Violet Nomad #412', 'music', 'Kurio Beats', 1, '1.15'],
  ['Ivory Baron #109', 'music', 'Kurio Beats', 2, '1.45'],
  ['Golden Beat #311', 'collectibles', 'Kurio Apes', 3, '0.89'],
  ['Emerald Pass #012', 'utility', 'Kurio Access', 0, '2.49'],
  ['Nomad Arena #055', 'sport', 'Kurio Games', 1, '1.25'],
  ['Baron Trophy #019', 'sport', 'Kurio Games', 2, '1.65'],
  ['Genesis Sphere #003', 'virtual-worlds', 'Kurio Genesis', 3, '2.09'],
  ['Desert Ape #144', 'photography', 'Kurio Editions', 0, '1.12'],
  ['Chromatic Ape #220', 'art', 'Kurio Apes', 1, '1.34'],
  ['Liquid Vessel #308', 'art', 'Kurio Editions', 2, '1.74'],
  ['Retro Signal #409', 'video', 'Kurio 3D', 3, '0.94'],
  ['Moon Baron #512', 'art', 'Kurio Apes', 0, '1.54'],
  ['Cyber Nomad #601', 'collectibles', 'Kurio Apes', 1, '1.84'],
  ['Forest Ape #702', 'art', 'Kurio Apes', 2, '1.22'],
  ['Bass Ape #803', 'music', 'Kurio Beats', 3, '0.69'],
  ['Kurio Key #901', 'utility', 'Kurio Access', 0, '2.99'],
  ['Apex Nomad #115', 'sport', 'Kurio Games', 1, '1.42'],
  ['Ocean Vessel #216', 'photography', 'Kurio Editions', 2, '1.18'],
  ['Deep Signal #317', 'photography', 'Kurio Signals', 3, '0.88'],
  ['Emerald Cub #418', 'collectibles', 'Kurio Apes', 0, '1.08'],
  ['Galactic Ape #519', 'collectibles', 'Kurio Apes', 1, '1.62'],
  ['Time Capsule #620', 'utility', 'Kurio Access', 2, '1.92'],
  ['Virtual Baron #721', 'virtual-worlds', 'Kurio Genesis', 3, '1.38'],
  ['Aurora Ape #822', 'video', 'Kurio 3D', 0, '1.48'],
  ['Glitch Nomad #923', 'art', 'Kurio Editions', 1, '1.28'],
  ['Prism Baron #134', 'art', 'Kurio Apes', 2, '1.78'],
  ['Synth Signal #235', 'music', 'Kurio Beats', 3, '0.59'],
  ['Goal Nomad #336', 'sport', 'Kurio Games', 0, '1.19'],
  ['Crystal Ape #437', 'virtual-worlds', 'Kurio Genesis', 1, '1.69'],
  ['Paper Baron #538', 'art', 'Kurio Editions', 2, '1.39'],
  ['Hologram Ape #639', 'collectibles', 'Kurio Apes', 3, '1.89'],
  ['Starlight Signal #740', 'video', 'Kurio 3D', 0, '1.09'],
]

const networks: Network[] = ['ethereum', 'polygon', 'base']
const editionNames = ['1/50', '1/10', '1/1', 'ABERTA']
const descriptions = [
  'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
  'Obra digital numerada da coleção Kurio Apes com atributos verificados nos metadados do token e registro permanente de procedência na rede.',
  'Edição limitada selecionada pelos curadores da Kurio, acompanhada de arquivo em alta resolução e acesso antecipado a futuros lançamentos.',
  'Ativo digital raro cunhado com contrato inteligente ERC-721 verificado e direitos autorais automáticos para o criador nas vendas secundárias.',
]

function toPrice(value: number): string {
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
}

function buildFixtures(): NftFixture[] {
  const random = createPrng(20261117)
  const baseDate = Date.UTC(2026, 9, 31, 12, 0, 0)

  return baseNfts.map(([name, category, collection, imgIdx, fixedPrice], index) => {
    const id = `nft_${String(index + 1).padStart(3, '0')}`
    const creator = creatorFixtures[index % creatorFixtures.length]!
    const editionCount = index === 5 ? 2 : index === 0 ? 4 : index % 3 === 0 ? 3 : 2
    const basePrice = Number(fixedPrice)
    const editions: NftEditionFixture[] = Array.from({ length: editionCount }, (_, editionIndex) => {
      const supply = editionIndex === 0 ? 50 : editionIndex === 1 ? 10 : editionIndex === 2 ? 1 : 100
      const isSoldOut = (index === 8 && editionIndex === 0) || (index === 2 && editionIndex === editionCount - 1)
      const available = isSoldOut ? 0 : Math.max(1, Math.floor(supply * (0.4 + random() * 0.5)))
      const multiplier = editionIndex === 0 ? 1 : editionIndex === 1 ? 1.35 : editionIndex === 2 ? 1.85 : 1
      return {
        id: `${id}_ed${editionIndex + 1}`,
        name: editionNames[editionIndex]!,
        priceEth: editionIndex === 0 ? fixedPrice : toPrice(basePrice * multiplier),
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
      network: index === 0 ? 'ethereum' : networks[index % networks.length]!,
      tags: ['Óculos', 'Esmeralda', 'Raro', category, collection.toLowerCase().replace(/\s+/g, '-'), 'galaxy'],
      imageIndexes: [imgIdx, (imgIdx + 1) % 4, (imgIdx + 2) % 4, (imgIdx + 3) % 4],
      editions,
      likes: index === 0 ? 19 : Math.floor(random() * 120) + 12,
      createdAt: new Date(baseDate - index * 36 * 60 * 60 * 1000).toISOString(),
      featured: index < 3,
      contractAddress: '0x7A42b91F3c82E1045D9a8B7C6e5f4A3B2c1D19E8',
      tokenStandard: 'ERC-721',
    }
  })
}

export const nftFixtures: NftFixture[] = buildFixtures()
