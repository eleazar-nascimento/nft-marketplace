import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppApiError } from '@/api/client'
import { router } from '@/router'
import { NotificationsProvider } from '@/state/notifications'
import { RealtimeProvider } from '@/state/realtime'
import { SessionProvider } from '@/state/session'

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

export function mountApp(root: HTMLElement) {
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
