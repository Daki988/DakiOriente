<?php
/*
 * Schéma TREMPLIN by NEAM — portable SQLite / MySQL / PostgreSQL.
 * {PK} et {TS} sont remplacés selon le pilote par database/Migrator.
 * Les entités suivent la section 15 du cahier des charges.
 */
return [

// ---------- Référentiels (multi-pays) ----------
'countries' => "CREATE TABLE countries (
    id {PK}, code VARCHAR(2) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'FCFA', phone_prefix VARCHAR(6), active INTEGER NOT NULL DEFAULT 1
)",
'cities' => "CREATE TABLE cities (
    id {PK}, country_id INTEGER NOT NULL REFERENCES countries(id), name VARCHAR(100) NOT NULL
)",
'sectors' => "CREATE TABLE sectors (
    id {PK}, name VARCHAR(120) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE, icon VARCHAR(40) DEFAULT 'briefcase-business'
)",
'job_families' => "CREATE TABLE job_families (
    id {PK}, name VARCHAR(150) NOT NULL, sector_id INTEGER REFERENCES sectors(id),
    riasec VARCHAR(3) NOT NULL, description TEXT, skills TEXT, education_min INTEGER DEFAULT 2, outlook VARCHAR(20) DEFAULT 'bonne'
)",
'skills' => "CREATE TABLE skills (
    id {PK}, name VARCHAR(120) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(20) NOT NULL DEFAULT 'tech', aliases TEXT
)",

// ---------- Utilisateurs ----------
'users' => "CREATE TABLE users (
    id {PK}, role VARCHAR(20) NOT NULL DEFAULT 'candidate',
    email VARCHAR(190) NOT NULL UNIQUE, phone VARCHAR(30), password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, avatar VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active', plan_code VARCHAR(20) NOT NULL DEFAULT 'FREE', plan_expires_at {TS},
    notify_email INTEGER NOT NULL DEFAULT 1, notify_sms INTEGER NOT NULL DEFAULT 0, notify_whatsapp INTEGER NOT NULL DEFAULT 0,
    alert_frequency VARCHAR(20) NOT NULL DEFAULT 'instant', consent_marketing INTEGER NOT NULL DEFAULT 0,
    country_code VARCHAR(2) NOT NULL DEFAULT 'GA', email_verified_at {TS}, last_login_at {TS}, created_at {TS}, updated_at {TS}
)",
'api_tokens' => "CREATE TABLE api_tokens (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(60),
    token_hash VARCHAR(64) NOT NULL UNIQUE, expires_at {TS}, last_used_at {TS}, created_at {TS}
)",
'password_resets' => "CREATE TABLE password_resets (
    id {PK}, email VARCHAR(190) NOT NULL, token_hash VARCHAR(64) NOT NULL, expires_at {TS}, created_at {TS}
)",

