<?php
declare(strict_types=1);

use App\Controllers\AccountController;
use App\Controllers\Admin\AdminController;
use App\Controllers\Admin\InternshipWatchController;
use App\Controllers\Admin\LearningController as AdminLearningController;
use App\Controllers\Admin\ReferentialController;
use App\Controllers\Api\ApiController;
use App\Controllers\AuthController;
use App\Controllers\Candidate\ApplicationController;
use App\Controllers\Candidate\CareerController;
use App\Controllers\Candidate\CvController;
use App\Controllers\Candidate\DashboardController;
use App\Controllers\Candidate\InternshipController;
use App\Controllers\Candidate\LearningController;
use App\Controllers\Candidate\MatchController;
use App\Controllers\Candidate\ProfileController;
use App\Controllers\Company\CompanyController;
use App\Controllers\Company\RecruitController;
use App\Controllers\PageController;
use App\Controllers\PublicCvController;
use App\Controllers\JobController;
use App\Controllers\School\SchoolController;
use App\Controllers\SubscriptionController;
use App\Controllers\TrainingController;
use App\Core\Router;

return function (Router $r): void {

    /* ---------- Pages publiques ---------- */
    $r->get('/', [PageController::class, 'home']);
    $r->get('/offres', [JobController::class, 'index']);
    $r->get('/offres/{id}', [JobController::class, 'show']);
    $r->get('/entreprises', [PageController::class, 'companies']);
    $r->get('/entreprises/{slug}', [PageController::class, 'company']);
    $r->get('/formations', [TrainingController::class, 'index']);
    $r->get('/formations/plateformes', [TrainingController::class, 'platforms']);
    $r->get('/formations/plateformes/{slug}', [TrainingController::class, 'platform']);
    $r->get('/formations/{id}', [TrainingController::class, 'show']);
    $r->get('/formations/{id}/aller', [TrainingController::class, 'go'], ['throttle:training-go,60,10']);
    $r->get('/certifications', [PageController::class, 'certifications']);
    $r->get('/photos/{token}', [PublicCvController::class, 'photo']);
    $r->get('/cv/{token}', [PublicCvController::class, 'show'], ['throttle:cv-public,120,10']);
    $r->get('/cv/{token}/pdf', [PublicCvController::class, 'pdf'], ['throttle:cv-public-pdf,20,10']);
    $r->get('/conseils', [PageController::class, 'articles']);
    $r->get('/conseils/{slug}', [PageController::class, 'article']);
    $r->get('/tarifs', [PageController::class, 'pricing']);
    $r->get('/confidentialite', [PageController::class, 'privacy']);
    $r->get('/api', [PageController::class, 'apiDocs']);
    $r->post('/signaler', [PageController::class, 'report'], ['auth', 'throttle:report,10,60']);

    /* ---------- Authentification ---------- */
    $r->get('/connexion', [AuthController::class, 'loginForm'], ['guest']);
    $r->post('/connexion', [AuthController::class, 'login'], ['guest', 'throttle:login,8,10']);
    $r->get('/inscription', [AuthController::class, 'registerForm'], ['guest']);
    $r->post('/inscription', [AuthController::class, 'register'], ['guest', 'throttle:register,6,30']);
    $r->post('/deconnexion', [AuthController::class, 'logout'], ['auth']);
    $r->get('/mot-de-passe-oublie', [AuthController::class, 'forgotForm'], ['guest']);
    $r->post('/mot-de-passe-oublie', [AuthController::class, 'forgot'], ['guest', 'throttle:forgot,5,30']);
    $r->get('/reinitialiser/{token}', [AuthController::class, 'resetForm'], ['guest']);
    $r->post('/reinitialiser/{token}', [AuthController::class, 'reset'], ['guest', 'throttle:reset,8,30']);

    /* ---------- Commun à tous les comptes ---------- */
    $r->group('', ['auth'], function (Router $r) {
        $r->get('/notifications', [AccountController::class, 'notifications']);
        $r->post('/notifications/lire', [AccountController::class, 'markRead']);
        $r->get('/compte', [AccountController::class, 'settings']);
        $r->post('/compte/preferences', [AccountController::class, 'preferences']);
        $r->post('/compte/mot-de-passe', [AccountController::class, 'password']);
        $r->get('/compte/export', [AccountController::class, 'export']);
        $r->post('/compte/supprimer', [AccountController::class, 'destroy']);
        $r->get('/compte/api', [AccountController::class, 'apiToken']);
        $r->post('/compte/api', [AccountController::class, 'createApiToken']);
        $r->get('/documents/{id}', [AccountController::class, 'document']);
        $r->post('/messages/{id}', [AccountController::class, 'sendMessage'], ['throttle:msg,30,10']);
    });

    /* ---------- Abonnements ---------- */
    $r->group('/abonnement', ['auth'], function (Router $r) {
        $r->get('', [SubscriptionController::class, 'index']);
        $r->post('/payer', [SubscriptionController::class, 'pay'], ['throttle:pay,10,10']);
        $r->get('/paiement/{ref}', [SubscriptionController::class, 'status']);
        $r->post('/paiement/{ref}/confirmer', [SubscriptionController::class, 'confirm']);
        $r->get('/facture/{id}', [SubscriptionController::class, 'invoice']);
    });

    /* ---------- Espace candidat ---------- */
    $r->post('/offres/{id}/favori', [ApplicationController::class, 'toggleFavorite'], ['role:candidate']);
    $r->get('/offres/{id}/postuler', [ApplicationController::class, 'applyForm'], ['role:candidate']);
    $r->post('/offres/{id}/postuler', [ApplicationController::class, 'apply'], ['role:candidate', 'throttle:apply,20,60']);

    $r->group('/espace', ['role:candidate'], function (Router $r) {
        $r->get('', [DashboardController::class, 'index']);
        $r->get('/bienvenue', [ProfileController::class, 'onboarding']);
        $r->post('/bienvenue', [ProfileController::class, 'saveOnboarding']);
        $r->get('/profil', [ProfileController::class, 'edit']);
        $r->post('/profil', [ProfileController::class, 'update']);
        $r->post('/profil/competences', [ProfileController::class, 'addSkill']);
        $r->post('/profil/competences/{id}/supprimer', [ProfileController::class, 'removeSkill']);
        $r->post('/profil/competences/{id}', [ProfileController::class, 'updateSkill']);
        $r->post('/profil/formations', [ProfileController::class, 'addEducation']);
        $r->post('/profil/formations/{id}/supprimer', [ProfileController::class, 'removeEducation']);
        $r->post('/profil/experiences', [ProfileController::class, 'addExperience']);
        $r->post('/profil/experiences/{id}/supprimer', [ProfileController::class, 'removeExperience']);
        $r->post('/profil/langues', [ProfileController::class, 'saveLanguages']);
        $r->post('/ecole', [ProfileController::class, 'joinSchool']);

        $r->get('/cv', [CvController::class, 'index']);
        $r->post('/cv/modele', [CvController::class, 'template']);
        $r->post('/cv/reglages', [CvController::class, 'settings']);
        $r->post('/cv/photo', [CvController::class, 'photo'], ['throttle:upload,10,10']);
        $r->post('/cv/photo/supprimer', [CvController::class, 'deletePhoto']);
        $r->get('/cv/apercu', [CvController::class, 'preview']);
        $r->post('/cv/relecture', [CvController::class, 'proof'], ['throttle:cv-proof,60,10']);
        $r->get('/cv/pdf', [CvController::class, 'pdf'], ['throttle:cv-pdf,60,10']);
        $r->post('/cv/partage', [CvController::class, 'share']);
        $r->post('/cv/version', [CvController::class, 'snapshot']);
        $r->post('/cv/ia', [CvController::class, 'aiCv'], ['throttle:ai,30,60']);
        $r->post('/cv/ia/reinitialiser', [CvController::class, 'resetAiCv']);
        $r->get('/cv/imprimer', [CvController::class, 'print']);
        $r->get('/cv/versions/{id}', [CvController::class, 'version']);
        $r->post('/cv/import', [CvController::class, 'import'], ['throttle:upload,10,10']);
        $r->post('/cv/import/appliquer', [CvController::class, 'applyImport']);
        $r->get('/lettres', [CvController::class, 'letters']);
        $r->post('/lettres', [CvController::class, 'generateLetter'], ['throttle:ai,30,60']);
        $r->post('/lettres/{id}/supprimer', [CvController::class, 'deleteLetter']);

        $r->get('/candidatures', [ApplicationController::class, 'index']);
        $r->get('/candidatures/{id}', [ApplicationController::class, 'show']);
        $r->post('/candidatures/{id}/rappel', [ApplicationController::class, 'reminder']);
        $r->post('/candidatures/{id}/retirer', [ApplicationController::class, 'withdraw']);
        $r->get('/favoris', [ApplicationController::class, 'favorites']);

        $r->get('/recommandations', [CareerController::class, 'recommendations']);
        $r->get('/employabilite', [CareerController::class, 'employability']);
        $r->get('/orientation', [CareerController::class, 'orientation']);
        $r->post('/orientation', [CareerController::class, 'submitOrientation']);
        $r->get('/entretien', [CareerController::class, 'interview']);
        $r->post('/entretien', [CareerController::class, 'startInterview']);
        $r->get('/entretien/{id}', [CareerController::class, 'interviewSession']);
        $r->post('/entretien/{id}', [CareerController::class, 'answerInterview']);
        $r->get('/plan', [CareerController::class, 'plan']);
        $r->get('/formations', [LearningController::class, 'index']);
        $r->post('/formations/{id}/statut', [LearningController::class, 'status']);
        $r->post('/certificats', [LearningController::class, 'addCertificate'], ['throttle:upload,10,10']);
        $r->post('/certificats/{id}/supprimer', [LearningController::class, 'deleteCertificate']);
        $r->get('/progression', [CareerController::class, 'progression']);
        $r->post('/progression/objectifs', [CareerController::class, 'addGoal']);
        $r->post('/progression/objectifs/{id}', [CareerController::class, 'updateGoal']);
        $r->post('/progression/objectifs/{id}/supprimer', [CareerController::class, 'deleteGoal']);
        $r->post('/progression/conseil', [CareerController::class, 'gapAdvice'], ['throttle:ai,30,60']);
        // Explicabilité (référentiels v1.1)
        $r->post('/offres/{id}/compris', [MatchController::class, 'understood'], ['throttle:feedback,60,10']);
        $r->post('/offres/{id}/signaler-explication', [MatchController::class, 'report'], ['throttle:report,10,60']);
        $r->post('/offres/{id}/explication', [MatchController::class, 'rephrase'], ['throttle:ai,30,60']);
        $r->post('/metiers-cibles', [MatchController::class, 'targets']);
        $r->get('/metiers/recherche', [MatchController::class, 'searchOccupations']);
        // Préparation aux stages (offres réelles publiées hors de Tremplin)
        $r->get('/preparation-stages', [InternshipController::class, 'index']);
        $r->post('/preparation-stages/rechercher', [InternshipController::class, 'search'], ['throttle:stagesearch,6,1440']);
        $r->post('/preparation-stages/offres/{id}/signaler', [InternshipController::class, 'report'], ['throttle:report,10,60']);
    });

    /* ---------- Espace entreprise ---------- */
    $r->group('/entreprise', ['role:company'], function (Router $r) {
        $r->get('/profil', [CompanyController::class, 'profile']);
        $r->post('/profil', [CompanyController::class, 'saveProfile']);
        $r->group('', ['verified'], function (Router $r) {
            $r->get('', [CompanyController::class, 'dashboard']);
            $r->get('/offres', [CompanyController::class, 'jobs']);
            $r->get('/offres/nouvelle', [CompanyController::class, 'createJob']);
            $r->post('/offres', [CompanyController::class, 'storeJob']);
            $r->get('/offres/{id}/modifier', [CompanyController::class, 'editJob']);
            $r->post('/offres/{id}', [CompanyController::class, 'updateJob']);
            $r->post('/offres/{id}/dupliquer', [CompanyController::class, 'duplicateJob']);
            $r->post('/offres/{id}/archiver', [CompanyController::class, 'archiveJob']);
            $r->get('/metiers/suggerer', [CompanyController::class, 'suggestOccupation']);
            $r->get('/metiers/{id}/fiche', [CompanyController::class, 'occupationSheet']);
            $r->get('/offres/{id}/candidatures', [RecruitController::class, 'pipeline']);
            $r->get('/offres/{id}/matching', [RecruitController::class, 'matching']);
            $r->get('/candidatures/{id}', [RecruitController::class, 'application']);
            $r->post('/candidatures/{id}/statut', [RecruitController::class, 'status']);
            $r->post('/candidatures/{id}/notes', [RecruitController::class, 'notes']);
            $r->post('/candidatures/{id}/entretien', [RecruitController::class, 'interview']);
            $r->get('/cvtheque', [RecruitController::class, 'search']);
            $r->get('/candidats/{id}', [RecruitController::class, 'candidate']);
            $r->post('/candidats/{id}/inviter', [RecruitController::class, 'invite']);
            $r->get('/statistiques', [CompanyController::class, 'stats']);
        });
    });

    /* ---------- Espace école ---------- */
    $r->group('/ecole', ['role:school'], function (Router $r) {
        $r->get('', [SchoolController::class, 'dashboard']);
        $r->get('/etudiants', [SchoolController::class, 'students']);
        $r->post('/etudiants/inviter', [SchoolController::class, 'invite']);
        $r->post('/etudiants/{id}', [SchoolController::class, 'updateStudent']);
        $r->get('/stages', [SchoolController::class, 'internships']);
        $r->post('/stages', [SchoolController::class, 'storeInternship']);
        $r->post('/stages/{id}', [SchoolController::class, 'updateInternship']);
        $r->get('/diffusion', [SchoolController::class, 'broadcast']);
        $r->post('/diffusion', [SchoolController::class, 'sendBroadcast']);
        $r->post('/partenaires', [SchoolController::class, 'addPartner']);
        $r->get('/export', [SchoolController::class, 'export']);
    });

    /* ---------- Back-office NEAM ---------- */
    $r->group('/admin', ['role:admin'], function (Router $r) {
        $r->get('', [AdminController::class, 'dashboard']);
        $r->get('/formations', [AdminLearningController::class, 'index']);
        $r->post('/formations/import', [AdminLearningController::class, 'import']);
        $r->post('/formations/plateformes/{id}', [AdminLearningController::class, 'updatePlatform']);
        $r->post('/formations/{slug}/synchroniser', [AdminLearningController::class, 'sync']);
        $r->post('/formations/{id}/visibilite', [AdminLearningController::class, 'toggleTraining']);
        $r->post('/certificats/{id}', [AdminLearningController::class, 'reviewCertificate']);
        $r->get('/utilisateurs', [AdminController::class, 'users']);
        $r->post('/utilisateurs/{id}', [AdminController::class, 'updateUser']);
        $r->get('/entreprises', [AdminController::class, 'companies']);
        $r->post('/entreprises/{id}', [AdminController::class, 'moderateCompany']);
        $r->get('/offres', [AdminController::class, 'jobs']);
        $r->post('/offres/{id}', [AdminController::class, 'moderateJob']);
        $r->get('/referentiels/donnees', [AdminController::class, 'referentials']);
        $r->post('/referentiels/donnees', [AdminController::class, 'saveReferential']);
        $r->post('/referentiels/donnees/supprimer', [AdminController::class, 'deleteReferential']);
        // Référentiels v1.1 : curation, versions, jeu de référence, qualité
        $r->get('/referentiels', [ReferentialController::class, 'index']);
        $r->get('/referentiels/metiers', [ReferentialController::class, 'occupations']);
        $r->post('/referentiels/metiers', [ReferentialController::class, 'createOccupation']);
        $r->get('/referentiels/metiers/{id}', [ReferentialController::class, 'occupation']);
        $r->post('/referentiels/metiers/{id}', [ReferentialController::class, 'saveOccupation']);
        $r->post('/referentiels/metiers/{id}/statut', [ReferentialController::class, 'occupationStatus']);
        $r->get('/referentiels/competences', [ReferentialController::class, 'skills']);
        $r->post('/referentiels/competences', [ReferentialController::class, 'saveSkill']);
        $r->get('/referentiels/diplomes', [ReferentialController::class, 'degrees']);
        $r->post('/referentiels/diplomes', [ReferentialController::class, 'saveDegree']);
        $r->get('/referentiels/regles', [ReferentialController::class, 'rules']);
        $r->post('/referentiels/regles', [ReferentialController::class, 'saveRules']);
        $r->get('/referentiels/versions', [ReferentialController::class, 'versions']);
        $r->post('/referentiels/versions', [ReferentialController::class, 'publish']);
        $r->post('/referentiels/jeu-de-reference', [ReferentialController::class, 'addPair']);
        $r->post('/referentiels/jeu-de-reference/{id}/supprimer', [ReferentialController::class, 'deletePair']);
        $r->post('/referentiels/equipe', [ReferentialController::class, 'team']);
        $r->get('/veille-stages', [InternshipWatchController::class, 'index']);
        $r->post('/veille-stages/sources', [InternshipWatchController::class, 'saveSource']);
        $r->post('/veille-stages/sources/{id}/statut', [InternshipWatchController::class, 'toggleSource']);
        $r->post('/veille-stages/offres', [InternshipWatchController::class, 'addOffer']);
        $r->post('/veille-stages/offres/{id}/masquer', [InternshipWatchController::class, 'toggleOffer']);
        $r->post('/veille-stages/offres/{id}/verifier', [InternshipWatchController::class, 'recheck']);
        $r->post('/veille-stages/rechercher', [InternshipWatchController::class, 'search']);
        $r->post('/veille-stages/reglages', [InternshipWatchController::class, 'settings']);
        $r->get('/curation', [ReferentialController::class, 'curation']);
        $r->post('/curation/{id}', [ReferentialController::class, 'handleCuration']);
        $r->get('/qualite', [ReferentialController::class, 'quality']);
        $r->post('/qualite/controle', [ReferentialController::class, 'check']);
        $r->post('/formations/verifier-liens', [ReferentialController::class, 'checkLinks']);
        $r->post('/formations/{id}/fiche', [ReferentialController::class, 'saveTraining']);
        $r->get('/matching', [ReferentialController::class, 'rules']);
        $r->get('/paiements', [AdminController::class, 'payments']);
        $r->post('/coupons', [AdminController::class, 'saveCoupon']);
        $r->get('/contenus', [AdminController::class, 'contents']);
        $r->post('/contenus', [AdminController::class, 'saveContent']);
        $r->get('/signalements', [AdminController::class, 'reports']);
        $r->post('/signalements/{id}', [AdminController::class, 'updateReport']);
        $r->get('/communications', [AdminController::class, 'outbox']);
        $r->get('/audit', [AdminController::class, 'audit']);
        $r->get('/parametres', [AdminController::class, 'settings']);
        $r->post('/parametres', [AdminController::class, 'saveSettings']);
        $r->get('/export/{type}', [AdminController::class, 'export']);
    });

    /* ---------- API REST v1 (JSON, jeton Bearer) ---------- */
    $r->group('/api/v1', ['api', 'throttle:api,120,1'], function (Router $r) {
        $r->get('/openapi.json', [ApiController::class, 'openapi']);
        $r->post('/auth/register', [ApiController::class, 'register'], ['throttle:api-register,6,30']);
        $r->post('/auth/login', [ApiController::class, 'login'], ['throttle:api-login,8,10']);
        $r->get('/jobs', [ApiController::class, 'jobs']);
        $r->get('/jobs/{id}', [ApiController::class, 'job']);
        $r->get('/candidates/me', [ApiController::class, 'me'], ['role:candidate']);
        $r->patch('/candidates/me', [ApiController::class, 'updateMe'], ['role:candidate']);
        $r->post('/jobs/{id}/apply', [ApiController::class, 'apply'], ['role:candidate']);
        $r->get('/matches', [ApiController::class, 'matches'], ['role:candidate']);
        $r->get('/recommendations', [ApiController::class, 'recommendations'], ['role:candidate']);
        $r->get('/gaps', [ApiController::class, 'gaps'], ['role:candidate']);
        $r->get('/certifications', [ApiController::class, 'certifications']);
        $r->get('/referentials/version', [ApiController::class, 'refVersion']);
        $r->get('/referentials/occupations', [ApiController::class, 'occupations']);
        $r->get('/referentials/occupations/{code}', [ApiController::class, 'occupation']);
        $r->get('/referentials/skills', [ApiController::class, 'refSkills']);
        $r->get('/referentials/degrees', [ApiController::class, 'degrees']);
        $r->get('/trainings', [ApiController::class, 'trainings']);
        $r->post('/cv/generate', [ApiController::class, 'cv'], ['role:candidate']);
        $r->post('/cover-letter/generate', [ApiController::class, 'coverLetter'], ['role:candidate']);
        $r->post('/interview/simulate', [ApiController::class, 'interview'], ['role:candidate']);
        $r->post('/companies/jobs', [ApiController::class, 'createJob'], ['role:company']);
        $r->get('/companies/candidates/search', [ApiController::class, 'searchCandidates'], ['role:company']);
        $r->get('/admin/analytics', [ApiController::class, 'analytics'], ['role:admin']);
    });
};
