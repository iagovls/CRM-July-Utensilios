-- =============================================================
-- CRM July Utensilios - Schema Inicial
-- =============================================================

-- Extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- =============================================================
-- TYPES
-- =============================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE sale_status AS ENUM ('pending', 'paid', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE installment_status AS ENUM ('pending', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'pix', 'transfer', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_type AS ENUM ('entry', 'sale', 'reversal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
  r user_role;
BEGIN
  SELECT role INTO r FROM public.user_profiles WHERE id = auth.uid();
  IF r IS NULL THEN
    RETURN 'user'::user_role;
  END IF;
  RETURN r;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (public.get_current_user_role() = 'admin')
      OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
          AND COALESCE(raw_app_meta_data->>'role', '') = 'admin'
      );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================
-- 1. USER PROFILES (extensao de auth.users)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'user'::user_role,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar perfil automaticamente ao criar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_role user_role;
BEGIN
  new_role := COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'user'::user_role);
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, new_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migra usuarios existentes do auth.users para user_profiles
INSERT INTO public.user_profiles (id, role)
SELECT id,
  CASE
    WHEN raw_app_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 2. CLIENTS (Soft Delete)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    document text,
    email text,
    phone text,
    address text,
    is_active boolean NOT NULL DEFAULT true,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS clients_name_idx ON public.clients(name);
CREATE INDEX IF NOT EXISTS clients_document_idx ON public.clients(document);

-- =============================================================
-- 3. CATEGORIES (Soft Delete)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique ON public.categories(name) WHERE is_active = true;

-- =============================================================
-- 4. PRODUCTS (Soft Delete)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text,
    description text,
    purchase_price numeric(10,2),
    stock_quantity integer DEFAULT 0,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    category text,
    is_active boolean NOT NULL DEFAULT true,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS products_name_idx ON public.products(name);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);

-- =============================================================
-- 5. PRODUCT IMAGES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS product_images_updated_at ON public.product_images;
CREATE TRIGGER product_images_updated_at
BEFORE UPDATE ON public.product_images
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images(product_id);

-- =============================================================
-- 6. STOCK MOVEMENTS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    quantity integer NOT NULL,
    notes text NOT NULL DEFAULT '',
    actor_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS stock_movements_updated_at ON public.stock_movements;
CREATE TRIGGER stock_movements_updated_at
BEFORE UPDATE ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS stock_movements_product_id_idx ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS stock_movements_created_at_idx ON public.stock_movements(created_at DESC);

-- =============================================================
-- 7. SALES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    status sale_status NOT NULL DEFAULT 'pending'::sale_status,
    installments_count integer NOT NULL DEFAULT 1,
    first_due_date date NOT NULL,
    total_amount numeric(12,2) NOT NULL DEFAULT 0,
    total_cost numeric(12,2) NOT NULL DEFAULT 0,
    created_by_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS sales_updated_at ON public.sales;
CREATE TRIGGER sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS sales_status_idx ON public.sales(status);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales(created_at DESC);

-- =============================================================
-- 8. SALE ITEMS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    quantity integer NOT NULL,
    sale_price numeric(10,2) NOT NULL,
    purchase_price numeric(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON public.sale_items(product_id);

-- =============================================================
-- 9. INSTALLMENTS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.installments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    number integer NOT NULL,
    due_date date NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) NOT NULL DEFAULT 0,
    status installment_status NOT NULL DEFAULT 'pending'::installment_status,
    payment_method payment_method NOT NULL DEFAULT 'other'::payment_method,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT installments_sale_id_number_key UNIQUE (sale_id, number)
);

DROP TRIGGER IF EXISTS installments_updated_at ON public.installments;
CREATE TRIGGER installments_updated_at
BEFORE UPDATE ON public.installments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS installments_sale_id_idx ON public.installments(sale_id);
CREATE INDEX IF NOT EXISTS installments_status_idx ON public.installments(status);
CREATE INDEX IF NOT EXISTS installments_due_date_idx ON public.installments(due_date);

