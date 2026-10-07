<?php
declare(strict_types=1);

/*
 * Sources d'offres réelles utilisées par la préparation aux stages (offres publiées hors Tremplin).
 * Chaque source a été contrôlée par NEAM le 7 octobre 2026 : site accessible, offres nominatives
 * publiées par des employeurs identifiés. L'équipe NEAM complète, suspend ou retire les sources
 * depuis Admin › Veille des stages ; seules les sources actives sont interrogées.
 *
 * [nom, domaine (recherche limitée à ce domaine et ses sous-domaines), page d'accès, type, pays (codes ISO, * = tous), note de contrôle]
 * Types : plateforme (site d'emploi), relais (site qui republie les annonces d'employeurs), entreprise (site carrière), reseau (réseau professionnel).
 */
return [
    ['Gabon Opportunités', 'gabonopportunites.com', 'https://gabonopportunites.com/category/stages/', 'relais', 'GA',
        'Rubrique Stages : annonces d\'organisations nommées (BAD, WWF Gabon, AGASA, NSIA Vie, AGL). Republie les annonces : vérifier l\'annonce d\'origine.'],
    ['Jobartis Gabon', 'jobartis.ga', 'https://www.jobartis.ga/emplois/stage', 'plateforme', 'GA',
        'Site d\'emploi avec espace employeur ; rubrique stage avec entreprises et villes indiquées. Beaucoup d\'offres sont clôturées.'],
    ['Africarrières', 'africarrieres.com', 'https://africarrieres.com/gabon/fr', 'plateforme', 'GA,CM,CG',
        'Site d\'emploi multi-pays ; offres d\'employeurs nommés (AGL, SUNU Assurances, Baker Hughes) avec date relative.'],
    ['QG Jeune Gabon', 'qgjeunegabon.org', 'https://www.qgjeunegabon.org/', 'relais', 'GA',
        'Association de jeunesse qui relaie des offres de stage nominatives (ex. juriste stagiaire à Libreville).'],
    ['Michael Page Africa', 'michaelpageafrica.com', 'https://www.michaelpageafrica.com/fr/jobs/gabon', 'plateforme', 'GA,CM,CG',
        'Cabinet de recrutement international ; surtout des postes confirmés, utile pour les attentes des grands employeurs.'],
    ['AGL Gabon (carrières)', 'acareerbyagl.talent-soft.com', 'https://acareerbyagl.talent-soft.com/', 'entreprise', 'GA,CM,CG',
        'Site carrière officiel d\'Africa Global Logistics : stages conventionnels et stages PNPE au Gabon.'],
    ['Grant Thornton Gabon (carrières)', 'grantthornton.ga', 'https://www.grantthornton.ga/en/careers/job-opportunities/', 'entreprise', 'GA',
        'Page officielle d\'offres d\'emploi et de stage du cabinet d\'audit.'],
    ['LinkedIn Emplois', 'linkedin.com', 'https://www.linkedin.com/jobs/', 'reseau', '*',
        'Offres publiées par les pages entreprises ; la recherche est limitée au pays du candidat.'],
    ['MinaJobs Cameroun', 'minajobs.net', 'https://cameroun.minajobs.net/', 'plateforme', 'CM',
        'Site d\'emploi camerounais ; offres d\'employeurs nommés (GIZ, SPAR, EcoSantePro), y compris des stages.'],
];