// ---------- Candidats ----------
'candidate_profiles' => "CREATE TABLE candidate_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(160), bio TEXT, city_id INTEGER REFERENCES cities(id), birth_date VARCHAR(10), gender VARCHAR(10),
    education_level INTEGER NOT NULL DEFAULT 2, field_of_study VARCHAR(150), experience_months INTEGER NOT NULL DEFAULT 0,
    desired_job VARCHAR(150), desired_sector_id INTEGER REFERENCES sectors(id), desired_types VARCHAR(160),
    desired_salary INTEGER, remote_ok INTEGER NOT NULL DEFAULT 0, mobility VARCHAR(20) NOT NULL DEFAULT 'ville',
    availability_date VARCHAR(10), languages TEXT, certifications TEXT, soft_skills TEXT,
    riasec_code VARCHAR(3), riasec_scores TEXT, employability_score INTEGER NOT NULL DEFAULT 0,
    cv_template VARCHAR(20) NOT NULL DEFAULT 'moderne', linkedin VARCHAR(255), portfolio VARCHAR(255),
    visible_to_recruiters INTEGER NOT NULL DEFAULT 1, completion INTEGER NOT NULL DEFAULT 0, cv_ai TEXT, gap_advice TEXT,
    interests VARCHAR(255), photo_document_id INTEGER, cv_settings TEXT, cv_proof TEXT, cv_share_token VARCHAR(40), cv_public INTEGER NOT NULL DEFAULT 0,
    cv_views INTEGER NOT NULL DEFAULT 0, cv_downloads INTEGER NOT NULL DEFAULT 0, updated_at {TS}
)",
'candidate_educations' => "CREATE TABLE candidate_educations (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school VARCHAR(160) NOT NULL, degree VARCHAR(160) NOT NULL, field VARCHAR(160),
    start_year INTEGER, end_year INTEGER, description TEXT
)",
'candidate_experiences' => "CREATE TABLE candidate_experiences (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL, company VARCHAR(160), kind VARCHAR(20) NOT NULL DEFAULT 'stage',
    city VARCHAR(100), start_date VARCHAR(10), end_date VARCHAR(10), description TEXT
)",
'candidate_skills' => "CREATE TABLE candidate_skills (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 3, PRIMARY KEY (user_id, skill_id)
)",
'cv_versions' => "CREATE TABLE cv_versions (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(120), template VARCHAR(20), snapshot TEXT NOT NULL, created_at {TS}
)",
'documents' => "CREATE TABLE documents (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL DEFAULT 'cv', original_name VARCHAR(255), stored_name VARCHAR(255) NOT NULL,
    mime VARCHAR(100), size INTEGER, created_at {TS}
)",
'cover_letters' => "CREATE TABLE cover_letters (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, job_id INTEGER,
    title VARCHAR(190), body TEXT NOT NULL, source VARCHAR(20) DEFAULT 'ia', created_at {TS}
)",
'riasec_results' => "CREATE TABLE riasec_results (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scores TEXT NOT NULL, code VARCHAR(3) NOT NULL, created_at {TS}
)",
'employability_scores' => "CREATE TABLE employability_scores (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL, details TEXT, created_at {TS}
)",
'interview_sessions' => "CREATE TABLE interview_sessions (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, job_id INTEGER,
    questions TEXT NOT NULL, answers TEXT, feedback TEXT, score INTEGER, created_at {TS}
)",

// ---------- Entreprises & offres ----------
'companies' => "CREATE TABLE companies (
    id {PK}, name VARCHAR(160) NOT NULL, slug VARCHAR(180) NOT NULL UNIQUE, sector_id INTEGER REFERENCES sectors(id),
    city_id INTEGER REFERENCES cities(id), size VARCHAR(30), website VARCHAR(255), email VARCHAR(190), phone VARCHAR(30),
    rccm VARCHAR(60), description TEXT, color VARCHAR(10) DEFAULT '#0057ff',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', verified_at {TS}, job_credits INTEGER NOT NULL DEFAULT 3,
    plan_code VARCHAR(20) NOT NULL DEFAULT 'BIZ_FREE', created_at {TS}
)",
'company_users' => "CREATE TABLE company_users (
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'owner', PRIMARY KEY (company_id, user_id)
)",
'jobs' => "CREATE TABLE jobs (
    id {PK}, company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(190) NOT NULL, slug VARCHAR(220) NOT NULL, type VARCHAR(20) NOT NULL DEFAULT 'stage',
    sector_id INTEGER REFERENCES sectors(id), city_id INTEGER REFERENCES cities(id), remote INTEGER NOT NULL DEFAULT 0,
    summary VARCHAR(300), description TEXT, missions TEXT, profile TEXT,
    education_min INTEGER NOT NULL DEFAULT 2, education_eliminatory INTEGER NOT NULL DEFAULT 0,
    experience_min INTEGER NOT NULL DEFAULT 0, salary_min INTEGER, salary_max INTEGER,
    languages VARCHAR(255), soft_skills VARCHAR(255), duration VARCHAR(60), start_date VARCHAR(10), deadline VARCHAR(10),
    positions INTEGER NOT NULL DEFAULT 1, apply_mode VARCHAR(10) NOT NULL DEFAULT 'internal', external_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', moderation_note VARCHAR(255), featured INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0, created_by INTEGER, published_at {TS}, created_at {TS}, updated_at {TS}
)",
'job_skills' => "CREATE TABLE job_skills (
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    required INTEGER NOT NULL DEFAULT 1, weight INTEGER NOT NULL DEFAULT 3, PRIMARY KEY (job_id, skill_id)
)",
'applications' => "CREATE TABLE applications (
    id {PK}, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'sent', cover_letter TEXT, match_score INTEGER, match_details TEXT,
    recruiter_notes TEXT, rating INTEGER, reminder_at {TS}, created_at {TS}, updated_at {TS}
)",
'application_events' => "CREATE TABLE application_events (
    id {PK}, application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, note VARCHAR(255), actor_id INTEGER, created_at {TS}
)",
'interviews' => "CREATE TABLE interviews (
    id {PK}, application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    scheduled_at {TS}, mode VARCHAR(20) NOT NULL DEFAULT 'presentiel', location VARCHAR(255), note TEXT, created_at {TS}
)",
'job_views' => "CREATE TABLE job_views (
    id {PK}, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, user_id INTEGER, created_at {TS}
)",

