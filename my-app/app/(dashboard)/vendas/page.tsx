"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, CreditCard, XCircle, Banknote, History, Eye } from "lucide-react";
import TopBar from "@/components/TopBar";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input, { Select } from "@/components/Input";
import KPICard from "@/components/KPICard";
import { saleService, installmentService, clientService, productService } from "@/lib/services";
import { Sale, Installment, Client, Product, SaleFormData } from "@/types";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isViewSaleOpen, setIsViewSaleOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pix" | "transfer" | "other">("cash");
  const [formData, setFormData] = useState<SaleFormData>({
    customer: null,
    first_due_date: new Date().toISOString().split("T")[0],
    installments_count: 1,
    items: [{ product: 0, quantity: 1, sale_price: "" }],
  });
  const [saleType, setSaleType] = useState<"vista" | "prazo">("vista");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"vendas" | "parcelas" | "historico">("vendas");

  const fetchData = useCallback(async () => {
    try {
      const [salesRes, installmentsRes, clientsRes, productsRes] = await Promise.all([
        saleService.getAll(),
        installmentService.getAll(),
        clientService.getAll(),
        productService.getAll(),
      ]);
      setSales(salesRes.data);
      setInstallments(installmentsRes.data);
      setClients(clientsRes.data.filter((c) => c.is_active));
      setProducts(productsRes.data.filter((p) => p.is_active && (p.stock_quantity ?? 0) > 0));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSales = sales.filter(
    (sale) =>
      sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(sale.id).includes(searchQuery)
  );

  const pendingInstallments = installments.filter((i) => i.status === "pending");
  const paidInstallments = installments.filter((i) => i.status === "paid");
  const overdueInstallments = pendingInstallments.filter((i) => i.is_overdue);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: 0, quantity: 1, sale_price: "" }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const formatCurrencyInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return "";
    const number = parseInt(cleaned) / 100;
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseCurrencyInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) return "0";
    return (parseInt(cleaned) / 100).toFixed(2);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];

    if (field === "sale_price_display") {
      newItems[index] = {
        ...newItems[index],
        sale_price: parseCurrencyInput(value as string),
        sale_price_display: formatCurrencyInput(value as string),
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };

      if (field === "product") {
        const product = products.find((p) => p.id === Number(value));
        if (product) {
          const priceDisplay = formatCurrencyInput(
            ((parseFloat(product.purchase_price || "0") || 0) * 1.3).toFixed(2).replace(".", "")
          );
          newItems[index] = {
            ...newItems[index],
            sale_price: ((parseFloat(product.purchase_price || "0") || 0) * 1.3).toFixed(2),
            sale_price_display: priceDisplay,
          };
        }
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleOpenNewSale = () => {
    setFormData({
      customer: null,
      first_due_date: new Date().toISOString().split("T")[0],
      installments_count: 1,
      items: [{ product: 0, quantity: 1, sale_price: "", sale_price_display: "" }],
    });
    setSaleType("vista");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalData = {
        ...formData,
        installments_count: saleType === "vista" ? 1 : formData.installments_count,
        is_paid: saleType === "vista",
        payment_method: saleType === "vista" ? paymentMethod : undefined,
      };
      const validItems = finalData.items.filter((item) => item.product > 0 && item.quantity > 0);
      await saleService.create({ ...finalData, items: validItems });
      await fetchData();
      setIsModalOpen(false);
      if (saleType === "vista") {
        setActiveTab("historico");
      }
    } catch (error) {
      console.error("Error creating sale:", error);
      alert("Erro ao criar venda. Verifique o estoque dos produtos.");
    } finally {
      setSaving(false);
    }
  };

  const handlePayInstallment = async () => {
    if (!selectedInstallment) return;
    setSaving(true);
    try {
      await installmentService.pay(selectedInstallment.id, {
        amount_paid: String(selectedInstallment.amount),
        payment_method: paymentMethod,
      });
      await fetchData();
      setIsPayModalOpen(false);
      setSelectedInstallment(null);
      setPaymentMethod("cash");
    } catch (error) {
      console.error("Error paying installment:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleInstallmentClick = (installment: Installment) => {
    if (installment.status === "pending") {
      setSelectedInstallment(installment);
      setIsPayModalOpen(true);
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewSaleOpen(true);
  };

  const totalPending = pendingInstallments.reduce((sum, i) => sum + parseFloat(String(i.amount)), 0);
  const totalOverdue = overdueInstallments.reduce((sum, i) => sum + parseFloat(String(i.amount)), 0);

  const totalAmount = formData.items.reduce((sum, item) => {
    return sum + parseFloat(item.sale_price || "0") * item.quantity;
  }, 0);

  return (
    <div className="clip rounded-[32px] bg-white p-4 md:p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Vendas"
        subtitle="Registro de pedidos, parcelas e status de pagamento."
        showNewSale={false}
        onSearch={setSearchQuery}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Vendas realizadas"
          value={String(sales.length)}
          note="Total de vendas"
          highlight
        />
        <KPICard
          label="Em aberto"
          value={formatCurrency(totalPending)}
          note={`${pendingInstallments.length} parcelas`}
        />
        <KPICard
          label="Em atraso"
          value={formatCurrency(totalOverdue)}
          note={`${overdueInstallments.length} parcelas`}
        />
        <KPICard
          label="Recebido"
          value={formatCurrency(
            paidInstallments.reduce((sum, i) => sum + parseFloat(String(i.amount)), 0)
          )}
          note={`${paidInstallments.length} parcelas`}
        />
      </div>

      <div className="flex gap-2 border-b border-[#E8E1DF] pb-2">
        <button
          onClick={() => setActiveTab("vendas")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "vendas"
              ? "bg-[#FFDAD8] text-[#2A2933]"
              : "text-[#616167] hover:bg-[#F8F6F4]"
          }`}
        >
          Vendas
        </button>
        <button
          onClick={() => setActiveTab("parcelas")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "parcelas"
              ? "bg-[#FFDAD8] text-[#2A2933]"
              : "text-[#616167] hover:bg-[#F8F6F4]"
          }`}
        >
          Parcelas em aberto
          {pendingInstallments.length > 0 && (
            <span className="ml-2 bg-[#C23A2E] text-white text-xs px-2 py-0.5 rounded-full">
              {pendingInstallments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "historico"
              ? "bg-[#FFDAD8] text-[#2A2933]"
              : "text-[#616167] hover:bg-[#F8F6F4]"
          }`}
        >
          <History className="w-4 h-4 inline mr-1" />
          Histórico
        </button>
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-4 md:p-6 flex flex-col gap-4 overflow-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Carregando...
          </div>
        ) : activeTab === "vendas" ? (
          <>
            <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
              Vendas recentes
            </h2>
            {filteredSales.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[#616167]">
                Nenhuma venda encontrada.
              </div>
            ) : (
              filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleViewSale(sale)}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
                      #{sale.id} - {sale.customer_name || "Sem cliente"}
                    </span>
                    <span className="text-[#616167] text-xs font-normal">
                      {sale.items.length} item(s) - {sale.installments_count}x
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#2A2933] text-lg font-bold font-['Inter']">
                      {formatCurrency(sale.total_amount)}
                    </span>
                    <span
                      className="text-sm font-semibold font-['Inter'] px-2 py-1 rounded-full"
                      style={{
                        color: "white",
                        backgroundColor: getStatusColor(sale.status),
                      }}
                    >
                      {sale.status === "paid"
                        ? "Paga"
                        : sale.status === "pending"
                        ? "Pendente"
                        : "Cancelada"}
                    </span>
                    <Eye className="w-5 h-5 text-[#939399]" />
                  </div>
                </div>
              ))
            )}
          </>
        ) : activeTab === "parcelas" ? (
          <>
            <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
              Parcelas em aberto
            </h2>
            {pendingInstallments.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[#616167]">
                Nenhuma parcela em aberto! 🎉
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingInstallments.map((inst) => (
                  <div
                    key={inst.id}
                    onClick={() => handleInstallmentClick(inst)}
                    className={`bg-white rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                      inst.is_overdue
                        ? "border-l-4 border-[#C23A2E]"
                        : "border-l-4 border-[#008A4E]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#2A2933] text-sm font-semibold">
                        {inst.customer_name || "Sem cliente"}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: getStatusColor(inst.is_overdue ? "canceled" : inst.status) }}
                      >
                        {formatCurrency(inst.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[#616167] text-xs font-medium">
                        #{inst.number} - Venda {inst.sale}
                      </span>
                      {inst.is_overdue ? (
                        <span className="text-[#C23A2E] text-[10px] font-bold uppercase tracking-wider">Em atraso</span>
                      ) : (
                        <span className="text-[#939399] text-[10px] font-bold uppercase tracking-wider">Pendente</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F8F6F4]">
                      <span className="text-[#616167] text-xs">
                        Venc: {formatDate(inst.due_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
              Histórico de vendas finalizadas
            </h2>
            {paidInstallments.length === 0 && sales.filter(s => s.status !== "pending").length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[#616167]">
                Nenhum registro encontrado.
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-auto">
                {sales
                  .filter((sale) => sale.status !== "pending")
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between bg-white rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => handleViewSale(sale)}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
                          #{sale.id} - {sale.customer_name || "Sem cliente"}
                        </span>
                        <span className="text-[#616167] text-xs">
                          {formatDate(sale.created_at)} - {sale.installments_count}x
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[#2A2933] font-bold">
                          {formatCurrency(sale.total_amount)}
                        </span>
                        <span
                          className="text-sm font-semibold px-2 py-1 rounded-full"
                          style={{
                            color: "white",
                            backgroundColor: getStatusColor(sale.status),
                          }}
                        >
                          {sale.status === "paid" ? "Paga" : "Cancelada"}
                        </span>
                        <Eye className="w-5 h-5 text-[#939399]" />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      <Button className="self-end" onClick={handleOpenNewSale}>
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova venda
        </div>
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Venda"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Cliente"
            value={formData.customer || ""}
            onChange={(e) => setFormData({ ...formData, customer: Number(e.target.value) || null })}
            options={[
              { value: "", label: "Selecione um cliente" },
              ...clients.map((c) => ({ value: String(c.id), label: c.name || `Cliente ${c.id}` })),
            ]}
          />

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setSaleType("vista")}
              className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-2 transition-all ${
                saleType === "vista"
                  ? "bg-[#FFDAD8] border-2 border-[#2A2933]"
                  : "bg-[#F8F6F4] border-2 border-transparent hover:bg-[#E8E1DF]"
              }`}
            >
              <Banknote className={`w-5 h-5 ${saleType === "vista" ? "text-[#2A2933]" : "text-[#616167]"}`} />
              <span className={`font-semibold ${saleType === "vista" ? "text-[#2A2933]" : "text-[#616167]"}`}>
                À vista
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSaleType("prazo")}
              className={`flex-1 h-14 rounded-xl flex items-center justify-center gap-2 transition-all ${
                saleType === "prazo"
                  ? "bg-[#FFDAD8] border-2 border-[#2A2933]"
                  : "bg-[#F8F6F4] border-2 border-transparent hover:bg-[#E8E1DF]"
              }`}
            >
              <CreditCard className={`w-5 h-5 ${saleType === "prazo" ? "text-[#2A2933]" : "text-[#616167]"}`} />
              <span className={`font-semibold ${saleType === "prazo" ? "text-[#2A2933]" : "text-[#616167]"}`}>
                À prazo
              </span>
            </button>
          </div>

          {saleType === "prazo" && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data da primeira parcela"
                type="date"
                value={formData.first_due_date}
                onChange={(e) => setFormData({ ...formData, first_due_date: e.target.value })}
              />
              <Input
                label="Número de parcelas"
                type="number"
                min="2"
                max="12"
                value={formData.installments_count}
                onChange={(e) =>
                  setFormData({ ...formData, installments_count: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[#2A2933] text-sm font-medium">Itens</label>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_120px_40px] gap-2 text-xs text-[#939399] font-medium px-1">
                <span>Produto</span>
                <span>Quantidade</span>
                <span>Preço</span>
                <span></span>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_80px_120px_40px] gap-2 items-center">
                  <Select
                    value={item.product.toString()}
                    onChange={(e) => handleItemChange(index, "product", e.target.value)}
                    options={[
                      { value: "0", label: "Selecione" },
                      ...products.map((p) => ({
                        value: String(p.id),
                        label: `${p.name} (${p.stock_quantity} un.)`,
                      })),
                    ]}
                  />
                  <div>
                    <label className="text-[10px] text-[#939399] block mb-1">Qtd</label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#939399] block mb-1">Preço (R$)</label>
                    <Input
                      value={(item as { sale_price_display?: string }).sale_price_display || ""}
                      onChange={(e) => handleItemChange(index, "sale_price_display", e.target.value)}
                      placeholder="0,00"
                      className="h-10 text-sm"
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-5"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center -mb-2">
            <Button size="sm" variant="secondary" onClick={handleAddItem} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar item
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F8F6F4] rounded-xl">
            <span className="text-[#2A2933] font-semibold">Total:</span>
            <span className="text-[#2A2933] text-xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>

          {saleType === "vista" && (
            <Select
              label="Forma de pagamento"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              options={[
                { value: "cash", label: "Dinheiro" },
                { value: "pix", label: "Pix" },
                { value: "card", label: "Cartão" },
                { value: "transfer", label: "Transferência" },
                { value: "other", label: "Outro" },
              ]}
            />
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : saleType === "vista" ? "Finalizar venda" : "Gerar parcelas"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPayModalOpen}
        onClose={() => {
          setIsPayModalOpen(false);
          setSelectedInstallment(null);
        }}
        title="Baixa de Parcela"
      >
        <div className="flex flex-col gap-4">
          {selectedInstallment && (
            <div className="p-4 bg-[#F8F6F4] rounded-xl">
              <p className="text-[#2A2933]">
                Parcela <strong>#{selectedInstallment.number}</strong> - Venda {selectedInstallment.sale}
              </p>
              <p className="text-[#2A2933] text-2xl font-bold mt-2">
                {formatCurrency(selectedInstallment.amount)}
              </p>
              <p className="text-[#616167] text-sm">
                Vencimento: {formatDate(selectedInstallment.due_date)}
              </p>
              {selectedInstallment.is_overdue && (
                <p className="text-[#C23A2E] text-sm font-semibold mt-1">
                  Esta parcela está em atraso!
                </p>
              )}
            </div>
          )}

          <Select
            label="Forma de pagamento"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            options={[
              { value: "cash", label: "Dinheiro" },
              { value: "pix", label: "Pix" },
              { value: "card", label: "Cartão" },
              { value: "transfer", label: "Transferência" },
              { value: "other", label: "Outro" },
            ]}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsPayModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePayInstallment} disabled={saving}>
              {saving ? "Processando..." : "Confirmar pagamento"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewSaleOpen}
        onClose={() => {
          setIsViewSaleOpen(false);
          setSelectedSale(null);
        }}
        title={`Venda #${selectedSale?.id}`}
        size="lg"
      >
        {selectedSale && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#939399] text-xs font-semibold">Cliente</span>
                <p className="text-[#2A2933] font-medium">{selectedSale.customer_name || "Sem cliente"}</p>
              </div>
              <div>
                <span className="text-[#939399] text-xs font-semibold">Status</span>
                <p
                  className="font-semibold px-2 py-1 rounded-full inline-block mt-1"
                  style={{
                    color: "white",
                    backgroundColor: getStatusColor(selectedSale.status),
                  }}
                >
                  {selectedSale.status === "paid"
                    ? "Paga"
                    : selectedSale.status === "pending"
                    ? "Pendente"
                    : "Cancelada"}
                </p>
              </div>
              <div>
                <span className="text-[#939399] text-xs font-semibold">Data</span>
                <p className="text-[#2A2933] font-medium">{formatDate(selectedSale.created_at)}</p>
              </div>
              <div>
                <span className="text-[#939399] text-xs font-semibold">Parcelas</span>
                <p className="text-[#2A2933] font-medium">{selectedSale.installments_count}x</p>
              </div>
            </div>

            <div>
              <span className="text-[#939399] text-xs font-semibold">Itens</span>
              <div className="mt-2 space-y-2">
                {selectedSale.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#F8F6F4] rounded-xl p-3">
                    <span className="text-[#2A2933]">{item.product_name}</span>
                    <span className="text-[#2A2933] font-medium">
                      {item.quantity}x {formatCurrency(item.sale_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#FFDAD8] rounded-xl">
              <span className="text-[#2A2933] font-semibold">Total:</span>
              <span className="text-[#2A2933] text-xl font-bold">
                {formatCurrency(selectedSale.total_amount)}
              </span>
            </div>

            {selectedSale.installments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#939399] text-xs font-semibold">Parcelas</span>
                  {selectedSale.installments.some((i) => i.status === "pending") && (
                    <button
                      onClick={() => {
                        setIsViewSaleOpen(false);
                        setActiveTab("parcelas");
                      }}
                      className="text-[#C23A2E] text-xs font-bold hover:underline"
                    >
                      Ver todas parcelas em aberto
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {selectedSale.installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between bg-[#F8F6F4] rounded-xl p-3"
                    >
                      <span className="text-[#2A2933]">#{inst.number} - {formatDate(inst.due_date)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#2A2933] font-medium">{formatCurrency(inst.amount)}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: inst.status === "paid" ? "#008A4E" : "#939399",
                            backgroundColor: inst.status === "paid" ? "#008A4E20" : "#F8F6F4",
                          }}
                        >
                          {inst.status === "paid" ? "Paga" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
