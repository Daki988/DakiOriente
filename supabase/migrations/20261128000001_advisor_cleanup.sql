-- Recommandations du conseiller de sécurité Supabase (28/11/2026)
-- Chemin de recherche figé pour les fonctions appelées par les règles d'accès et les calculs de prix
alter function public.require_role(public.app_role) set search_path = public;
alter function public.express_quote(text, text, integer) set search_path = public;
alter function public.setting_int(text) set search_path = public;
alter function public.is_admin() set search_path = public;
-- Fonction réservée à l'admin : pas d'appel possible sans connexion
revoke execute on function public.admin_reset_delivery_code(uuid) from anon, public;
