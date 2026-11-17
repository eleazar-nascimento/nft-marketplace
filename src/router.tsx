import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, type ReactNode } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  availabilityFilters,
  networks,
  nftCategories,
  nftSorts,
  type AvailabilityFilter,
  type Network,
  type NftCategory,
  type NftSort,
} from '@/contracts'
import { readStoredSession, saveReturnTo } from '@/lib/storage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage, type HomeSearchState } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { NftDetailPage } from '@/pages/NftDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RegisterPage } from '@/pages/RegisterPage'
import { WalletsPage } from '@/pages/WalletsPage'
import { useSession } from '@/state/session'

function requireAuthBeforeLoad({ location }: { location: { href: string } }) {
  const stored = readStoredSession()
  if (!stored) {
    saveReturnTo(location.href)
    throw redirect({ to: '/login' })
  }
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const navigate = useNavigate()
  const routerState = useRouterState()

  useEffect(() => {
    if (status === 'anonymous') {
      saveReturnTo(`${routerState.location.pathname}${routerState.location.searchStr}`)
      void navigate({ to: '/login' })
    }
  }, [status, navigate, routerState.location.pathname, routerState.location.searchStr])

  if (status === 'anonymous') {
    return null
  }

  return <>{children}</>
}

function parseHomeSearch(raw: Record<string, unknown>): HomeSearchState {
  const q = typeof raw.q === 'string' && raw.q.trim() ? raw.q.trim() : undefined

  const rawCategory = Array.isArray(raw.category)
    ? raw.category.map(String)
    : typeof raw.category === 'string'
      ? raw.category.split(',')
      : []
  const category = rawCategory
    .map((item) => item.trim())
    .filter((item): item is NftCategory => (nftCategories as readonly string[]).includes(item))

  const network =
    typeof raw.network === 'string' && (networks as readonly string[]).includes(raw.network)
      ? (raw.network as Network)
      : undefined

  const minPrice =
    typeof raw.minPrice === 'string' && /^\d+(\.\d+)?$/.test(raw.minPrice.trim())
      ? raw.minPrice.trim()
      : typeof raw.minPrice === 'number' && raw.minPrice >= 0
        ? String(raw.minPrice)
        : undefined

  const maxPrice =
    typeof raw.maxPrice === 'string' && /^\d+(\.\d+)?$/.test(raw.maxPrice.trim())
      ? raw.maxPrice.trim()
      : typeof raw.maxPrice === 'number' && raw.maxPrice >= 0
        ? String(raw.maxPrice)
        : undefined

  const availability =
    typeof raw.availability === 'string' &&
    (availabilityFilters as readonly string[]).includes(raw.availability) &&
    raw.availability !== 'all'
      ? (raw.availability as AvailabilityFilter)
      : undefined

  const sort =
    typeof raw.sort === 'string' && (nftSorts as readonly string[]).includes(raw.sort)
      ? (raw.sort as NftSort)
      : undefined

  const rawPage = typeof raw.page === 'number' ? raw.page : Number(raw.page)
  const page = Number.isInteger(rawPage) && rawPage > 1 ? rawPage : undefined

  const result: HomeSearchState = {}
  if (q) result.q = q
  if (category.length > 0) result.category = category
  if (network) result.network = network
  if (minPrice) result.minPrice = minPrice
  if (maxPrice) result.maxPrice = maxPrice
  if (availability) result.availability = availability
  if (sort && sort !== 'recent') result.sort = sort
  if (page) result.page = page

  return result
}

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: parseHomeSearch,
  component: function IndexRouteComponent() {
    const search = indexRoute.useSearch()
    const navigate = useNavigate({ from: indexRoute.fullPath })

    const handleUpdateSearch = (next: Partial<HomeSearchState>, resetPage = false) => {
      void navigate({
        search: (prev) => {
          const merged: HomeSearchState = {
            ...prev,
            ...next,
          }
          if (resetPage) {
            delete merged.page
          } else if (merged.page && merged.page <= 1) {
            delete merged.page
          }
          return parseHomeSearch(merged as Record<string, unknown>)
        },
      })
    }

    const handleResetFilters = () => {
      void navigate({
        search: {},
      })
    }

    return (
      <HomePage
        key={`${search.q ?? ''}|${search.minPrice ?? ''}|${search.maxPrice ?? ''}`}
        search={search}
        onUpdateSearch={handleUpdateSearch}
        onResetFilters={handleResetFilters}
      />
    )
  },
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: function NftDetailRouteComponent() {
    const { nftId } = nftDetailRoute.useParams()
    return <NftDetailPage nftId={nftId} />
  },
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: () => <LoginPage />,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  beforeLoad: requireAuthBeforeLoad,
  component: () => (
    <ProtectedRoute>
      <CheckoutPage />
    </ProtectedRoute>
  ),
})

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders/$orderId/confirmation',
  beforeLoad: requireAuthBeforeLoad,
  component: function OrderConfirmationRouteComponent() {
    const { orderId } = orderConfirmationRoute.useParams()
    return (
      <ProtectedRoute>
        <OrderConfirmationPage orderId={orderId} />
      </ProtectedRoute>
    )
  },
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: requireAuthBeforeLoad,
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: requireAuthBeforeLoad,
  component: () => (
    <ProtectedRoute>
      <WalletsPage />
    </ProtectedRoute>
  ),
})

const catchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFoundPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftDetailRoute,
  cartRoute,
  loginRoute,
  registerRoute,
  checkoutRoute,
  orderConfirmationRoute,
  profileRoute,
  walletsRoute,
  catchAllRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