-- =============================================================
-- 10. AUDIT LOGS
-- =============================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    description text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS audit_logs_updated_at ON public.audit_logs;
CREATE TRIGGER audit_logs_updated_at
BEFORE UPDATE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity, entity_id);

-- =============================================================
-- TRIGGER: Auditoria
-- =============================================================

CREATE OR REPLACE FUNCTION public.insert_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    entity_id_val uuid;
    description_val text;
    new_id uuid;
    old_id uuid;
BEGIN
    IF TG_OP = 'INSERT' THEN
        new_id := NEW.id;
        entity_id_val := new_id;
        description_val := TG_OP || ' on ' || TG_TABLE_NAME;
    ELSIF TG_OP = 'DELETE' THEN
        old_id := OLD.id;
        entity_id_val := old_id;
        description_val := TG_OP || ' on ' || TG_TABLE_NAME;
    ELSE
        new_id := NEW.id;
        entity_id_val := new_id;
        description_val := TG_OP || ' on ' || TG_TABLE_NAME;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, description)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, entity_id_val, description_val);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS clients_audit ON public.clients;
CREATE TRIGGER clients_audit
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.insert_audit_log();

DROP TRIGGER IF EXISTS categories_audit ON public.categories;
CREATE TRIGGER categories_audit
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.insert_audit_log();

DROP TRIGGER IF EXISTS products_audit ON public.products;
CREATE TRIGGER products_audit
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.insert_audit_log();

DROP TRIGGER IF EXISTS sales_audit ON public.sales;
CREATE TRIGGER sales_audit
AFTER INSERT OR UPDATE OR DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.insert_audit_log();

DROP TRIGGER IF EXISTS sale_items_audit ON public.sale_items;
CREATE TRIGGER sale_items_audit
AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.insert_audit_log();

DROP TRIGGER IF EXISTS installments_audit ON public.installments;
CREATE TRIGGER installments_audit
AFTER INSERT OR UPDATE OR DELETE ON public.installments
FOR EACH ROW EXECUTE FUNCTION public.insert_audit_log();

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Remove politicas antigas se existirem
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_admin_all ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update ON public.user_profiles;
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS clients_admin_all ON public.clients;
DROP POLICY IF EXISTS clients_user_insert ON public.clients;
DROP POLICY IF EXISTS clients_user_update ON public.clients;
DROP POLICY IF EXISTS categories_select ON public.categories;
DROP POLICY IF EXISTS categories_admin_all ON public.categories;
DROP POLICY IF EXISTS categories_user_insert ON public.categories;
DROP POLICY IF EXISTS categories_user_update ON public.categories;
DROP POLICY IF EXISTS products_select ON public.products;
DROP POLICY IF EXISTS products_admin_all ON public.products;
DROP POLICY IF EXISTS products_user_insert ON public.products;
DROP POLICY IF EXISTS products_user_update ON public.products;
DROP POLICY IF EXISTS product_images_select ON public.product_images;
DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
DROP POLICY IF EXISTS product_images_user_all ON public.product_images;
DROP POLICY IF EXISTS stock_movements_select ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_admin_all ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_user_insert ON public.stock_movements;
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_admin_all ON public.sales;
DROP POLICY IF EXISTS sales_user_insert ON public.sales;
DROP POLICY IF EXISTS sales_user_update ON public.sales;
DROP POLICY IF EXISTS sale_items_select ON public.sale_items;
DROP POLICY IF EXISTS sale_items_admin_all ON public.sale_items;
DROP POLICY IF EXISTS sale_items_user_all ON public.sale_items;
DROP POLICY IF EXISTS installments_select ON public.installments;
DROP POLICY IF EXISTS installments_admin_all ON public.installments;
DROP POLICY IF EXISTS installments_user_insert ON public.installments;
DROP POLICY IF EXISTS installments_user_update ON public.installments;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_admin_all ON public.audit_logs;

