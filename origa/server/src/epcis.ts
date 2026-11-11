// Export EPCIS 2.0 (GS1) des événements de traçabilité. Module sans dépendance : il sert au serveur
// (GET /interop/epcis/events) et à l'application (export hors ligne, mode démonstration).
//
// Identifiants : en attendant l'attribution d'un préfixe d'entreprise GS1 au programme, les lots, fermes et
// opérateurs sont désignés par des URN privées (urn:origa:…), ce que la norme EPCIS 2.0 autorise. Elles seront
// remplacées par des LGTIN (lots) et des GLN (lieux) sans changer la structure des événements.

export interface EpcisLot {
  id: string; bandId: string; farmId: string; parentId?: string; count: number; weightKg?: number; operatorId?: string;
  cededAt: string; receivedAt?: string; receivedCount?: number; distributorCheckedAt?: string; distributorId?: string; derivedProduct?: string;
}
export interface EpcisMovement { id: string; lotId: string; date: string; from: string; to: string; by: string }

export interface EpcisEvent {
  type: 'ObjectEvent' | 'TransformationEvent';
  eventTime: string;
  eventTimeZoneOffset: string;
  [k: string]: unknown;
}
export interface EpcisDocument {
  '@context': unknown[];
  type: 'EPCISDocument';
  schemaVersion: '2.0';
  creationDate: string;
  epcisBody: { eventList: EpcisEvent[] };
}

const TZ = '+01:00'; // Libreville (UTC+1, sans heure d'été)
export const lotUrn = (id: string) => `urn:origa:lot:${id}`;
export const farmUrn = (id: string) => `urn:origa:farm:${id}`;
export const operatorUrn = (id: string) => `urn:origa:operator:${id}`;

/** Les dates métier sont des jours (AAAA-MM-JJ) : l'événement est daté à midi, heure de Libreville. */
function at(date: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00${TZ}` : new Date(date).toISOString();
}

export function buildEpcis(input: { lots: EpcisLot[]; movements?: EpcisMovement[]; now?: string }): EpcisDocument {
  const events: (EpcisEvent & { _o: number })[] = [];
  let order = 0;
  const push = (e: EpcisEvent) => events.push({ ...e, _o: order++ });
  const base = (date: string) => ({ eventTime: at(date), eventTimeZoneOffset: TZ });
  const qty = (id: string, n: number) => [{ epcClass: lotUrn(id), quantity: n }];
  const place = (urn: string) => ({ readPoint: { id: urn }, bizLocation: { id: urn } });

  for (const l of input.lots) {
    if (l.parentId) {
      // Transformation : un lot dérivé est produit à partir du lot reçu.
      const where = operatorUrn(l.operatorId ?? 'inconnu');
      push({
        type: 'TransformationEvent', ...base(l.cededAt), bizStep: 'commissioning', disposition: 'active', ...place(where),
        inputQuantityList: [{ epcClass: lotUrn(l.parentId) }], outputQuantityList: qty(l.id, l.count),
        ilmd: { 'origa:product': l.derivedProduct ?? '', 'origa:originFarm': l.farmId },
      });
      continue;
    }
    const farm = farmUrn(l.farmId);
    push({
      type: 'ObjectEvent', ...base(l.cededAt), action: 'ADD', bizStep: 'commissioning', disposition: 'active', ...place(farm), quantityList: qty(l.id, l.count),
      ilmd: { 'origa:bandId': l.bandId, 'origa:liveWeightKg': l.weightKg ?? 0, 'origa:countryOfOrigin': 'GA' },
    });
    push({
      type: 'ObjectEvent', ...base(l.cededAt), action: 'OBSERVE', bizStep: 'shipping', disposition: 'in_transit', ...place(farm), quantityList: qty(l.id, l.count),
      sourceList: [{ type: 'location', source: farm }],
      ...(l.operatorId ? { destinationList: [{ type: 'location', destination: operatorUrn(l.operatorId) }] } : {}),
    });
    for (const m of (input.movements ?? []).filter((x) => x.lotId === l.id)) {
      push({ type: 'ObjectEvent', ...base(m.date), action: 'OBSERVE', bizStep: 'transporting', disposition: 'in_transit', quantityList: qty(l.id, l.count), 'origa:from': m.from, 'origa:to': m.to, 'origa:carrier': m.by });
    }
    if (l.receivedAt && l.operatorId) {
      push({ type: 'ObjectEvent', ...base(l.receivedAt), action: 'OBSERVE', bizStep: 'receiving', disposition: 'in_progress', ...place(operatorUrn(l.operatorId)), quantityList: qty(l.id, l.receivedCount ?? l.count) });
    }
    if (l.distributorCheckedAt && l.distributorId) {
      push({ type: 'ObjectEvent', ...base(l.distributorCheckedAt), action: 'OBSERVE', bizStep: 'inspecting', disposition: 'conformant', ...place(operatorUrn(l.distributorId)), quantityList: qty(l.id, l.receivedCount ?? l.count) });
    }
  }
  events.sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime) || a._o - b._o);
  return {
    '@context': ['https://ref.gs1.org/standards/epcis/2.0.0/epcis-context.jsonld', { origa: 'https://origa.ga/ns/' }],
    type: 'EPCISDocument',
    schemaVersion: '2.0',
    creationDate: input.now ?? new Date().toISOString(),
    epcisBody: { eventList: events.map(({ _o, ...e }) => { void _o; return e as EpcisEvent; }) },
  };
}
