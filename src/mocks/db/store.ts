import { createSeedState, SCHEMA_VERSION } from './seed'
import type { DomainEvent, MockState } from './schema'

const STORAGE_KEY = 'nftm:mock:db'

type Listener = (event: DomainEvent) => void

class MockStore {
  private state: MockState | null = null
  private listeners = new Set<Listener>()
  private persistEnabled = true

  async init(options: { persist?: boolean } = {}): Promise<void> {
    this.persistEnabled = options.persist ?? true
    const stored = this.persistEnabled ? this.read() : null
    this.state = stored ?? (await createSeedState())
    this.save()
  }

  get data(): MockState {
    if (!this.state) {
      throw new Error('Mock store not initialized')
    }
    return this.state
  }

  save(): void {
    if (!this.persistEnabled || !this.state) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      this.state.quotes = this.state.quotes.slice(-20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    }
  }

  async reset(): Promise<void> {
    this.state = await createSeedState()
    this.save()
  }

  emit(event: DomainEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private read(): MockState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as MockState
      return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
    } catch {
      return null
    }
  }
}

export const store = new MockStore()