'favorites' => "CREATE TABLE favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, created_at {TS}, PRIMARY KEY (user_id, job_id)
)",

// ---------- Matching ----------
'matching_weights' => "CREATE TABLE matching_weights (
    id {PK}, sector_id INTEGER REFERENCES sectors(id) ON DELETE CASCADE, criterion VARCHAR(30) NOT NULL, weight INTEGER NOT NULL
)",
'match_scores' => "CREATE TABLE match_scores (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, score INTEGER NOT NULL, details TEXT, computed_at {TS}
)",
'recommendations' => "CREATE TABLE recommendations (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL, ref_id INTEGER, reason TEXT, score INTEGER, source VARCHAR(20) DEFAULT 'regles', created_at {TS}
)",
'ai_logs' => "CREATE TABLE ai_logs (
    id {PK}, user_id INTEGER, feature VARCHAR(40) NOT NULL, provider VARCHAR(20) NOT NULL,
    input_summary VARCHAR(255), output_chars INTEGER, status VARCHAR(20) NOT NULL, created_at {TS}
)",

// ---------- Formations ----------
'learning_platforms' => "CREATE TABLE learning_platforms (
    id {PK}, slug VARCHAR(40) NOT NULL UNIQUE, name VARCHAR(120) NOT NULL, url VARCHAR(255) NOT NULL, color VARCHAR(10) DEFAULT '#0057ff',
    languages VARCHAR(20) DEFAULT 'fr,en', pricing VARCHAR(20) DEFAULT 'freemium', pricing_note VARCHAR(255), certificate_note VARCHAR(255),
    tagline VARCHAR(190), description TEXT, strengths TEXT, tips TEXT, connector VARCHAR(20) NOT NULL DEFAULT 'manual',
    affiliate_param VARCHAR(120), active INTEGER NOT NULL DEFAULT 1, last_sync_at {TS}, last_sync_count INTEGER
)",
'trainings' => "CREATE TABLE trainings (
    id {PK}, title VARCHAR(190) NOT NULL, provider VARCHAR(160), skill_id INTEGER REFERENCES skills(id),
    sector_id INTEGER REFERENCES sectors(id), format VARCHAR(30) DEFAULT 'en ligne', duration VARCHAR(80),
    price INTEGER NOT NULL DEFAULT 0, level VARCHAR(20) DEFAULT 'debutant', url VARCHAR(255), description TEXT,
    platform_id INTEGER REFERENCES learning_platforms(id), language VARCHAR(5) DEFAULT 'fr', skills VARCHAR(255),
    certificate VARCHAR(20) DEFAULT 'variable', external_id VARCHAR(120), source VARCHAR(20) DEFAULT 'catalogue',
    active INTEGER NOT NULL DEFAULT 1, next_session VARCHAR(10), clicks INTEGER NOT NULL DEFAULT 0, updated_at {TS}
)",
'certifications' => "CREATE TABLE certifications (
    id {PK}, name VARCHAR(190) NOT NULL, issuer VARCHAR(190), domain VARCHAR(60), skills VARCHAR(255), language VARCHAR(40),
    level VARCHAR(20) DEFAULT 'debutant', format VARCHAR(120), prep_time VARCHAR(60), cost VARCHAR(20) DEFAULT 'payant',
    url VARCHAR(255), description TEXT, value_note VARCHAR(255)
)",
'candidate_trainings' => "CREATE TABLE candidate_trainings (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    training_id INTEGER NOT NULL REFERENCES trainings(id) ON DELETE CASCADE, status VARCHAR(20) NOT NULL DEFAULT 'suivie',
    started_at {TS}, completed_at {TS}, created_at {TS}
)",
'candidate_certificates' => "CREATE TABLE candidate_certificates (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, training_id INTEGER REFERENCES trainings(id) ON DELETE SET NULL,
    certification_id INTEGER REFERENCES certifications(id) ON DELETE SET NULL, title VARCHAR(190) NOT NULL, issuer VARCHAR(160),
    issued_at VARCHAR(10), credential_url VARCHAR(255), credential_id VARCHAR(120), document_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'declare', review_note VARCHAR(255), created_at {TS}, reviewed_at {TS}
)",
'training_clicks' => "CREATE TABLE training_clicks (
    id {PK}, training_id INTEGER NOT NULL REFERENCES trainings(id) ON DELETE CASCADE, user_id INTEGER, created_at {TS}
)",
'candidate_goals' => "CREATE TABLE candidate_goals (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind VARCHAR(20) NOT NULL,
    ref_id INTEGER, label VARCHAR(190) NOT NULL, gap_key VARCHAR(80), status VARCHAR(20) NOT NULL DEFAULT 'todo',
    created_at {TS}, done_at {TS}
)",

