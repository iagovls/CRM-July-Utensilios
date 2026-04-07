"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";

import { api, storageKeys } from "@/lib/api";
import {
  formatCurrency,
  formatCurrencyInput,
  formatDocument,
  formatPhone,
  normalizeCurrencyValue,
  validateDocument,
} from "@/lib/masks";

type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "admin" | "user";
};

type Client = {
  id: number;
  name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  purchase_history: { sale_id: number; status: string; total_amount: string; created_at: string }[];
};

type Product = {
  id: number;
  name: string | null;
  description: string | null;
  purchase_price: string | null;
  stock_quantity: number | null;
  category: string | null;
  images: { id: number; image: string }[];
  movements: { id: number; movement_type: string; quantity: number; notes: string; created_at: string }[];
};

type Category = {
  id: number;
  name: string;
};

type Installment = {
  id: number;
  number: number;
  due_date: string;
  amount: string;
  status: string;
  payment_method: string;
  paid_at: string | null;
  is_overdue: boolean;
};

type Sale = {
  id: number;
  customer: number | null;
  customer_name: string | null;
  status: string;
  installments_count: number;
  first_due_date: string;
  total_amount: string;
  total_cost: string;
  profit: string;
  items: {
    id: number;
    product: number;
    product_name: string;
    quantity: number;
    sale_price: string;
    purchase_price: string;
  }[];
  installments: Installment[];
  created_at: string;
};

type DashboardSummary = {
  total_revenue: string;
  total_cost: string;
  real_profit: string;
  overdue_count: number;
  monthly: { month: string; revenue: string; profit: string }[];
};

type OverdueInstallment = {
  id: number;
  sale_id: number;
  customer: string;
  amount: string;
  due_date: string;
  days_overdue: number;
};

type SaleDraftItem = {
  productId: string;
  quantity: string;
  salePrice: string;
};

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "products", label: "Produtos", icon: Boxes },
  { id: "categories", label: "Categorias", icon: Boxes },
  { id: "sales", label: "Vendas", icon: ShoppingCart },
] as const;

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400";
const buttonClass =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";
const cardClass = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";

const emptyClient = {
  id: null as number | null,
  name: "",
  document: "",
  email: "",
  phone: "",
  address: "",
};

const emptyProduct = {
  id: null as number | null,
  name: "",
  description: "",
  purchase_price: "",
  stock_quantity: "0",
  category: "",
};

const emptyCategory = {
  id: null as number | null,
  name: "",
};

const emptySaleForm = {
  customerId: "",
  installmentsCount: "1",
  firstDueDate: new Date().toISOString().slice(0, 10),
};

