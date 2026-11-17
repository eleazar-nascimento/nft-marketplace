import '@/styles/globals.css'

async function bootstrap() {
  const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'
  if (mocksEnabled) {
    const { startMockRuntime } = await import('@/mocks/browser')
    await startMockRuntime()
  }

  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Root element not found')
  }

  const { mountApp } = await import('@/App')
  mountApp(root)
}

void bootstrap()