// ---------- Écoles ----------
'schools' => "CREATE TABLE schools (
    id {PK}, owner_user_id INTEGER REFERENCES users(id), name VARCHAR(190) NOT NULL, short_name VARCHAR(30),
    type VARCHAR(30) DEFAULT 'universite', city_id INTEGER REFERENCES cities(id), join_code VARCHAR(12) NOT NULL UNIQUE,
    plan_code VARCHAR(20) DEFAULT 'SCHOOL', created_at {TS}
)",
'school_students' => "CREATE TABLE school_students (
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program VARCHAR(150), level VARCHAR(40), cohort VARCHAR(20), graduated INTEGER NOT NULL DEFAULT 0,
    employed INTEGER NOT NULL DEFAULT 0, joined_at {TS}, PRIMARY KEY (school_id, user_id)
)",
'internships' => "CREATE TABLE internships (
    id {PK}, school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, company_name VARCHAR(160), job_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'recherche', start_date VARCHAR(10), end_date VARCHAR(10),
    tutor VARCHAR(120), agreement_signed INTEGER NOT NULL DEFAULT 0, updated_at {TS}
)",
'school_partners' => "CREATE TABLE school_partners (
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE, created_at {TS}, PRIMARY KEY (school_id, company_id)
)",

// ---------- Monétisation ----------
'plans' => "CREATE TABLE plans (
    code VARCHAR(20) PRIMARY KEY, name VARCHAR(60) NOT NULL, audience VARCHAR(20) NOT NULL DEFAULT 'candidate',
    price INTEGER NOT NULL DEFAULT 0, tagline VARCHAR(190), features TEXT, limits TEXT, highlight INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0
)",
'subscriptions' => "CREATE TABLE subscriptions (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, plan_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active', started_at {TS}, expires_at {TS}, payment_id INTEGER
)",
'payments' => "CREATE TABLE payments (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, plan_code VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, currency VARCHAR(10) NOT NULL DEFAULT 'XAF',
    method VARCHAR(20) NOT NULL, phone VARCHAR(30), reference VARCHAR(40) NOT NULL UNIQUE, coupon_code VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', provider_ref VARCHAR(80), created_at {TS}, updated_at {TS}
)",
'invoices' => "CREATE TABLE invoices (
    id {PK}, payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE, number VARCHAR(30) NOT NULL UNIQUE,
    amount INTEGER NOT NULL, created_at {TS}
)",
'coupons' => "CREATE TABLE coupons (
    code VARCHAR(30) PRIMARY KEY, percent INTEGER NOT NULL, max_uses INTEGER NOT NULL DEFAULT 100,
    uses INTEGER NOT NULL DEFAULT 0, expires_at VARCHAR(10), active INTEGER NOT NULL DEFAULT 1
)",

