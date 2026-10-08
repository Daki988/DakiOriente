import { Link } from 'react-router-dom'
import { PRODUCT_MAP } from '../data/products'
import { useApp } from '../store/AppContext'
import { PageHeader } from '../components/PageHeader'
import { PageShell } from '../components/Navigation'
import { ProductCard } from '../components/ProductCard'

export default function Favorites() {
  const { favorites } = useApp()
  const items = favorites.map((id) => PRODUCT_MAP[id]).filter(Boolean)
  return (
    <PageShell>
      <PageHeader title="Mes favoris" subtitle={`${items.length} article${items.length > 1 ? 's' : ''}`} />
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-2 sm:grid-cols-3">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 py-20 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-red-50 text-5xl">❤️</div>
          <p className="mt-4 font-semibold">Aucun favori pour l’instant</p>
          <p className="mt-1 text-sm text-neutral-500">Touchez le cœur d’un produit pour le retrouver ici.</p>
          <Link to="/" className="mt-6 rounded-full bg-neam-600 px-6 py-3 text-sm font-semibold text-white">Découvrir les services</Link>
        </div>
      )}
    </PageShell>
  )
}