export function CRMApp() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [overdue, setOverdue] = useState<OverdueInstallment[]>([]);

  const [clientForm, setClientForm] = useState(emptyClient);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [productFiles, setProductFiles] = useState<FileList | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [saleDraftItem, setSaleDraftItem] = useState<SaleDraftItem>({
    productId: "",
    quantity: "1",
    salePrice: "",
  });
  const [saleItems, setSaleItems] = useState<SaleDraftItem[]>([]);
  const [paymentModal, setPaymentModal] = useState<Installment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");

  const documentIsValid = useMemo(
    () => validateDocument(clientForm.document),
    [clientForm.document],
  );
  const categoryOptions = useMemo(() => {
    const values = [...categories.map((category) => category.name), productForm.category];
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  }, [categories, productForm.category]);

  const visibleTabs = user?.role === "admin" ? tabs : tabs.filter((tab) => tab.id !== "dashboard");

  const hydrateFromStorage = () => {
    if (typeof window === "undefined") {
      return;
    }
    const storedUser = window.localStorage.getItem(storageKeys.user);
    const storedAccess = window.localStorage.getItem(storageKeys.access) ?? "";
    const storedRefresh = window.localStorage.getItem(storageKeys.refresh) ?? "";
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedAccess);
      setRefreshToken(storedRefresh);
    }
  };

  const persistSession = (nextUser: User, nextAccess: string, nextRefresh: string) => {
    window.localStorage.setItem(storageKeys.user, JSON.stringify(nextUser));
    window.localStorage.setItem(storageKeys.access, nextAccess);
    window.localStorage.setItem(storageKeys.refresh, nextRefresh);
    setUser(nextUser);
    setAccessToken(nextAccess);
    setRefreshToken(nextRefresh);
  };

  const clearSession = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKeys.user);
      window.localStorage.removeItem(storageKeys.access);
      window.localStorage.removeItem(storageKeys.refresh);
    }
    setUser(null);
    setAccessToken("");
    setRefreshToken("");
    setClients([]);
    setCategories([]);
    setProducts([]);
    setSales([]);
    setSummary(null);
    setOverdue([]);
  };

  const fetchBootstrap = async (currentUser = user) => {
    if (!currentUser) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [clientsResponse, categoriesResponse, productsResponse, salesResponse] = await Promise.all([
        api.get<Client[]>("/clients/"),
        api.get<Category[]>("/categories/"),
        api.get<Product[]>("/products/"),
        api.get<Sale[]>("/sales/"),
      ]);
      setClients(clientsResponse.data);
      setCategories(categoriesResponse.data);
      setProducts(productsResponse.data);
      setSales(salesResponse.data);

      if (currentUser.role === "admin") {
        const [summaryResponse, overdueResponse] = await Promise.all([
          api.get<DashboardSummary>("/dashboard/summary/"),
          api.get<OverdueInstallment[]>("/dashboard/overdue/"),
        ]);
        setSummary(summaryResponse.data);
        setOverdue(overdueResponse.data);
        setActiveTab((tab) => tab || "dashboard");
      } else {
        setActiveTab("clients");
      }
    } catch (requestError) {
      setError("Não foi possível carregar os dados do sistema.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateFromStorage();
  }, []);

  useEffect(() => {
    if (user && accessToken) {
      fetchBootstrap(user);
    }
  }, [user, accessToken]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/login/", loginData);
      persistSession(response.data.user, response.data.access, response.data.refresh);
    } catch {
      setError("Usuário ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post("/auth/logout/", { refresh: refreshToken });
      }
    } catch {
      undefined;
    } finally {
      clearSession();
    }
  };

  const saveClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (clientForm.document && !documentIsValid) {
      setError("CPF/CNPJ inválido.");
      return;
    }
    const payload = {
      name: clientForm.name || null,
      document: clientForm.document || null,
      email: clientForm.email || null,
      phone: clientForm.phone || null,
      address: clientForm.address || null,
    };
    try {
      if (clientForm.id) {
        await api.patch(`/clients/${clientForm.id}/`, payload);
      } else {
        await api.post("/clients/", payload);
      }
      setClientForm(emptyClient);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível salvar o cliente.");
    }
  };

  const editClient = (client: Client) => {
    setClientForm({
      id: client.id,
      name: client.name ?? "",
      document: client.document ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      address: client.address ?? "",
    });
    setActiveTab("clients");
  };

  const removeClient = async (clientId: number) => {
    if (!window.confirm("Deseja inativar este cliente?")) {
      return;
    }
    try {
      await api.delete(`/clients/${clientId}/`);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível inativar o cliente.");
    }
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("description", productForm.description);
    formData.append("purchase_price", normalizeCurrencyValue(productForm.purchase_price));
    formData.append("stock_quantity", productForm.stock_quantity || "0");
    formData.append("category", productForm.category);
    Array.from(productFiles ?? []).forEach((file) => formData.append("uploaded_images", file));

    try {
      if (productForm.id) {
        await api.patch(`/products/${productForm.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/products/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setProductForm(emptyProduct);
      setProductFiles(null);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível salvar o produto.");
    }
  };

  const editProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name ?? "",
      description: product.description ?? "",
      purchase_price: formatCurrencyInput(product.purchase_price ?? ""),
      stock_quantity: String(product.stock_quantity ?? 0),
      category: product.category ?? "",
    });
    setActiveTab("products");
  };

  const removeProduct = async (productId: number) => {
    if (!window.confirm("Deseja inativar este produto?")) {
      return;
    }
    try {
      await api.delete(`/products/${productId}/`);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível inativar o produto.");
    }
  };

  const addCategory = async () => {
    setCategoryForm(emptyCategory);
    setActiveTab("categories");
  };

  const saveCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = categoryForm.name.trim();
    const previousName = categories.find((category) => category.id === categoryForm.id)?.name ?? "";
    if (!normalizedName) {
      setError("Informe o nome da categoria.");
      return;
    }
    try {
      const response = categoryForm.id
        ? await api.patch<Category>(`/categories/${categoryForm.id}/`, { name: normalizedName })
        : await api.post<Category>("/categories/", { name: normalizedName });
      const savedCategory = response.data;
      setCategories((current) => {
        const nextCategories = current.filter((category) => category.id !== savedCategory.id);
        return [...nextCategories, savedCategory].sort((left, right) => left.name.localeCompare(right.name));
      });
      setProductForm((current) => {
        if (
          !current.category ||
          ![previousName.toLowerCase(), normalizedName.toLowerCase()].includes(current.category.toLowerCase())
        ) {
          return current;
        }
        return { ...current, category: savedCategory.name };
      });
      setCategoryForm(emptyCategory);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível salvar a categoria.");
    }
  };

  const editCategory = (category: Category) => {
    setCategoryForm({
      id: category.id,
      name: category.name,
    });
    setActiveTab("categories");
  };

  const removeCategory = async (category: Category) => {
    if (!window.confirm(`Deseja remover a categoria ${category.name}?`)) {
      return;
    }
    try {
      await api.delete(`/categories/${category.id}/`);
      setCategoryForm((current) => (current.id === category.id ? emptyCategory : current));
      setProductForm((current) =>
        current.category?.toLowerCase() === category.name.toLowerCase() ? { ...current, category: "" } : current,
      );
      await fetchBootstrap();
    } catch {
      setError("Não foi possível remover a categoria.");
    }
  };

  const addSaleItem = () => {
    if (!saleDraftItem.productId || !saleDraftItem.salePrice || !saleDraftItem.quantity) {
      setError("Preencha produto, quantidade e preço de venda.");
      return;
    }
    setSaleItems((current) => [
      ...current,
      {
        ...saleDraftItem,
        salePrice: normalizeCurrencyValue(saleDraftItem.salePrice),
      },
    ]);
    setSaleDraftItem({ productId: "", quantity: "1", salePrice: "" });
  };

  const saveSale = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!saleItems.length) {
      setError("Adicione pelo menos um item na venda.");
      return;
    }
    try {
      await api.post("/sales/", {
        customer: saleForm.customerId ? Number(saleForm.customerId) : null,
        installments_count: Number(saleForm.installmentsCount),
        first_due_date: saleForm.firstDueDate,
        items: saleItems.map((item) => ({
          product: Number(item.productId),
          quantity: Number(item.quantity),
          sale_price: normalizeCurrencyValue(item.salePrice),
        })),
      });
      setSaleForm(emptySaleForm);
      setSaleItems([]);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível registrar a venda.");
    }
  };

  const cancelSale = async (saleId: number) => {
    if (!window.confirm("Deseja cancelar esta venda e estornar o estoque?")) {
      return;
    }
    try {
      await api.post(`/sales/${saleId}/cancel/`);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível cancelar a venda.");
    }
  };

  const quickPay = async () => {
    if (!paymentModal) {
      return;
    }
    try {
      await api.post(`/sales/installments/${paymentModal.id}/pay/`, {
        payment_method: paymentMethod,
      });
      setPaymentModal(null);
      await fetchBootstrap();
    } catch {
      setError("Não foi possível dar baixa na parcela.");
    }
  };

  const pendingInstallments = sales.flatMap((sale) =>
    sale.installments
      .filter((installment) => installment.status === "pending")
      .map((installment) => ({ ...installment, saleId: sale.id, customer: sale.customer_name })),
  );

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] bg-slate-900 p-10 text-white shadow-2xl">
            <div className="mb-8 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-amber-300" />
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-300">CRM July Utensílios</p>
                <h1 className="text-3xl font-bold">Gestão completa de clientes, produtos e vendas</h1>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FeatureCard icon={Users} title="Clientes" text="Cadastro com histórico de compras, máscaras e validação de CPF/CNPJ." />
              <FeatureCard icon={PackagePlus} title="Produtos" text="Controle de estoque, fotos, custo e movimentações automáticas." />
              <FeatureCard icon={CircleDollarSign} title="Vendas" text="Parcelamento, baixa rápida e registro de método de pagamento." />
              <FeatureCard icon={BarChart3} title="Dashboard" text="Lucro real, histórico mensal e inadimplência para administradores." />
            </div>
          </div>
          <form onSubmit={handleLogin} className="rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900">Entrar</h2>
            <p className="mt-2 text-sm text-slate-500">Use o login JWT configurado pela API Django.</p>
            <div className="mt-8 grid gap-4">
              <input
                className={inputClass}
                placeholder="Usuário"
                value={loginData.username}
                onChange={(event) => setLoginData((current) => ({ ...current, username: event.target.value }))}
              />
              <input
                className={inputClass}
                type="password"
                placeholder="Senha"
                value={loginData.password}
                onChange={(event) => setLoginData((current) => ({ ...current, password: event.target.value }))}
              />
              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
              <button className={buttonClass} type="submit" disabled={loading}>
                {loading ? "Entrando..." : "Acessar sistema"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="w-full rounded-[2rem] bg-slate-900 p-6 text-white lg:max-w-xs">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">CRM July Utensílios</p>
            <h1 className="mt-2 text-2xl font-bold">Painel operacional</h1>
            <p className="mt-4 text-sm text-slate-300">
              {user.first_name || user.username} · {user.role === "admin" ? "Administrador" : "Usuário"}
            </p>
          </div>
          <div className="grid gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    activeTab === tab.id ? "bg-amber-300 text-slate-900" : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={handleLogout} className="mt-8 flex items-center gap-2 text-sm text-slate-300">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="rounded-[2rem] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Operação centralizada</h2>
                <p className="text-sm text-slate-500">
                  Clientes, estoque, vendas parceladas e visão financeira no mesmo fluxo.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetricCard icon={Users} label="Clientes" value={String(clients.length)} />
                <MetricCard icon={Boxes} label="Produtos" value={String(products.length)} />
                <MetricCard icon={ShoppingCart} label="Vendas" value={String(sales.length)} />
                <MetricCard
                  icon={CreditCard}
                  label="Parcelas pendentes"
                  value={String(pendingInstallments.length)}
                />
              </div>
            </div>
            {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}
            {loading ? <p className="mt-4 text-sm text-slate-500">Atualizando dados...</p> : null}
          </header>

          {activeTab === "dashboard" && user.role === "admin" ? (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className={`${cardClass} grid gap-4 md:grid-cols-3`}>
                  <HighlightCard title="Faturamento" value={formatCurrency(summary?.total_revenue ?? 0)} />
                  <HighlightCard title="Custo" value={formatCurrency(summary?.total_cost ?? 0)} />
                  <HighlightCard title="Lucro real" value={formatCurrency(summary?.real_profit ?? 0)} />
                </div>
                <div className={cardClass}>
                  <h3 className="text-lg font-bold">Histórico mensal</h3>
                  <div className="mt-4 space-y-3">
                    {summary?.monthly.length ? (
                      summary.monthly.map((item) => (
                        <div key={item.month} className="rounded-2xl bg-slate-50 p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{item.month}</span>
                            <span className="text-sm text-slate-500">Lucro {formatCurrency(item.profit)}</span>
                          </div>
                          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-amber-400"
                              style={{
                                width: `${Math.min(100, Number(item.revenue) / Math.max(Number(summary.total_revenue || 1), 1) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-2 text-sm text-slate-500">Faturamento {formatCurrency(item.revenue)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Cadastre vendas para visualizar o histórico mensal.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className={cardClass}>
                  <h3 className="text-lg font-bold">Inadimplência</h3>
                  <p className="mt-1 text-sm text-slate-500">{summary?.overdue_count ?? 0} parcelas vencidas</p>
                  <div className="mt-4 space-y-3">
                    {overdue.length ? (
                      overdue.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold">{item.customer}</p>
                              <p className="text-sm text-slate-500">Venda #{item.sale_id}</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600">
                              {item.days_overdue} dias
                            </span>
                          </div>
                          <p className="mt-2 text-sm">Valor {formatCurrency(item.amount)}</p>
                          <p className="text-sm text-slate-500">Vencimento {item.due_date}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Nenhuma parcela vencida no momento.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === "clients" ? (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={saveClient} className={cardClass}>
                <h3 className="text-lg font-bold">{clientForm.id ? "Editar cliente" : "Novo cliente"}</h3>
                <div className="mt-4 grid gap-4">
                  <input
                    className={inputClass}
                    placeholder="Nome"
                    value={clientForm.name}
                    onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <div>
                    <input
                      className={inputClass}
                      placeholder="CPF ou CNPJ"
                      value={clientForm.document}
                      onChange={(event) =>
                        setClientForm((current) => ({ ...current, document: formatDocument(event.target.value) }))
                      }
                    />
                    {clientForm.document && !documentIsValid ? (
                      <p className="mt-2 text-sm text-rose-600">CPF/CNPJ inválido.</p>
                    ) : null}
                  </div>
                  <input
                    className={inputClass}
                    placeholder="E-mail"
                    type="email"
                    value={clientForm.email}
                    onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))}
                  />
                  <input
                    className={inputClass}
                    placeholder="Telefone"
                    value={clientForm.phone}
                    onChange={(event) =>
                      setClientForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))
                    }
                  />
                  <textarea
                    className={`${inputClass} min-h-28`}
                    placeholder="Endereço completo"
                    value={clientForm.address}
                    onChange={(event) => setClientForm((current) => ({ ...current, address: event.target.value }))}
                  />
                  <div className="flex gap-3">
                    <button type="submit" className={buttonClass}>
                      {clientForm.id ? "Atualizar cliente" : "Cadastrar cliente"}
                    </button>
                    {clientForm.id ? (
                      <button type="button" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" onClick={() => setClientForm(emptyClient)}>
                        Limpar
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
              <div className={`${cardClass} space-y-4`}>
                <h3 className="text-lg font-bold">Base de clientes</h3>
                {clients.length ? (
                  clients.map((client) => (
                    <div key={client.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold">{client.name || "Cliente sem nome"}</p>
                          <p className="text-sm text-slate-500">{client.document || "Sem documento"}</p>
                          <p className="text-sm text-slate-500">{client.phone || "Sem telefone"}</p>
                          <p className="mt-2 text-sm text-slate-500">{client.address || "Sem endereço"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" onClick={() => editClient(client)}>
                            Editar
                          </button>
                          {user.role === "admin" ? (
                            <button
                              type="button"
                              className="rounded-2xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                              onClick={() => removeClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold">Últimas compras</p>
                        {client.purchase_history.length ? (
                          <div className="mt-2 space-y-2">
                            {client.purchase_history.map((history) => (
                              <p key={history.sale_id} className="text-sm text-slate-500">
                                Venda #{history.sale_id} · {history.status} · {formatCurrency(history.total_amount)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">Sem compras registradas.</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhum cliente cadastrado.</p>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "products" ? (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={saveProduct} className={cardClass}>
                <h3 className="text-lg font-bold">{productForm.id ? "Editar produto" : "Novo produto"}</h3>
                <div className="mt-4 grid gap-4">
                  <input
                    className={inputClass}
                    placeholder="Nome"
                    value={productForm.name}
                    onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <textarea
                    className={`${inputClass} min-h-28`}
                    placeholder="Descrição"
                    value={productForm.description}
                    onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                  />
                  <input
                    className={inputClass}
                    type="text"
                    inputMode="numeric"
                    placeholder="Preço de compra"
                    value={productForm.purchase_price}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        purchase_price: formatCurrencyInput(event.target.value),
                      }))
                    }
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Quantidade</p>
                    <input
                      className={inputClass}
                      type="number"
                      placeholder="Quantidade em estoque"
                      value={productForm.stock_quantity}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, stock_quantity: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Categoria</p>
                    <div className="flex gap-3">
                      <select
                        className={inputClass}
                        value={productForm.category}
                        onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" onClick={addCategory}>
                        Gerenciar categorias
                      </button>
                    </div>
                  </div>
                  <label className="relative flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition hover:border-amber-400 hover:text-slate-900">
                    <span>Adicionar imagem</span>
                    <input
                      className="absolute inset-0 cursor-pointer opacity-0"
                      type="file"
                      multiple
                      aria-label="Adicionar imagem"
                      onChange={(event) => setProductFiles(event.target.files)}
                    />
                  </label>
                  <div className="flex gap-3">
                    <button type="submit" className={buttonClass}>
                      {productForm.id ? "Atualizar produto" : "Cadastrar produto"}
                    </button>
                    {productForm.id ? (
                      <button type="button" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" onClick={() => setProductForm(emptyProduct)}>
                        Limpar
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
              <div className={`${cardClass} space-y-4`}>
                <h3 className="text-lg font-bold">Catálogo e estoque</h3>
                {products.length ? (
                  products.map((product) => (
                    <div key={product.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                        <div>
                          <p className="font-semibold">{product.name || "Produto sem nome"}</p>
                          <p className="text-sm text-slate-500">{product.category || "Sem categoria"}</p>
                          <p className="mt-2 text-sm text-slate-500">Estoque atual: {product.stock_quantity ?? 0}</p>
                          <p className="text-sm text-slate-500">
                            Custo: {formatCurrency(product.purchase_price ?? 0)}
                          </p>
                          <p className="mt-2 text-sm text-slate-500">{product.description || "Sem descrição"}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" onClick={() => editProduct(product)}>
                            Editar
                          </button>
                          {user.role === "admin" ? (
                            <button
                              type="button"
                              className="rounded-2xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                              onClick={() => removeProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {product.movements.length ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                          <p className="text-sm font-semibold">Movimentações recentes</p>
                          <div className="mt-2 space-y-1">
                            {product.movements.slice(0, 3).map((movement) => (
                              <p key={movement.id} className="text-sm text-slate-500">
                                {movement.movement_type} · {movement.quantity} · {movement.notes}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhum produto cadastrado.</p>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "categories" ? (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={saveCategory} className={cardClass}>
                <h3 className="text-lg font-bold">{categoryForm.id ? "Editar categoria" : "Nova categoria"}</h3>
                <div className="mt-4 grid gap-4">
                  <input
                    className={inputClass}
                    placeholder="Nome da categoria"
                    value={categoryForm.name}
                    onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <div className="flex gap-3">
                    <button type="submit" className={buttonClass}>
                      {categoryForm.id ? "Atualizar categoria" : "Cadastrar categoria"}
                    </button>
                    {categoryForm.id ? (
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                        onClick={() => setCategoryForm(emptyCategory)}
                      >
                        Limpar
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
              <div className={`${cardClass} space-y-4`}>
                <div>
                  <h3 className="text-lg font-bold">Gestão de categorias</h3>
                  <p className="mt-1 text-sm text-slate-500">Cadastre, edite ou remova categorias usadas nos produtos.</p>
                </div>
                {categories.length ? (
                  categories.map((category) => (
                    <div key={category.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{category.name}</p>
                          <p className="text-sm text-slate-500">
                            {products.filter((product) => product.category?.toLowerCase() === category.name.toLowerCase()).length} produto(s)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                            onClick={() => editCategory(category)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                            onClick={() => removeCategory(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma categoria cadastrada.</p>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "sales" ? (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <form onSubmit={saveSale} className={cardClass}>
                  <h3 className="text-lg font-bold">Registrar venda</h3>
                  <div className="mt-4 grid gap-4">
                    <select
                      className={inputClass}
                      value={saleForm.customerId}
                      onChange={(event) => setSaleForm((current) => ({ ...current, customerId: event.target.value }))}
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name || `Cliente ${client.id}`}
                        </option>
                      ))}
                    </select>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <select
                          className={inputClass}
                          value={saleDraftItem.productId}
                          onChange={(event) =>
                            setSaleDraftItem((current) => ({ ...current, productId: event.target.value }))
                          }
                        >
                          <option value="">Produto</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name || `Produto ${product.id}`}
                            </option>
                          ))}
                        </select>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-700">Quantidade</p>
                          <input
                            className={inputClass}
                            type="number"
                            placeholder="Quantidade"
                            value={saleDraftItem.quantity}
                            onChange={(event) =>
                              setSaleDraftItem((current) => ({ ...current, quantity: event.target.value }))
                            }
                          />
                        </div>
                        <input
                          className={inputClass}
                          type="text"
                          inputMode="numeric"
                          placeholder="Preço de venda"
                          value={saleDraftItem.salePrice}
                          onChange={(event) =>
                            setSaleDraftItem((current) => ({
                              ...current,
                              salePrice: formatCurrencyInput(event.target.value),
                            }))
                          }
                        />
                      </div>
                      <button type="button" className={`${buttonClass} mt-3`} onClick={addSaleItem}>
                        Adicionar item
                      </button>
                      <div className="mt-3 space-y-2">
                        {saleItems.map((item, index) => (
                          <div key={`${item.productId}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                            Produto #{item.productId} · Qtd {item.quantity} · Venda {formatCurrency(item.salePrice)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">Parcelas</p>
                        <input
                          className={inputClass}
                          type="number"
                          min="1"
                          placeholder="Número de parcelas"
                          value={saleForm.installmentsCount}
                          onChange={(event) =>
                            setSaleForm((current) => ({ ...current, installmentsCount: event.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-700">Data da primeira parcela</p>
                        <input
                          className={inputClass}
                          type="date"
                          value={saleForm.firstDueDate}
                          onChange={(event) =>
                            setSaleForm((current) => ({ ...current, firstDueDate: event.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <button type="submit" className={buttonClass}>
                      Registrar venda
                    </button>
                  </div>
                </form>

                <div className={cardClass}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Baixa rápida</h3>
                      <p className="text-sm text-slate-500">Marque parcelas pagas com um clique.</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {pendingInstallments.length} pendentes
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {pendingInstallments.slice(0, 6).map((installment) => (
                      <button
                        key={installment.id}
                        type="button"
                        onClick={() => setPaymentModal(installment)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left"
                      >
                        <div>
                          <p className="font-semibold">{installment.customer || "Sem cliente"}</p>
                          <p className="text-sm text-slate-500">
                            Venda #{installment.saleId} · Parcela {installment.number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(installment.amount)}</p>
                          <p className={`text-sm ${installment.is_overdue ? "text-rose-600" : "text-slate-500"}`}>
                            {installment.due_date}
                          </p>
                        </div>
                      </button>
                    ))}
                    {!pendingInstallments.length ? <p className="text-sm text-slate-500">Sem parcelas pendentes.</p> : null}
                  </div>
                </div>
              </div>

              <div className={`${cardClass} space-y-4`}>
                <h3 className="text-lg font-bold">Histórico de vendas</h3>
                {sales.length ? (
                  sales.map((sale) => (
                    <div key={sale.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                        <div>
                          <p className="font-semibold">Venda #{sale.id}</p>
                          <p className="text-sm text-slate-500">{sale.customer_name || "Sem cliente"}</p>
                          <p className="mt-2 text-sm text-slate-500">
                            Total {formatCurrency(sale.total_amount)} · Lucro {formatCurrency(sale.profit)}
                          </p>
                          <p className="text-sm text-slate-500">
                            Status: <span className="font-semibold capitalize">{sale.status}</span>
                          </p>
                        </div>
                        {user.role === "admin" && sale.status !== "canceled" ? (
                          <button
                            type="button"
                            onClick={() => cancelSale(sale.id)}
                            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm text-rose-600"
                          >
                            Cancelar venda
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold">Itens</p>
                        <div className="mt-2 space-y-1">
                          {sale.items.map((item) => (
                            <p key={item.id} className="text-sm text-slate-500">
                              {item.product_name} · {item.quantity} un · {formatCurrency(item.sale_price)}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-semibold">Parcelas</p>
                        <div className="mt-2 grid gap-2">
                          {sale.installments.map((installment) => (
                            <div key={installment.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
                              <span>
                                {installment.number}ª parcela · {installment.due_date}
                              </span>
                              <span className={installment.status === "paid" ? "text-emerald-600" : "text-slate-500"}>
                                {installment.status === "paid" ? "Paga" : "Pendente"} · {formatCurrency(installment.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma venda registrada.</p>
                )}
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {paymentModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Dar baixa na parcela</h3>
            <p className="mt-2 text-sm text-slate-500">
              Parcela {paymentModal.number} · Vencimento {paymentModal.due_date} · {formatCurrency(paymentModal.amount)}
            </p>
            <select
              className={`${inputClass} mt-4`}
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
              <option value="pix">Pix</option>
              <option value="transfer">Transferência</option>
              <option value="other">Outro</option>
            </select>
            <div className="mt-6 flex gap-3">
              <button type="button" className={buttonClass} onClick={quickPay}>
                Confirmar pagamento
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                onClick={() => setPaymentModal(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Users;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white/8 p-5">
      <Icon className="h-6 w-6 text-amber-300" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-300">{text}</p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-amber-600" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function HighlightCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
