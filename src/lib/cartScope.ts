import type { ServiceId } from '../data/services'

/**
 * Règle NEAM : un panier appartient à un seul service.
 * Ces pages font partie du « parcours » du service et ne vident pas le panier.
 */
const SHARED_PAGES = ['/panier', '/checkout', '/notifications', '/scanner']

export const isInsideService = (pathname: string, serviceId: ServiceId) =>
  pathname === `/service/${serviceId}` ||
  pathname.startsWith(`/service/${serviceId}/`) ||
  SHARED_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/** À passer dans `navigate(to, { state: SKIP_GUARD })` quand la sortie est voulue (ex. commande validée). */
export const SKIP_GUARD = { skipLeaveGuard: true }
