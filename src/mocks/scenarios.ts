import type { ErrorCode } from '@/contracts'
import { createPrng } from './lib/random'

export type LatencyMode = 'none' | 'realistic' | 'slow' | 'variable' | 'out-of-order'

export interface FailureRule {
  route: string
  mode: 'http' | 'network' | 'timeout'
  status?: number
  code?: ErrorCode
  times: number
}

export interface ScenarioConfig {
  preset: ScenarioPreset
  seed: number
  latency: LatencyMode
  offline: boolean
  emptyCatalog: boolean
  failures: FailureRule[]
  paymentOutcome: 'confirm' | 'decline'
  paymentDelayMs: number
  walletConnect: 'approve' | 'reject'
  orderTimeoutOnce: boolean
  checkoutMutation: 'none' | 'price' | 'sold_out'
  checkoutMutationDelayMs: number
  sessionTtlMs: number
}

export const scenarioPresets = [
  'default',
  'fast',
  'slow',
  'variable-latency',
  'out-of-order',
  'empty-catalog',
  'offline',
  'server-error',
  'session-expiring',
  'favorite-failure',
  'wallet-rejected',
  'price-change-checkout',
  'sold-out-checkout',
  'order-timeout',
  'payment-declined',
] as const

export type ScenarioPreset = (typeof scenarioPresets)[number]

export const scenarioDescriptions: Record<ScenarioPreset, string> = {
  default: 'Latência realista e todas as operações com sucesso.',
  fast: 'Sem latência artificial. Usado nos testes automatizados.',
  slow: 'Todas as respostas levam cerca de 2,2 s para evidenciar skeletons.',
  'variable-latency': 'Latência aleatória determinística entre 150 ms e 2 s.',
  'out-of-order': 'Buscas do catálogo retornam fora de ordem (a primeira é a mais lenta).',
  'empty-catalog': 'O catálogo responde sem resultados.',
  offline: 'Todas as requisições falham por indisponibilidade de conexão.',
  'server-error': 'As duas primeiras listagens do catálogo respondem 503.',
  'session-expiring': 'Sessões expiram 45 s após o login.',
  'favorite-failure': 'A próxima inclusão ou remoção de favorito responde 500.',
  'wallet-rejected': 'A conexão da carteira é recusada pelo usuário.',
  'price-change-checkout': 'O preço do primeiro item do carrinho sobe durante o checkout.',
  'sold-out-checkout': 'A edição do primeiro item do carrinho esgota durante o checkout.',
  'order-timeout': 'O primeiro envio do pedido é criado, mas a resposta excede o tempo limite.',
  'payment-declined': 'O pagamento é recusado após o processamento.',
}

const baseConfig: Omit<ScenarioConfig, 'preset'> = {
  seed: 42,
  latency: 'realistic',
  offline: false,
  emptyCatalog: false,
  failures: [],
  paymentOutcome: 'confirm',
  paymentDelayMs: 2500,
  walletConnect: 'approve',
  orderTimeoutOnce: false,
  checkoutMutation: 'none',
  checkoutMutationDelayMs: 2500,
  sessionTtlMs: 30 * 60 * 1000,
}

export function presetConfig(preset: ScenarioPreset): ScenarioConfig {
  const config: ScenarioConfig = { ...baseConfig, failures: [], preset }
  switch (preset) {
    case 'fast':
      return { ...config, latency: 'none', paymentDelayMs: 1500 }
    case 'slow':
      return { ...config, latency: 'slow' }
    case 'variable-latency':
      return { ...config, latency: 'variable' }
    case 'out-of-order':
      return { ...config, latency: 'out-of-order' }
    case 'empty-catalog':
      return { ...config, emptyCatalog: true }
    case 'offline':
      return { ...config, offline: true }
    case 'server-error':
      return { ...config, failures: [{ route: 'GET /nfts', mode: 'http', status: 503, times: 2 }] }
    case 'session-expiring':
      return { ...config, sessionTtlMs: 45 * 1000 }
    case 'favorite-failure':
      return {
        ...config,
        failures: [
          { route: 'POST /favorites', mode: 'http', status: 500, times: 1 },
          { route: 'DELETE /favorites/:nftId', mode: 'http', status: 500, times: 1 },
        ],
      }
    case 'wallet-rejected':
      return { ...config, walletConnect: 'reject' }
    case 'price-change-checkout':
      return { ...config, checkoutMutation: 'price' }
    case 'sold-out-checkout':
      return { ...config, checkoutMutation: 'sold_out' }
    case 'order-timeout':
      return { ...config, orderTimeoutOnce: true }
    case 'payment-declined':
      return { ...config, paymentOutcome: 'decline' }
    default:
      return config
  }
}

const STORAGE_KEY = 'nftm:mock:scenario'

class ScenarioController {
  private config: ScenarioConfig = presetConfig('default')
  private random = createPrng(this.config.seed)
  private counters = new Map<string, number>()

  init(initialPreset?: string | null): void {
    const fromUrl = initialPreset && isPreset(initialPreset) ? presetConfig(initialPreset) : null
    this.config = fromUrl ?? this.read() ?? presetConfig('default')
    this.random = createPrng(this.config.seed)
    this.save()
  }

  get current(): ScenarioConfig {
    return this.config
  }

  set(next: ScenarioPreset | Partial<ScenarioConfig>): ScenarioConfig {
    this.config = typeof next === 'string' ? presetConfig(next) : { ...this.config, ...next }
    this.random = createPrng(this.config.seed)
    this.counters.clear()
    this.save()
    return this.config
  }

  latencyFor(route: string): number {
    const count = (this.counters.get(route) ?? 0) + 1
    this.counters.set(route, count)
    switch (this.config.latency) {
      case 'none':
        return 0
      case 'slow':
        return 2200
      case 'variable':
        return Math.round(150 + this.random() * 1850)
      case 'out-of-order':
        if (route === 'GET /nfts') return count % 2 === 1 ? 1800 : 250
        return Math.round(120 + this.random() * 280)
      default:
        return Math.round(120 + this.random() * 280)
    }
  }

  consumeFailure(route: string): FailureRule | null {
    const rule = this.config.failures.find((candidate) => candidate.route === route && candidate.times !== 0)
    if (!rule) return null
    if (rule.times > 0) {
      rule.times -= 1
      this.save()
    }
    return rule
  }

  consumeOrderTimeout(): boolean {
    if (!this.config.orderTimeoutOnce) return false
    this.config.orderTimeoutOnce = false
    this.save()
    return true
  }

  consumeCheckoutMutation(): ScenarioConfig['checkoutMutation'] {
    const mutation = this.config.checkoutMutation
    if (mutation !== 'none') {
      this.config.checkoutMutation = 'none'
      this.save()
    }
    return mutation
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch {
      return
    }
  }

  private read(): ScenarioConfig | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as ScenarioConfig
      return isPreset(parsed.preset) ? { ...presetConfig(parsed.preset), ...parsed } : null
    } catch {
      return null
    }
  }
}

export function isPreset(value: string): value is ScenarioPreset {
  return (scenarioPresets as readonly string[]).includes(value)
}

export const scenario = new ScenarioController()
