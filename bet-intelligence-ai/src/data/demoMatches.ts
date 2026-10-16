/**
 * JEU DE DONNÉES DE DÉMONSTRATION — entièrement fictif.
 * Les compétitions, équipes et rencontres ci-dessous n'existent pas.
 * Les dates sont calculées relativement au jour d'ouverture de l'application
 * afin que la démonstration présente toujours des rencontres « à venir ».
 */
import type { Competition, DataQuality, Team } from '../types';

export const DEMO_COMPETITIONS: Competition[] = [
  { id: 'alpha', name: 'Ligue Synthétique Alpha (fictive)' },
  { id: 'atlantique', name: 'Championnat Démo Atlantique (fictif)' },
  { id: 'sahel', name: 'Division Simulée Sahel (fictive)' },
  { id: 'coupe', name: 'Coupe Continentale Simulée (fictive)' },
];

export const DEMO_TEAMS: Team[] = [
  { id: 'horizon', name: 'FC Horizon', shortName: 'HOR' },
  { id: 'mirage', name: 'Atlético Mirage', shortName: 'MIR' },
  { id: 'nova', name: 'Racing Nova', shortName: 'NOV' },
  { id: 'cobalt', name: 'Union Cobalt', shortName: 'COB' },
  { id: 'delta', name: 'Sporting Delta', shortName: 'DEL' },
  { id: 'boreal', name: 'AS Boréal', shortName: 'BOR' },
  { id: 'zenith', name: 'Olympique Zénith', shortName: 'ZEN' },
  { id: 'prisme', name: 'Real Prisme', shortName: 'PRI' },
  { id: 'quartz', name: 'Dynamo Quartz', shortName: 'QUA' },
  { id: 'lagune', name: 'CS Lagune', shortName: 'LAG' },
  { id: 'basalte', name: 'Inter Basalte', shortName: 'BAS' },
  { id: 'savane', name: 'Étoile Savane', shortName: 'SAV' },
  { id: 'opale', name: "Vaillants d'Opale", shortName: 'OPA' },
  { id: 'phenix', name: 'Phénix Ardent', shortName: 'PHE' },
  { id: 'granit', name: 'Lions de Granit', shortName: 'GRA' },
  { id: 'golfe', name: 'Requins du Golfe', shortName: 'GOL' },
  { id: 'cristal', name: 'AC Cristal', shortName: 'CRI' },
  { id: 'aurore', name: 'Aurore Sportive', shortName: 'AUR' },
  { id: 'meridien', name: 'Méridien United', shortName: 'MER' },
  { id: 'tempete', name: 'Tempête FC', shortName: 'TEM' },
  { id: 'sequoia', name: 'Séquoia Athletic', shortName: 'SEQ' },
  { id: 'onyx', name: 'Onyx Rovers', shortName: 'ONY' },
  { id: 'atlas', name: 'Atlas Club', shortName: 'ATL' },
  { id: 'vega', name: 'Véga Sport', shortName: 'VEG' },
  { id: 'cyclone', name: 'Cyclone Académie', shortName: 'CYC' },
  { id: 'emeraude', name: 'Émeraude FC', shortName: 'EME' },
  { id: 'titan', name: 'Titans du Nord', shortName: 'TIT' },
  { id: 'lumiere', name: 'Lumière Olympique', shortName: 'LUM' },
];

export interface DemoFixture {
  id: string;
  competitionId: string;
  homeId: string;
  awayId: string;
  /** Décalage en jours par rapport à demain (0 = demain). */
  dayOffset: number;
  hour: number;
  minute: number;
  dataQuality: DataQuality;
}

export const DEMO_FIXTURES: DemoFixture[] = [
  { id: 'm01', competitionId: 'alpha', homeId: 'horizon', awayId: 'quartz', dayOffset: 0, hour: 15, minute: 0, dataQuality: 'HIGH' },
  { id: 'm02', competitionId: 'alpha', homeId: 'zenith', awayId: 'lagune', dayOffset: 0, hour: 17, minute: 30, dataQuality: 'HIGH' },
  { id: 'm03', competitionId: 'alpha', homeId: 'mirage', awayId: 'basalte', dayOffset: 0, hour: 20, minute: 0, dataQuality: 'MEDIUM' },
  { id: 'm04', competitionId: 'atlantique', homeId: 'nova', awayId: 'opale', dayOffset: 0, hour: 19, minute: 0, dataQuality: 'HIGH' },
  { id: 'm05', competitionId: 'atlantique', homeId: 'cobalt', awayId: 'golfe', dayOffset: 1, hour: 14, minute: 0, dataQuality: 'MEDIUM' },
  { id: 'm06', competitionId: 'atlantique', homeId: 'granit', awayId: 'delta', dayOffset: 1, hour: 16, minute: 0, dataQuality: 'LOW' },
  { id: 'm07', competitionId: 'sahel', homeId: 'savane', awayId: 'cristal', dayOffset: 1, hour: 18, minute: 30, dataQuality: 'HIGH' },
  { id: 'm08', competitionId: 'sahel', homeId: 'phenix', awayId: 'aurore', dayOffset: 1, hour: 20, minute: 45, dataQuality: 'MEDIUM' },
  { id: 'm09', competitionId: 'alpha', homeId: 'prisme', awayId: 'boreal', dayOffset: 2, hour: 15, minute: 0, dataQuality: 'HIGH' },
  { id: 'm10', competitionId: 'coupe', homeId: 'meridien', awayId: 'tempete', dayOffset: 2, hour: 19, minute: 0, dataQuality: 'HIGH' },
  { id: 'm11', competitionId: 'coupe', homeId: 'sequoia', awayId: 'onyx', dayOffset: 2, hour: 21, minute: 0, dataQuality: 'LOW' },
  { id: 'm12', competitionId: 'sahel', homeId: 'atlas', awayId: 'vega', dayOffset: 3, hour: 16, minute: 0, dataQuality: 'HIGH' },
  { id: 'm13', competitionId: 'atlantique', homeId: 'emeraude', awayId: 'cyclone', dayOffset: 3, hour: 18, minute: 0, dataQuality: 'MEDIUM' },
  { id: 'm14', competitionId: 'coupe', homeId: 'titan', awayId: 'lumiere', dayOffset: 3, hour: 20, minute: 30, dataQuality: 'HIGH' },
  { id: 'm15', competitionId: 'alpha', homeId: 'quartz', awayId: 'mirage', dayOffset: 4, hour: 15, minute: 0, dataQuality: 'MEDIUM' },
  { id: 'm16', competitionId: 'atlantique', homeId: 'golfe', awayId: 'nova', dayOffset: 4, hour: 17, minute: 0, dataQuality: 'HIGH' },
  { id: 'm17', competitionId: 'sahel', homeId: 'cristal', awayId: 'phenix', dayOffset: 5, hour: 18, minute: 0, dataQuality: 'MEDIUM' },
  { id: 'm18', competitionId: 'coupe', homeId: 'onyx', awayId: 'titan', dayOffset: 5, hour: 20, minute: 0, dataQuality: 'HIGH' },
  { id: 'm19', competitionId: 'alpha', homeId: 'lagune', awayId: 'horizon', dayOffset: 6, hour: 16, minute: 0, dataQuality: 'HIGH' },
  { id: 'm20', competitionId: 'sahel', homeId: 'vega', awayId: 'savane', dayOffset: 6, hour: 19, minute: 0, dataQuality: 'LOW' },
];
