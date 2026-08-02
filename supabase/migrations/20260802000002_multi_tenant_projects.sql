-- =============================================================
-- MULTI-TENANCY: Projects + Project Members + project_id cols
-- =============================================================

-- 1. Tabelas de controle de projetos
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user'::user_role,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_members_user_idx ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS project_members_project_idx ON public.project_members(project_id);

-- Seed: projeto July Utensílios
INSERT INTO public.projects (slug, name)
VALUES ('july-utensilios', 'July Utensílios')
ON CONFLICT (slug) DO NOTHING;

-- Função helper usada como DEFAULT em colunas project_id
CREATE OR REPLACE FUNCTION public._default_project_id()
RETURNS uuid STABLE LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v uuid;
BEGIN
    SELECT id INTO v FROM public.projects WHERE slug = 'july-utensilios' LIMIT 1;
    IF v IS NULL THEN
        SELECT id INTO v FROM public.projects ORDER BY created_at LIMIT 1;
    END IF;
    RETURN v;
END; $$;

-- Seed: todos os auth.users existentes viram admins do projeto july
INSERT INTO public.project_members (project_id, user_id, role)
SELECT p.id, a.id, 'admin'::user_role
FROM auth.users a
CROSS JOIN public.projects p
WHERE p.slug = 'july-utensilios'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- =============================================================
-- 2. Adicionar project_id EM TODAS as tabelas de negócio
-- =============================================================

DO $$ DECLARE july_id uuid;
BEGIN
    SELECT public._default_project_id() INTO july_id;

    -- user_profiles (nullable, opcional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='project_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
        UPDATE public.user_profiles SET project_id = july_id WHERE project_id IS NULL;
    END IF;

    -- clients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='project_id') THEN
        ALTER TABLE public.clients ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.clients SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.clients ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='categories' AND column_name='project_id') THEN
        ALTER TABLE public.categories ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.categories SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.categories ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='project_id') THEN
        ALTER TABLE public.products ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.products SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.products ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- product_images
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='product_images' AND column_name='project_id') THEN
        ALTER TABLE public.product_images ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.product_images SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.product_images ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- stock_movements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='stock_movements' AND column_name='project_id') THEN
        ALTER TABLE public.stock_movements ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.stock_movements SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.stock_movements ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- sales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sales' AND column_name='project_id') THEN
        ALTER TABLE public.sales ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.sales SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.sales ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- sale_items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sale_items' AND column_name='project_id') THEN
        ALTER TABLE public.sale_items ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.sale_items SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.sale_items ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- installments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='installments' AND column_name='project_id') THEN
        ALTER TABLE public.installments ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
        UPDATE public.installments SET project_id = july_id WHERE project_id IS NULL;
        ALTER TABLE public.installments ALTER COLUMN project_id SET NOT NULL;
    END IF;

    -- audit_logs (nullable, opcional)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='project_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
        UPDATE public.audit_logs SET project_id = july_id WHERE project_id IS NULL;
    END IF;
END $$;

-- Atribuir DEFAULT via função estável (fora do DO block, pode referenciar coluna)
ALTER TABLE public.clients      ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.categories   ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.products     ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.product_images ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.stock_movements ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.sales        ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.sale_items   ALTER COLUMN project_id SET DEFAULT public._default_project_id();
ALTER TABLE public.installments ALTER COLUMN project_id SET DEFAULT public._default_project_id();

-- =============================================================
-- 3. Indexes em project_id
-- =============================================================
CREATE INDEX IF NOT EXISTS clients_project_idx ON public.clients(project_id);
CREATE INDEX IF NOT EXISTS categories_project_idx ON public.categories(project_id);
CREATE INDEX IF NOT EXISTS products_project_idx ON public.products(project_id);
CREATE INDEX IF NOT EXISTS product_images_project_idx ON public.product_images(project_id);
CREATE INDEX IF NOT EXISTS stock_movements_project_idx ON public.stock_movements(project_id);
CREATE INDEX IF NOT EXISTS sales_project_idx ON public.sales(project_id);
CREATE INDEX IF NOT EXISTS sale_items_project_idx ON public.sale_items(project_id);
CREATE INDEX IF NOT EXISTS installments_project_idx ON public.installments(project_id);
CREATE INDEX IF NOT EXISTS audit_logs_project_idx ON public.audit_logs(project_id);