// ---------- Communication ----------
'notifications' => "CREATE TABLE notifications (
    id {PK}, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type VARCHAR(30) NOT NULL,
    title VARCHAR(190) NOT NULL, body VARCHAR(500), link VARCHAR(255), read_at {TS}, created_at {TS}
)",
'outbox' => "CREATE TABLE outbox (
    id {PK}, channel VARCHAR(10) NOT NULL, recipient VARCHAR(190) NOT NULL, subject VARCHAR(190),
    body TEXT, status VARCHAR(20) NOT NULL DEFAULT 'queued', created_at {TS}, sent_at {TS}
)",
'messages' => "CREATE TABLE messages (
    id {PK}, application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, read_at {TS}, created_at {TS}
)",

// ---------- Back-office ----------
'contents' => "CREATE TABLE contents (
    id {PK}, slug VARCHAR(190) NOT NULL UNIQUE, title VARCHAR(190) NOT NULL, category VARCHAR(40) DEFAULT 'conseil',
    excerpt VARCHAR(300), body TEXT, cover_color VARCHAR(10) DEFAULT '#0057ff', reading_minutes INTEGER DEFAULT 4,
    published INTEGER NOT NULL DEFAULT 1, created_at {TS}
)",
'reports' => "CREATE TABLE reports (
    id {PK}, user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, entity VARCHAR(30) NOT NULL, entity_id INTEGER,
    subject VARCHAR(190), reason TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'open', admin_note TEXT, created_at {TS}
)",
'audit_logs' => "CREATE TABLE audit_logs (
    id {PK}, user_id INTEGER, action VARCHAR(80) NOT NULL, entity VARCHAR(40), entity_id INTEGER,
    meta TEXT, ip VARCHAR(45), created_at {TS}
)",
'settings' => "CREATE TABLE settings (
    skey VARCHAR(80) PRIMARY KEY, svalue TEXT
)",
'rate_limits' => "CREATE TABLE rate_limits (
    bucket VARCHAR(190) PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 0, reset_at INTEGER NOT NULL
)",

// ---------- Index ----------
'_indexes' => [
    'CREATE INDEX idx_goals_user ON candidate_goals(user_id)',
    'CREATE INDEX idx_trainings_platform ON trainings(platform_id, active)',
    'CREATE INDEX idx_trainings_skill ON trainings(skill_id)',
    'CREATE INDEX idx_ctrain_user ON candidate_trainings(user_id)',
    'CREATE INDEX idx_certs_user ON candidate_certificates(user_id)',
    'CREATE INDEX idx_jobs_status ON jobs(status, published_at)',
    'CREATE INDEX idx_jobs_company ON jobs(company_id)',
    'CREATE INDEX idx_apps_user ON applications(user_id)',
    'CREATE INDEX idx_apps_job ON applications(job_id)',
    'CREATE INDEX idx_notif_user ON notifications(user_id, read_at)',
    'CREATE INDEX idx_match_user ON match_scores(user_id, job_id)',
    'CREATE INDEX idx_audit_created ON audit_logs(created_at)',
    'CREATE INDEX idx_cities_country ON cities(country_id)',
],
];
