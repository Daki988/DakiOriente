<?php
declare(strict_types=1);

namespace App\Services\Training;

/**
 * Relie un intitulé de formation (français ou anglais) aux compétences et langues du référentiel.
 * Utilisé par les connecteurs (Coursera, FUN MOOC) et par l'import de catalogues.
 */
final class SkillMatcher
{
    /** Compétence du référentiel => mots-clés recherchés dans le titre (minuscules, sans accents). */
    public const KEYWORDS = [
        'PHP' => ['php', 'laravel', 'symfony'],
        'JavaScript' => ['javascript', 'react', 'node.js', 'nodejs', 'typescript', 'vue.js'],
        'Python' => ['python'],
        'SQL' => ['sql', 'mysql', 'postgresql', 'relational database', 'relational databases', 'bases de donnees relationnelles', 'database design'],
        'HTML / CSS' => ['html', 'css', 'responsive web design', 'site web', 'web design'],
        'Développement mobile' => ['android', 'ios app', 'flutter', 'mobile app', 'application mobile', 'applications mobiles', 'react native', 'kotlin', 'swift'],
        'Réseaux informatiques' => ['computer networks', 'computer networking', 'networking basics', 'network fundamentals', 'network administration', 'reseau informatique', 'reseaux informatiques', 'reseau tcp/ip', 'tcp/ip', 'tcp ip', 'ccna', 'cisco', 'routing', 'switching', 'telecommunications', 'telecoms', '5g', 'ftth', 'fibre optique', 'packet tracer'],
        'Cybersécurité' => ['cybersecurity', 'cyber security', 'cybersecurite', 'securite informatique', 'information security', 'ethical hacking', 'security+'],
        'Support informatique' => ['it support', 'help desk', 'technical support', 'support informatique', 'windows server', 'linux', 'it essentials', 'montez un pc'],
        'Git' => ['git', 'github', 'version control'],
        'Excel avancé' => ['excel', 'spreadsheet', 'tableur', 'vba'],
        'Power BI' => ['power bi', 'powerbi'],
        'Analyse de données' => ['data analysis', 'data analytics', 'data analyst', 'analyse de donnees', 'analyse des donnees', 'data visualization', 'tableau de bord', 'dashboard', 'business intelligence'],
        'Comptabilité générale' => ['accounting', 'comptabilite', 'bookkeeping', 'comptable'],
        'Contrôle de gestion' => ['management accounting', 'controle de gestion', 'cost accounting', 'budgeting', 'budget'],
        'Analyse financière' => ['financial analysis', 'analyse financiere', 'financial modeling', 'corporate finance', 'finance d\'entreprise', 'financial statements', 'valuation'],
        'Fiscalité' => ['tax', 'taxation', 'fiscalite'],
        'Sage Comptabilité' => ['sage'],
        'Gestion de la relation client' => ['crm', 'customer service', 'relation client', 'customer experience', 'customer relationship', 'salesforce'],
        'Techniques de vente' => ['sales', 'selling', 'vente', 'negotiation', 'negociation'],
        'Marketing digital' => ['digital marketing', 'marketing digital', 'marketing numerique', 'seo', 'referencement', 'google ads', 'e-commerce', 'content marketing', 'growth'],
        'Gestion des réseaux sociaux' => ['social media', 'reseaux sociaux', 'community manager', 'facebook ads', 'instagram'],
        'Création graphique' => ['graphic design', 'design graphique', 'photoshop', 'illustrator', 'ux design', 'ui design', 'canva', 'ux/ui'],
        'Rédaction' => ['writing', 'redaction', 'copywriting', 'redigez', 'ecrire', 'grammar', 'storytelling'],
        'Gestion de projet' => ['project management', 'gestion de projet', 'agile', 'scrum', 'pmp', 'capm', 'prince2', 'project manager', 'cycle en v'],
        'Logistique' => ['logistics', 'logistique', 'supply chain', 'chaine d\'approvisionnement', 'transport de marchandises', 'freight'],
        'Gestion des stocks' => ['inventory management', 'gestion des stocks', 'gestion de stock', 'warehouse management', 'procurement', 'achats'],
        'Transit & douane' => ['customs', 'douane', 'international trade', 'commerce international', 'incoterms'],
        'HSE' => ['health and safety', 'occupational safety', 'securite au travail', 'hse', 'hygiene securite', 'qualite hygiene', 'environmental management', 'osha'],
        'Électricité industrielle' => ['electrical', 'electricite', 'electrical engineering', 'electronique', 'circuits'],
        'Maintenance industrielle' => ['maintenance', 'reliability', 'mechanical engineering', 'mecanique', 'industrial'],
        'AutoCAD' => ['autocad', 'cad', 'dessin technique', 'revit', 'bim'],
        'Topographie' => ['surveying', 'topographie', 'topography', 'gps'],
        'Génie civil' => ['civil engineering', 'genie civil', 'construction management', 'structural engineering', 'batiment', 'btp', 'bim'],
        'Géologie' => ['geology', 'geologie', 'mining', 'geoscience', 'mines', 'petroleum', 'petrole'],
        'Énergie solaire' => ['solar', 'solaire', 'photovoltaic', 'photovoltaique', 'renewable energy', 'energies renouvelables'],
        'Gestion forestière' => ['forest', 'foret', 'forestry', 'forestiere', 'biodiversity', 'biodiversite'],
        'SIG / Cartographie' => ['gis', 'sig', 'qgis', 'arcgis', 'cartographie', 'mapping', 'geospatial', 'remote sensing', 'teledetection'],
        'Agronomie' => ['agriculture', 'agronomie', 'agronomy', 'agricole', 'food security', 'securite alimentaire', 'agroecologie', 'agroecology'],
        'Soins infirmiers' => ['nursing', 'soins infirmiers', 'first aid', 'premiers secours', 'patient care', 'sante publique', 'public health'],
        'Pharmacie' => ['pharmacy', 'pharmacie', 'pharmacology', 'pharmacologie', 'medicaments'],
        'Accueil & hôtellerie' => ['hospitality', 'hotel', 'hotellerie', 'tourism', 'tourisme', 'accueil'],
        'Cuisine' => ['cooking', 'cuisine', 'culinary', 'food safety', 'haccp'],
        'Gestion des ressources humaines' => ['human resources', 'ressources humaines', 'recrutement', 'recruiting', 'hr ', 'fiche de paie', 'paie', 'payroll', 'talent'],
        'Droit des affaires' => ['business law', 'droit des affaires', 'droit des societes', 'droit commercial', 'droit du travail', 'contract law', 'droit des contrats', 'ohada', 'corporate law'],
        'Secrétariat' => ['office administration', 'secretariat', 'administrative assistant', 'assistant de direction'],
        'Pack Office' => ['microsoft office', 'word', 'powerpoint', 'office 365', 'microsoft 365', 'bureautique', 'excel'],
        'Suivi-évaluation' => ['monitoring and evaluation', 'suivi-evaluation', 'suivi evaluation', 'impact evaluation', 'evaluation d\'impact', 'meal'],
        'Enseignement' => ['teaching', 'enseigner', 'enseignement', 'pedagogie', 'pedagogy'],
        'Travail en équipe' => ['teamwork', 'travail en equipe', 'collaboration'],
        'Communication' => ['communication professionnelle', 'business communication', 'communication skills', 'strategies de communication', 'communication interpersonnelle', 'public speaking', 'prise de parole', 'presentation skills', 'personal branding'],
        'Leadership' => ['leadership', 'manager une equipe', 'management d\'equipe', 'team management', 'people management', 'leading teams'],
        'Gestion du stress' => ['gestion du stress', 'stress management', 'stress reduction', 'managing stress'],
        'Sens de l\'organisation' => ['productivity', 'productivite', 'time management', 'gestion du temps', 'organisation'],
        'Résolution de problèmes' => ['problem solving', 'resolution de problemes', 'critical thinking', 'esprit critique'],
        'Créativité' => ['creativity', 'creativite', 'design thinking'],
    ];

