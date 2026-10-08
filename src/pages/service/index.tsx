import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { SERVICE_MAP, type ServiceId } from '../../data/services'
import { Orders } from '../Orders'
import { ServiceLayout, ServiceNav } from './ServiceLayout'
import { CategoriesPage, CategoryPage, PromosPage, RestaurantPage, RestaurantsPage, ServiceFavorites, ShopHome } from './ShopPages'
import { ExpressHome, ExpressPricing, ExpressTracking } from './ExpressPages'
import { TremplinCompanies, TremplinCV, TremplinFormations, TremplinHome, TremplinOffers } from './TremplinPages'
import { GuruCandidate, GuruCandidates, GuruDashboard, GuruHome, GuruNewJob, GuruRecruitment } from './GuruToolsPages'
import { LegalHome } from './LegalHome'

/** Chaque service NEAM est une « mini-app » avec ses propres pages et sa navigation. */
export default function ServiceApp() {
  const { id } = useParams()
  const service = SERVICE_MAP[id as ServiceId]
  if (!service) return <Navigate to="/services" replace />
  const s = service

  const shop = (
    <>
      <Route path="categories" element={<CategoriesPage service={s} />} />
      <Route path="c/:cat" element={<CategoryPage service={s} />} />
      <Route path="promos" element={<PromosPage service={s} />} />
      <Route path="commandes" element={<Orders serviceId={s.id} />} />
      <Route path="favoris" element={<ServiceFavorites service={s} />} />
    </>
  )

  return (
    <ServiceLayout service={s}>
      <ServiceNav service={s} />
      <Routes>
        {s.kind === 'shop' && (
          <>
            <Route index element={<ShopHome service={s} />} />
            {shop}
            <Route path="restaurants" element={<RestaurantsPage service={s} />} />
            <Route path="r/:name" element={<RestaurantPage service={s} />} />
          </>
        )}
        {s.kind === 'legal' && (
          <>
            <Route index element={<LegalHome service={s} />} />
            {shop}
          </>
        )}
        {s.kind === 'express' && (
          <>
            <Route index element={<ExpressHome service={s} />} />
            <Route path="suivi" element={<ExpressTracking service={s} />} />
            <Route path="tarifs" element={<ExpressPricing service={s} />} />
            <Route path="commandes" element={<Orders serviceId={s.id} />} />
          </>
        )}
        {s.kind === 'tremplin' && (
          <>
            <Route index element={<TremplinHome service={s} />} />
            <Route path="offres" element={<TremplinOffers service={s} />} />
            <Route path="cv" element={<TremplinCV service={s} />} />
            <Route path="formations" element={<TremplinFormations service={s} />} />
            <Route path="entreprises" element={<TremplinCompanies service={s} />} />
          </>
        )}
        {s.kind === 'gurutools' && (
          <>
            <Route index element={<GuruHome service={s} />} />
            <Route path="tableau" element={<GuruDashboard service={s} />} />
            <Route path="annonce" element={<GuruNewJob service={s} />} />
            <Route path="candidats" element={<GuruCandidates service={s} />} />
            <Route path="r/:rid" element={<GuruRecruitment service={s} />} />
            <Route path="candidat/:cid" element={<GuruCandidate service={s} />} />
          </>
        )}
        <Route path="*" element={<Navigate to={`/service/${s.id}`} replace />} />
      </Routes>
    </ServiceLayout>
  )
}
