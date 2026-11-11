// Export EPCIS 2.0 (GS1) : le module est partagé avec le serveur national, pour produire exactement le même document
// en ligne (GET /interop/epcis/events) et hors ligne.
export { buildEpcis, lotUrn, farmUrn, operatorUrn } from '../../server/src/epcis';
export type { EpcisDocument, EpcisEvent } from '../../server/src/epcis';