-- =============================================================
-- POLITICAS RLS: Leitura
-- =============================================================

-- user_profiles: user ve o proprio; admin ve todos
CREATE POLICY user_profiles_select ON public.user_profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- Leitura geral: Autenticados leem ativos (admin leem inclusive deletados)
CREATE POLICY clients_select ON public.clients FOR SELECT
USING (auth.role() = 'authenticated' AND (is_active = true OR public.is_admin()));

CREATE POLICY categories_select ON public.categories FOR SELECT
USING (auth.role() = 'authenticated' AND (is_active = true OR public.is_admin()));

CREATE POLICY products_select ON public.products FOR SELECT
USING (auth.role() = 'authenticated' AND (is_active = true OR public.is_admin()));

CREATE POLICY product_images_select ON public.product_images FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY stock_movements_select ON public.stock_movements FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY sales_select ON public.sales FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY sale_items_select ON public.sale_items FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY installments_select ON public.installments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- =============================================================
-- POLITICAS RLS: Admin tem acesso total
-- =============================================================

CREATE POLICY user_profiles_admin_all ON public.user_profiles
FOR ALL USING (public.is_admin());

CREATE POLICY clients_admin_all ON public.clients
FOR ALL USING (public.is_admin());

CREATE POLICY categories_admin_all ON public.categories
FOR ALL USING (public.is_admin());

CREATE POLICY products_admin_all ON public.products
FOR ALL USING (public.is_admin());

CREATE POLICY product_images_admin_all ON public.product_images
FOR ALL USING (public.is_admin());

CREATE POLICY stock_movements_admin_all ON public.stock_movements
FOR ALL USING (public.is_admin());

CREATE POLICY sales_admin_all ON public.sales
FOR ALL USING (public.is_admin());

CREATE POLICY sale_items_admin_all ON public.sale_items
FOR ALL USING (public.is_admin());

CREATE POLICY installments_admin_all ON public.installments
FOR ALL USING (public.is_admin());

CREATE POLICY audit_logs_admin_all ON public.audit_logs
FOR ALL USING (public.is_admin());

-- =============================================================
-- POLITICAS RLS: User role (restrito)
-- =============================================================

-- User atualiza o proprio perfil
CREATE POLICY user_profiles_self_update ON public.user_profiles
FOR UPDATE USING (auth.uid() = id);

-- User insere/atualiza clientes (nao deleta)
CREATE POLICY clients_user_insert ON public.clients
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY clients_user_update ON public.clients
FOR UPDATE USING (auth.role() = 'authenticated' AND is_active = true);

-- User insere/atualiza categorias (nao deleta)
CREATE POLICY categories_user_insert ON public.categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY categories_user_update ON public.categories
FOR UPDATE USING (auth.role() = 'authenticated' AND is_active = true);

-- User insere/atualiza produtos (nao deleta)
CREATE POLICY products_user_insert ON public.products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY products_user_update ON public.products
FOR UPDATE USING (auth.role() = 'authenticated' AND is_active = true);

-- User gerencia imagens de produtos
CREATE POLICY product_images_user_all ON public.product_images
FOR ALL USING (auth.role() = 'authenticated');

-- User insere movimentacoes de estoque
CREATE POLICY stock_movements_user_insert ON public.stock_movements
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- User cria/atualiza vendas
CREATE POLICY sales_user_insert ON public.sales
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY sales_user_update ON public.sales
FOR UPDATE USING (auth.role() = 'authenticated');

-- User gerencia itens de venda
CREATE POLICY sale_items_user_all ON public.sale_items
FOR ALL USING (auth.role() = 'authenticated');

-- User cria/atualiza parcelas
CREATE POLICY installments_user_insert ON public.installments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY installments_user_update ON public.installments
FOR UPDATE USING (auth.role() = 'authenticated');