-- =============================================================
-- 4. Trigger: propaga project_id do pai pro filho (ex: products -> product_images / stock_movements)
-- =============================================================
CREATE OR REPLACE FUNCTION public.propagate_project_id_from_parent()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_TABLE_NAME = 'sale_items' AND NEW.project_id IS NULL THEN
        SELECT project_id INTO NEW.project_id FROM public.sales WHERE id = NEW.sale_id LIMIT 1;
    END IF;
    IF TG_TABLE_NAME = 'product_images' AND NEW.project_id IS NULL THEN
        SELECT project_id INTO NEW.project_id FROM public.products WHERE id = NEW.product_id LIMIT 1;
    END IF;
    IF TG_TABLE_NAME = 'stock_movements' AND NEW.project_id IS NULL THEN
        SELECT project_id INTO NEW.project_id FROM public.products WHERE id = NEW.product_id LIMIT 1;
    END IF;
    IF TG_TABLE_NAME = 'installments' AND NEW.project_id IS NULL THEN
        SELECT project_id INTO NEW.project_id FROM public.sales WHERE id = NEW.sale_id LIMIT 1;
    END IF;
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sale_items_propagate_project ON public.sale_items;
CREATE TRIGGER sale_items_propagate_project
BEFORE INSERT ON public.sale_items FOR EACH ROW
EXECUTE FUNCTION public.propagate_project_id_from_parent();

DROP TRIGGER IF EXISTS product_images_propagate_project ON public.product_images;
CREATE TRIGGER product_images_propagate_project
BEFORE INSERT ON public.product_images FOR EACH ROW
EXECUTE FUNCTION public.propagate_project_id_from_parent();

DROP TRIGGER IF EXISTS stock_movements_propagate_project ON public.stock_movements;
CREATE TRIGGER stock_movements_propagate_project
BEFORE INSERT ON public.stock_movements FOR EACH ROW
EXECUTE FUNCTION public.propagate_project_id_from_parent();

DROP TRIGGER IF EXISTS installments_propagate_project ON public.installments;
CREATE TRIGGER installments_propagate_project
BEFORE INSERT ON public.installments FOR EACH ROW
EXECUTE FUNCTION public.propagate_project_id_from_parent();

-- =============================================================
-- 5. Trigger: ao criar user via Supabase Auth, adiciona ao projeto default
--    (usa o primeiro projeto existente ordenado por created_at)
-- =============================================================
CREATE OR REPLACE FUNCTION public.on_auth_user_created_auto_membership()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid uuid;
BEGIN
    SELECT id INTO v_pid FROM public.projects ORDER BY created_at LIMIT 1;
    IF v_pid IS NOT NULL THEN
        INSERT INTO public.project_members (project_id, user_id, role)
        VALUES (v_pid, NEW.id, 'user'::user_role)
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_membership_trigger ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_membership_trigger
AFTER INSERT ON auth.users FOR EACH ROW
EXECUTE FUNCTION public.on_auth_user_created_auto_membership();

-- =============================================================
-- 6. Helpers para RLS multi-tenant
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_project_member(pid uuid)
RETURNS boolean STABLE LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.project_members
         WHERE user_id = auth.uid() AND project_id = pid
    );
END; $$;

CREATE OR REPLACE FUNCTION public.get_project_role(pid uuid)
RETURNS user_role STABLE LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r user_role;
BEGIN
    SELECT role INTO r FROM public.project_members
     WHERE user_id = auth.uid() AND project_id = pid LIMIT 1;
    RETURN COALESCE(r, 'user'::user_role);
END; $$;

-- =============================================================
-- 7. ATIVAR RLS nas tabelas novas
-- =============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.project_members pm
   WHERE pm.user_id = auth.uid() AND pm.project_id = public.projects.id
));

DROP POLICY IF EXISTS project_members_select ON public.project_members;
CREATE POLICY project_members_select ON public.project_members FOR SELECT
USING (user_id = auth.uid());

-- =============================================================
-- 8. RECRIAR TODAS AS RLS DAS TABELAS DE NEGÓCIO AGORA COM project_id
--    (Dropa as antigas da migration 000000 e cria novas)
-- =============================================================

-- --- helpers ---
-- user_profiles
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_admin_all ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update ON public.user_profiles;

CREATE POLICY user_profiles_select ON public.user_profiles FOR SELECT
USING (
  auth.uid() = id
  OR (
    project_id IS NOT NULL AND public.is_project_member(project_id)
    AND public.get_project_role(project_id) = 'admin'
  )
  OR public.is_admin()
);

CREATE POLICY user_profiles_admin_all ON public.user_profiles
FOR ALL USING (public.is_admin());

CREATE POLICY user_profiles_self_update ON public.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- --- clients ---
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_admin_all ON public.clients;
DROP POLICY IF EXISTS clients_user_insert ON public.clients;
DROP POLICY IF EXISTS clients_user_update ON public.clients;

