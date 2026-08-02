-- =============================================================
-- Migration 000003: Fix RLS p/ página não ficar branca +
--   permitir select de projects SEM login (slug não é segredo)
-- =============================================================

BEGIN;

-- 1. projects: SELECT p/ todos (até anon) pois a página de login
--    precisa resolver project_id pelo slug ANTES do usuário logar.
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT
  USING (true);

-- 2. projects: INSERT/UPDATE/DELETE continuam restritos a service_role
--    (não criamos policies p/ usuário final — por padrão RLS nega tudo
--    exceto o que as policies permitem; e os triggers usam SECURITY
--    DEFINER, então não dependem do role do caller.)

-- 3. project_members: SELECT continua permitindo ver apenas a própria
--    linha do user (existente tá ok). Garantir:
DROP POLICY IF EXISTS project_members_select ON public.project_members;
CREATE POLICY project_members_select ON public.project_members FOR SELECT
  USING (user_id = auth.uid());

-- 4. is_project_member e get_project_role já são SECURITY DEFINER com
--    SET search_path TO public, então funcionam mesmo que as policies
--    de project_members bloqueiem select p/ usuários sem login.
--    (Não precisa mudar.)

COMMIT;