    /** Langues reconnues (pour les écarts de langue) => mots-clés. */
    public const LANGUAGES = [
        'Anglais' => ['english', 'anglais', 'toefl', 'ielts', 'toeic', 'business english'],
        'Espagnol' => ['spanish', 'espagnol'],
        'Portugais' => ['portuguese', 'portugais'],
        'Chinois' => ['chinese', 'mandarin', 'chinois'],
    ];

    /** Outils précis : prioritaires sur les domaines larges quand un titre cite les deux. */
    private const TOOLS = ['PHP', 'JavaScript', 'Python', 'SQL', 'Power BI', 'Excel avancé', 'Git', 'AutoCAD', 'Sage Comptabilité', 'HTML / CSS', 'SIG / Cartographie'];

    /** Compétences (et langues) détectées dans un intitulé, la plus spécifique en premier. */
    public static function match(string $title, string $extra = ''): array
    {
        $t = ' ' . normalize($title) . ' ';
        $hit = function (array $groups) use ($t): array {
            $found = [];
            foreach ($groups as $skill => $kws) {
                foreach ($kws as $kw) {
                    $k = normalize($kw);
                    if (preg_match('/(?<![a-z0-9])' . preg_quote($k, '/') . '(?![a-z0-9])/', $t)) {
                        $found[$skill] = $k;
                        break;
                    }
                }
            }
            return $found;
        };
        // Une formation de langue reste une formation de langue (« Business English: Networking »)
        if ($langs = $hit(self::LANGUAGES)) {
            return array_keys($langs);
        }
        $found = $hit(self::KEYWORDS);
        // Un mot-clé contenu dans un autre plus précis ne compte pas (« management » dans « project management »)
        foreach ($found as $skill => $k) {
            foreach ($found as $other => $k2) {
                if ($other !== $skill && $k !== $k2 && str_contains($k2, $k)) {
                    unset($found[$skill]);
                    continue 2;
                }
            }
        }
        $score = [];
        foreach ($found as $skill => $k) {
            $score[$skill] = mb_strlen($k) + (in_array($skill, self::TOOLS, true) ? 20 : 0);
        }
        arsort($score);
        return array_keys($score);
    }
}
