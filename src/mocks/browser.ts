import { setupWorker } from 'msw/browser'
import { store } from './db/store'
import { settleDueOrders } from './domain/orders'
import { restHandlers } from './handlers'
import { scenario } from './scenarios'
import { wsHandlers } from './ws'

export const handlers = [...restHandlers, ...wsHandlers]

let started = false

export async function startMockRuntime(): Promise<void> {
  if (started) return
  started = true

  const params = new URLSearchParams(window.location.search)
  await store.init({ persist: true })
  scenario.init(params.get('__scenario'))
  settleDueOrders()

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}
