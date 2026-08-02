import type { Tables, Enums } from "@/types/supabase";

export type UserRole = Enums<"user_role">;
export type SaleStatus = Enums<"sale_status">;
export type InstallmentStatus = Enums<"installment_status">;
export type PaymentMethod = Enums<"payment_method">;
export type StockMovementType = Enums<"stock_movement_type">;

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  is_admin_role: boolean;
  is_active?: boolean;
  last_login?: string | null;
}

export interface Client extends Tables<"clients"> {
  purchase_history: PurchaseHistory[];
}

export interface PurchaseHistory {
  sale_id: string;
  status: SaleStatus;
  total_amount: string;
  created_at: string;
}

export interface Product extends Tables<"products"> {
  images: ProductImage[];
  movements: StockMovement[];
}

export interface ProductImage extends Tables<"product_images"> {
  image?: string;
}

export interface StockMovement extends Tables<"stock_movements"> {
  actor_name: string;
}

export interface Sale extends Tables<"sales"> {
  customer: string | null;
  customer_name: string | null;
  profit: string;
  items: SaleItem[];
  installments: Installment[];
}

export interface SaleItem extends Tables<"sale_items"> {
  product: string;
  product_name: string;
}

export interface Installment extends Tables<"installments"> {
  sale: string;
  is_overdue: boolean;
  customer_name?: string;
}

export type Category = Tables<"categories">;

export type Project = Tables<"projects">;
export type ProjectMember = Tables<"project_members">;

export interface DashboardSummary {
  total_revenue: string;
  total_cost: string;
  real_profit: string;
  monthly: MonthlyData[];
  overdue_count: number;
}

export interface MonthlyData {
  month: string;
  revenue: string;
  profit: string;
}

export interface OverdueInstallment {
  id: string;
  sale_id: string;
  customer: string;
  amount: string;
  due_date: string;
  days_overdue: number;
}

export interface SaleFormData {
  customer: string | null;
  first_due_date: string;
  installments_count: number;
  is_paid?: boolean;
  payment_method?: PaymentMethod;
  items: {
    product: string;
    quantity: number;
    sale_price: string;
    sale_price_display?: string;
  }[];
}

export interface PaymentData {
  amount_paid: string;
  payment_method: PaymentMethod;
}
