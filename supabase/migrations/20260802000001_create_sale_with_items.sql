-- Migration: create_sale_with_items function
-- Transactional RPC to create sale + items + installments + stock out movements

DROP FUNCTION IF EXISTS public.create_sale_with_items(jsonb);
DROP FUNCTION IF EXISTS public.create_sale_with_items(
  p_customer_id uuid,
  p_first_due_date date,
  p_installments_count integer,
  p_items text,
  p_is_paid boolean,
  p_payment_method payment_method
);

CREATE OR REPLACE FUNCTION public.create_sale_with_items(
  p_customer_id uuid DEFAULT NULL,
  p_first_due_date date DEFAULT CURRENT_DATE,
  p_installments_count integer DEFAULT 1,
  p_items text DEFAULT '[]',
  p_is_paid boolean DEFAULT false,
  p_payment_method payment_method DEFAULT 'other'::payment_method,
  p_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_items jsonb;
  v_total_amount numeric(12,2) := 0;
  v_total_cost numeric(12,2) := 0;
  v_current_user_id uuid := auth.uid();
  v_profile_id uuid;
  it jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_sale_price numeric(10,2);
  v_purchase_price numeric(10,2);
  v_product_stock integer;
  v_product_purchase numeric(10,2);
  v_installment_amount numeric(10,2);
  v_installment_remainder numeric(10,2);
  v_installment_status installment_status;
  i integer;
  v_project_id uuid;
BEGIN
  v_project_id := COALESCE(p_project_id, public._default_project_id());

  BEGIN
    v_items := p_items::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'p_items não é um JSON válido: %', p_items;
  END;

  IF jsonb_typeof(v_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items deve ser um array JSON';
  END IF;
  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'A venda precisa ter pelo menos 1 item';
  END IF;
  IF p_installments_count IS NULL OR p_installments_count < 1 THEN
    RAISE EXCEPTION 'Número de parcelas deve ser >= 1';
  END IF;
  IF p_first_due_date IS NULL THEN
    RAISE EXCEPTION 'Data de vencimento inicial inválida';
  END IF;

  SELECT id INTO v_profile_id FROM public.user_profiles WHERE id = v_current_user_id LIMIT 1;

  FOR it IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_product_id := (it->>'product_id')::uuid;
    IF v_product_id IS NULL THEN
      v_product_id := (it->>'product')::uuid;
    END IF;
    v_quantity := COALESCE((it->>'quantity')::integer, 0);
    v_sale_price := COALESCE((it->>'sale_price')::numeric, 0);

    IF v_product_id IS NULL OR v_quantity <= 0 OR v_sale_price <= 0 THEN
      RAISE EXCEPTION 'Item inválido: produto=%, qtde=%, preço=%', v_product_id, v_quantity, v_sale_price;
    END IF;

    SELECT COALESCE(stock_quantity, 0), COALESCE(purchase_price, 0)::numeric(10,2)
      INTO v_product_stock, v_product_purchase
      FROM public.products
     WHERE id = v_product_id AND is_active = true AND project_id = v_project_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % não encontrado ou inativo neste projeto', v_product_id;
    END IF;
    IF v_product_stock < v_quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para produto % (disp: %, necessária: %)', v_product_id, v_product_stock, v_quantity;
    END IF;

    v_purchase_price := v_product_purchase;
    v_total_amount := v_total_amount + (v_sale_price * v_quantity);
    v_total_cost := v_total_cost + (v_purchase_price * v_quantity);
  END LOOP;

  v_installment_status := CASE WHEN p_is_paid THEN 'paid'::installment_status ELSE 'pending'::installment_status END;

  INSERT INTO public.sales (
    customer_id,
    status,
    installments_count,
    first_due_date,
    total_amount,
    total_cost,
    created_by_id,
    project_id
  ) VALUES (
    p_customer_id,
    CASE WHEN p_is_paid THEN 'paid'::sale_status ELSE 'pending'::sale_status END,
    p_installments_count,
    p_first_due_date,
    v_total_amount,
    v_total_cost,
    v_profile_id,
    v_project_id
  ) RETURNING id INTO v_sale_id;

  FOR it IN SELECT * FROM jsonb_array_elements(v_items) LOOP
    v_product_id := (it->>'product_id')::uuid;
    IF v_product_id IS NULL THEN
      v_product_id := (it->>'product')::uuid;
    END IF;
    v_quantity := COALESCE((it->>'quantity')::integer, 0);
    v_sale_price := COALESCE((it->>'sale_price')::numeric, 0);

    SELECT COALESCE(purchase_price, 0)::numeric(10,2)
      INTO v_purchase_price
      FROM public.products WHERE id = v_product_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, sale_price, purchase_price, project_id)
    VALUES (v_sale_id, v_product_id, v_quantity, v_sale_price, v_purchase_price, v_project_id);

    UPDATE public.products
       SET stock_quantity = stock_quantity - v_quantity
     WHERE id = v_product_id;

    INSERT INTO public.stock_movements (product_id, movement_type, quantity, notes, actor_id, project_id)
    VALUES (
      v_product_id,
      'sale'::stock_movement_type,
      v_quantity,
      'Baixa automática - venda ' || v_sale_id::text,
      v_profile_id,
      v_project_id
    );
  END LOOP;

  v_installment_amount := trunc(v_total_amount / p_installments_count, 2);
  v_installment_remainder := v_total_amount - (v_installment_amount * p_installments_count);

  FOR i IN 1..p_installments_count LOOP
    DECLARE
      v_amt numeric(10,2);
      v_due date;
    BEGIN
      v_amt := v_installment_amount;
      IF i = p_installments_count THEN
        v_amt := v_amt + v_installment_remainder;
      END IF;
      v_due := p_first_due_date + ((i - 1) || ' month')::interval;
      INSERT INTO public.installments (
        sale_id, number, due_date, amount, status, payment_method, paid_at, paid_amount, project_id
      ) VALUES (
        v_sale_id,
        i,
        v_due,
        v_amt,
        v_installment_status,
        p_payment_method,
        CASE WHEN p_is_paid THEN now() ELSE NULL END,
        CASE WHEN p_is_paid THEN v_amt ELSE 0 END,
        v_project_id
      );
    END;
  END LOOP;

  RETURN v_sale_id;
END;
$$;

ALTER FUNCTION public.create_sale_with_items(uuid, date, integer, text, boolean, payment_method, uuid) OWNER TO postgres;

GRANT EXECUTE
  ON FUNCTION public.create_sale_with_items(uuid, date, integer, text, boolean, payment_method, uuid)
  TO authenticated;

GRANT EXECUTE
  ON FUNCTION public.create_sale_with_items(uuid, date, integer, text, boolean, payment_method, uuid)
  TO service_role;