CREATE POLICY clients_select ON public.clients FOR SELECT
USING (public.is_project_member(project_id) AND (is_active = true OR public.get_project_role(project_id) = 'admin'));

CREATE POLICY clients_admin_all ON public.clients
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY clients_user_insert ON public.clients
FOR INSERT WITH CHECK (public.is_project_member(project_id));

CREATE POLICY clients_user_update ON public.clients
FOR UPDATE USING (public.is_project_member(project_id) AND is_active = true);

-- --- categories ---
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_admin_all ON public.categories;
DROP POLICY IF EXISTS categories_user_insert ON public.categories;
DROP POLICY IF EXISTS categories_user_update ON public.categories;

CREATE POLICY categories_select ON public.categories FOR SELECT
USING (public.is_project_member(project_id) AND (is_active = true OR public.get_project_role(project_id) = 'admin'));

CREATE POLICY categories_admin_all ON public.categories
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY categories_user_insert ON public.categories
FOR INSERT WITH CHECK (public.is_project_member(project_id));

CREATE POLICY categories_user_update ON public.categories
FOR UPDATE USING (public.is_project_member(project_id) AND is_active = true);

-- --- products ---
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_admin_all ON public.products;
DROP POLICY IF EXISTS products_user_insert ON public.products;
DROP POLICY IF EXISTS products_user_update ON public.products;

CREATE POLICY products_select ON public.products FOR SELECT
USING (public.is_project_member(project_id) AND (is_active = true OR public.get_project_role(project_id) = 'admin'));

CREATE POLICY products_admin_all ON public.products
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY products_user_insert ON public.products
FOR INSERT WITH CHECK (public.is_project_member(project_id));

CREATE POLICY products_user_update ON public.products
FOR UPDATE USING (public.is_project_member(project_id) AND is_active = true);

-- --- product_images ---
DROP POLICY IF EXISTS product_images_select ON public.product_images;
DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
DROP POLICY IF EXISTS product_images_user_all ON public.product_images;

CREATE POLICY product_images_select ON public.product_images FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY product_images_admin_all ON public.product_images
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY product_images_user_all ON public.product_images
FOR ALL USING (public.is_project_member(project_id));

-- --- stock_movements ---
DROP POLICY IF EXISTS stock_movements_select ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_admin_all ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_user_insert ON public.stock_movements;

CREATE POLICY stock_movements_select ON public.stock_movements FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY stock_movements_admin_all ON public.stock_movements
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY stock_movements_user_insert ON public.stock_movements
FOR INSERT WITH CHECK (public.is_project_member(project_id));

-- --- sales ---
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_admin_all ON public.sales;
DROP POLICY IF EXISTS sales_user_insert ON public.sales;
DROP POLICY IF EXISTS sales_user_update ON public.sales;

CREATE POLICY sales_select ON public.sales FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY sales_admin_all ON public.sales
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY sales_user_insert ON public.sales
FOR INSERT WITH CHECK (public.is_project_member(project_id));

CREATE POLICY sales_user_update ON public.sales
FOR UPDATE USING (public.is_project_member(project_id));

-- --- sale_items ---
DROP POLICY IF EXISTS sale_items_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_admin_all ON public.sale_items;
DROP POLICY IF EXISTS sale_items_user_all ON public.sale_items;

CREATE POLICY sale_items_select ON public.sale_items FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY sale_items_admin_all ON public.sale_items
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY sale_items_user_all ON public.sale_items
FOR ALL USING (public.is_project_member(project_id));

-- --- installments ---
DROP POLICY IF EXISTS installments_select ON public.installments;
DROP POLICY IF EXISTS installments_admin_all ON public.installments;
DROP POLICY IF EXISTS installments_user_insert ON public.installments;
DROP POLICY IF EXISTS installments_user_update ON public.installments;

CREATE POLICY installments_select ON public.installments FOR SELECT
USING (public.is_project_member(project_id));

CREATE POLICY installments_admin_all ON public.installments
FOR ALL USING (public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin');

CREATE POLICY installments_user_insert ON public.installments
FOR INSERT WITH CHECK (public.is_project_member(project_id));

CREATE POLICY installments_user_update ON public.installments
FOR UPDATE USING (public.is_project_member(project_id));

-- --- audit_logs ---
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_admin_all ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
USING (
  (project_id IS NOT NULL AND public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin')
  OR public.is_admin()
);

CREATE POLICY audit_logs_admin_all ON public.audit_logs
FOR ALL USING (
  (project_id IS NOT NULL AND public.is_project_member(project_id) AND public.get_project_role(project_id) = 'admin')
  OR public.is_admin()
);
