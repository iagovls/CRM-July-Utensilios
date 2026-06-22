import api from "./api";
import {
  Client,
  Product,
  Sale,
  Installment,
  Category,
  DashboardSummary,
  OverdueInstallment,
  SaleFormData,
  PaymentData,
} from "@/types";

export const clientService = {
  getAll: () => api.get<Client[]>("/api/clients/"),
  getById: (id: number) => api.get<Client>(`/api/clients/${id}/`),
  create: (data: Partial<Client>) => api.post<Client>("/api/clients/", data),
  update: (id: number, data: Partial<Client>) => api.patch<Client>(`/api/clients/${id}/`, data),
  delete: (id: number) => api.delete(`/api/clients/${id}/`),
};

export const productService = {
  getAll: () => api.get<Product[]>("/api/products/"),
  getById: (id: number) => api.get<Product>(`/api/products/${id}/`),
  create: (data: FormData) =>
    api.post<Product>("/api/products/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: FormData) =>
    api.patch<Product>(`/api/products/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: number) => api.delete(`/api/products/${id}/`),
};

export const saleService = {
  getAll: () => api.get<Sale[]>("/api/sales/"),
  getById: (id: number) => api.get<Sale>(`/api/sales/${id}/`),
  create: (data: SaleFormData) => api.post<Sale>("/api/sales/", data),
  cancel: (id: number) => api.post<Sale>(`/api/sales/${id}/cancel/`),
};

export const installmentService = {
  getAll: () => api.get<Installment[]>("/api/sales/installments/"),
  pay: (id: number, data: PaymentData) =>
    api.post(`/api/sales/installments/${id}/pay/`, data),
};

export const categoryService = {
  getAll: () => api.get<Category[]>("/api/categories/"),
  create: (data: { name: string }) => api.post<Category>("/api/categories/", data),
  update: (id: number, data: { name: string }) => api.patch<Category>(`/api/categories/${id}/`, data),
  delete: (id: number) => api.delete(`/api/categories/${id}/`),
};

export const dashboardService = {
  getSummary: (params?: { start_date?: string; end_date?: string }) =>
    api.get<DashboardSummary>("/api/dashboard/summary/", { params }),
  getOverdue: () => api.get<OverdueInstallment[]>("/api/dashboard/overdue/"),
};
