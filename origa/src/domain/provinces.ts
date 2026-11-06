import type { ProvinceCode } from './types';

/** Provinces du Gabon, codes ISO 3166-2:GA. */
export const PROVINCES: Record<ProvinceCode, { name: string; capital: string; bbox: [number, number, number, number] }> = {
  GA1: { name: 'Estuaire', capital: 'Libreville', bbox: [-0.6, 9.2, 1.1, 10.6] },
  GA2: { name: 'Haut-Ogooué', capital: 'Franceville', bbox: [-2.4, 12.6, -0.4, 14.6] },
  GA3: { name: 'Moyen-Ogooué', capital: 'Lambaréné', bbox: [-1.4, 9.8, 0.2, 11.4] },
  GA4: { name: 'Ngounié', capital: 'Mouila', bbox: [-2.6, 10.2, -0.9, 12.2] },
  GA5: { name: 'Nyanga', capital: 'Tchibanga', bbox: [-3.9, 10.2, -2.3, 11.8] },
  GA6: { name: 'Ogooué-Ivindo', capital: 'Makokou', bbox: [-0.8, 11.6, 2.3, 14.6] },
  GA7: { name: 'Ogooué-Lolo', capital: 'Koulamoutou', bbox: [-2.0, 11.6, -0.5, 13.3] },
  GA8: { name: 'Ogooué-Maritime', capital: 'Port-Gentil', bbox: [-3.0, 8.6, -0.5, 10.4] },
  GA9: { name: 'Woleu-Ntem', capital: 'Oyem', bbox: [0.5, 10.5, 2.4, 13.4] },
};

export const provinceName = (c: ProvinceCode) => PROVINCES[c]?.name ?? c;

/** Contrôle de cohérence GPS / province (§ 7.4) : boîte englobante avec une marge de 0,3°. */
export function gpsMatchesProvince(code: ProvinceCode, lat: number, lng: number): boolean {
  const [s, w, n, e] = PROVINCES[code].bbox;
  const m = 0.3;
  return lat >= s - m && lat <= n + m && lng >= w - m && lng <= e + m;
}
