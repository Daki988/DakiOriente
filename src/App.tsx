import { useEffect } from 'react'
import { HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import { BottomNav, CartFab, TopNav } from './components/Navigation'
import { Toasts } from './components/Toasts'
import { Splash } from './components/Splash'
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

function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    initNative(() => navigate(-1))
  }, [navigate])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

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
          <Route path="/commandes" element={<Orders />} />
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
    </>
  )
}

// Dans un environnement qui bloque les changements d'URL (page intégrée, aperçu),
// la navigation se fait en mémoire : build avec VITE_ROUTER=memory.
const Router = import.meta.env.VITE_ROUTER === 'memory' ? MemoryRouter : HashRouter

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Shell />
        <Splash />
      </Router>
    </AppProvider>
  )
}
