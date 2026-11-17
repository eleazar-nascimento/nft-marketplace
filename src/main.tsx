import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppApiError } from '@/api/client'
import { router } from '@/router'
import { NotificationsProvider } from '@/state/notifications'
import { RealtimeProvider } from '@/state/realtime'
import { SessionProvider } from '@/state/session'
import '@/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (
          error instanceof AppApiError &&
          (error.status === 401 || error.status === 403 || error.status === 404 || error.status === 422)
        ) {
          return false
        }
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})

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

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          <SessionProvider>
            <RealtimeProvider>
              <RouterProvider router={router} />
            </RealtimeProvider>
          </SessionProvider>
        </NotificationsProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()
