export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: "admin" | "user";
  is_admin_role: boolean;
  is_active?: boolean;
  last_login?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Client {
  id: number;
  name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  purchase_history: PurchaseHistory[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseHistory {
  sale_id: number;
  status: string;
  total_amount: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string | null;
  description: string | null;
  purchase_price: string | null;
  stock_quantity: number | null;
  category: string | null;
  is_active: boolean;
  images: ProductImage[];
  movements: StockMovement[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: number;
  image: string;
}

export interface StockMovement {
  id: number;
  movement_type: "entry" | "sale" | "reversal";
  quantity: number;
  notes: string;
  actor_name: string;
  created_at: string;
}

export interface Sale {
  id: number;
  customer: number | null;
  customer_name: string | null;
  status: "pending" | "paid" | "canceled";
  installments_count: number;
  first_due_date: string;
  total_amount: string;
  total_cost: string;
  profit: string;
  items: SaleItem[];
  installments: Installment[];
  created_at: string;
}

export interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  sale_price: string;
  purchase_price: string;
}

export interface Installment {
  id: number;
  sale: number;
  number: number;
  due_date: string;
  amount: string;
  paid_amount: string;
  status: "pending" | "paid";
  payment_method: "cash" | "card" | "pix" | "transfer" | "other";
  paid_at: string | null;
  is_overdue: boolean;
  customer_name?: string;
}

export interface Category {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  id: number;
  sale_id: number;
  customer: string;
  amount: string;
  due_date: string;
  days_overdue: number;
}

export interface SaleFormData {
  customer: number | null;
  first_due_date: string;
  installments_count: number;
  is_paid?: boolean;
  payment_method?: "cash" | "card" | "pix" | "transfer" | "other";
  items: {
    product: number;
    quantity: number;
    sale_price: string;
    sale_price_display?: string;
  }[];
}

export interface PaymentData {
  amount_paid: string;
  payment_method: "cash" | "card" | "pix" | "transfer" | "other";
}
