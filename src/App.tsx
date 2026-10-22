import { useEffect } from 'react'
import { createHashRouter, createMemoryRouter, Navigate, Route, RouterProvider, Routes, useLocation, useNavigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppProvider } from './store/AppContext'
import { AuthProvider } from './live/auth'
import { LIVE } from './live/supabase'
import { LiveOrders, LiveTracking } from './live/ClientOrders'
import { BottomNav, CartFab, TopNav } from './components/Navigation'
import { Toasts } from './components/Toasts'
import { Splash } from './components/Splash'
import { LeaveGuard } from './components/LeaveGuard'
import { initNative } from './lib/native'
import Home from './pages/Home'
import ServiceApp from './pages/service'
import AllServices from './pages/AllServices'
import { Cart, Checkout } from './pages/Cart'
import { OrderDetail, Orders } from './pages/Orders'
import Scanner from './pages/Scanner'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Search from './pages/Search'

// Espaces professionnels chargés à la demande (le client ne télécharge pas leur code)
const MerchantApp = lazy(() => import('./apps/MerchantApp'))
const CourierApp = lazy(() => import('./apps/CourierApp'))
const AdminApp = lazy(() => import('./apps/AdminApp'))

/** Variante de build : client (défaut), merchant, courier ou admin (VITE_APP). */
const FLAVOR = (import.meta.env.VITE_APP as string | undefined) ?? 'client'
const STAFF_ROOT: Record<string, string> = { merchant: '/marchand', courier: '/livreur', admin: '/admin' }
const isStaffPath = (p: string) => /^\/(marchand|livreur|admin)(\/|$)/.test(p)

function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    initNative(() => navigate(-1))
  }, [navigate])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  const staffRoutes = (
    <>
      <Route path="/marchand/*" element={<MerchantApp />} />
      <Route path="/livreur/*" element={<CourierApp />} />
      <Route path="/admin/*" element={<AdminApp />} />
    </>
  )

  // Application professionnelle seule (APK marchand / livreur, site admin)
  if (FLAVOR !== 'client')
    return (
      <>
        <Suspense fallback={null}>
          <Routes>
            {staffRoutes}
            <Route path="*" element={<Navigate to={STAFF_ROOT[FLAVOR] ?? '/admin'} replace />} />
          </Routes>
        </Suspense>
        <Toasts />
      </>
    )

  if (isStaffPath(pathname))
    return (
      <>
        <Suspense fallback={null}>
          <Routes>{staffRoutes}</Routes>
        </Suspense>
        <Toasts />
      </>
    )

  return (
    <>
      <TopNav />
      <main key={pathname.split('/').slice(1, 3).join('/')}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<AllServices />} />
          <Route path="/service/:id/*" element={<ServiceApp />} />
          <Route path="/recherche" element={<Search />} />
          <Route path="/panier" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/commandes" element={LIVE ? <LiveOrders /> : <Orders />} />
          <Route path="/suivi/:id" element={<LiveTracking />} />
          <Route path="/commandes/:id" element={<OrderDetail />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <CartFab />
      <BottomNav />
      <Toasts />
      <LeaveGuard />
      <Splash />
    </>
  )
}

// Routeur « data » (nécessaire pour confirmer la sortie d'un service).
// Dans un environnement qui bloque les changements d'URL (page intégrée, aperçu),
// la navigation se fait en mémoire : build avec VITE_ROUTER=memory.
const createRouter = import.meta.env.VITE_ROUTER === 'memory' ? createMemoryRouter : createHashRouter
const router = createRouter([{ path: '*', element: <Shell /> }])

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppProvider>
  )
}
