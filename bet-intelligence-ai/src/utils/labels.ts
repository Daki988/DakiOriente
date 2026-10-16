/** Libellés dépendant de l'origine des données : jamais « réel » pour du synthétique, ni l'inverse. */
export function labels(live: boolean) {
  return live
    ? {
        sim: '',
        sims: '',
        xg: 'Buts attendus (modèle)',
        odds: 'Cote',
        oddsLong: 'cotes des bookmakers',
        stats: 'Moyennes par match (saison)',
        form: 'Bilan et forme récente',
        last5: '5 derniers matchs',
        venueHome: 'Bilan à domicile',
        venueAway: 'Bilan à l’extérieur',
        recentTitle: 'Dernières performances',
        chartNote: 'Probabilités estimées par le modèle statistique à partir de données réelles.',
        matchesHint: 'Rencontres à venir',
        matchNotice: 'Données réelles. Les probabilités sont des estimations du modèle statistique, sans garantie.',
      }
    : {
        sim: ' simulé',
        sims: ' simulés',
        xg: 'xG simulés',
        odds: 'Cote démo',
        oddsLong: 'cotes de démonstration',
        stats: 'Moyennes simulées par match',
        form: 'Bilan et forme récente simulés',
        last5: '5 derniers matchs simulés',
        venueHome: 'Bilan simulé à domicile',
        venueAway: 'Bilan simulé à l’extérieur',
        recentTitle: 'Dernières performances simulées',
        chartNote: 'Graphique fondé sur des données synthétiques de démonstration.',
        matchesHint: 'Rencontres simulées à venir',
        matchNotice: 'Rencontre, équipes et statistiques entièrement fictives, générées pour la démonstration.',
      };
}
export type Labels = ReturnType<typeof labels>;
