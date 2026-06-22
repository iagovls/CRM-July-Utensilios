"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Search, Pencil, Trash2, Eye, MessageCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input, { Textarea } from "@/components/Input";
import { clientService } from "@/lib/services";
import { Client } from "@/types";
import { formatDocument, formatPhone, getStatusColor } from "@/lib/utils";

function getWhatsAppLink(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    const number = cleaned.length === 11 ? cleaned : `55${cleaned}`;
    return `https://wa.me/${number}`;
  }
  return null;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchClients = useCallback(async () => {
    try {
      const response = await clientService.getAll();
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.document?.includes(searchQuery)
  );

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name || "",
        document: client.document || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
      });
      setIsEditing(true);
    } else {
      setSelectedClient(null);
      setFormData({ name: "", document: "", email: "", phone: "", address: "" });
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      if (isEditing && selectedClient) {
        await clientService.update(selectedClient.id, formData);
      } else {
        await clientService.create(formData);
      }
      await fetchClients();
      setIsModalOpen(false);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: Record<string, string[]> } };
        if (axiosError.response?.data) {
          const flatErrors: Record<string, string> = {};
          Object.entries(axiosError.response.data).forEach(([key, value]) => {
            flatErrors[key] = Array.isArray(value) ? value[0] : value;
          });
          setErrors(flatErrors);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja inativar este cliente?")) {
      try {
        await clientService.delete(id);
        await fetchClients();
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  return (
    <div className="clip rounded-[32px] bg-white p-4 md:p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Clientes"
        subtitle="Cadastro, histórico e status de relacionamento."
        showNewSale={false}
        onSearch={setSearchQuery}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-full md:w-[280px] h-12 bg-[#F8F6F4] rounded-full px-4 flex items-center gap-2">
          <Search className="w-[18px] h-[18px] text-[#939399]" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-normal font-['Inter'] outline-none text-[#939399] placeholder:text-[#939399]"
          />
        </div>

        <Button onClick={() => handleOpenModal()}>
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Novo cliente
          </div>
        </Button>
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-4 md:p-6 flex flex-col gap-3 overflow-auto">
        <h2 className="text-[#2A2933] text-lg font-bold font-['Inter']">
          Histórico e status
        </h2>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Carregando...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filteredClients.map((client) => {
            const whatsappLink = getWhatsAppLink(client.phone);
            return (
              <div
                key={client.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
                    {client.name || "Sem nome"}
                  </span>
                  <span className="text-[#616167] text-sm font-normal font-['Inter']">
                    {client.document
                      ? formatDocument(client.document)
                      : client.email || "-"}
                  </span>
                  {client.phone && (
                    <span className="text-[#616167] text-xs font-normal font-['Inter']">
                      {formatPhone(client.phone)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[#2A2933] text-sm font-semibold font-['Inter']">
                    {client.purchase_history.length} compras
                  </span>
                  <span
                    className="text-sm font-semibold font-['Inter'] px-2 py-1 rounded-full"
                    style={{
                      color: client.is_active ? "#008A4E" : "#939399",
                      backgroundColor: client.is_active ? "#008A4E20" : "#F8F6F4",
                    }}
                  >
                    {client.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <div className="flex items-center gap-1">
                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center hover:bg-[#20BA5A] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </a>
                    )}
                    <button
                      onClick={() => handleViewClient(client)}
                      className="w-8 h-8 rounded-lg bg-[#F8F6F4] flex items-center justify-center hover:bg-[#E8E1DF] transition-colors"
                    >
                      <Eye className="w-4 h-4 text-[#616167]" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="w-8 h-8 rounded-lg bg-[#F8F6F4] flex items-center justify-center hover:bg-[#E8E1DF] transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#616167]" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="w-8 h-8 rounded-lg bg-[#F8F6F4] flex items-center justify-center hover:bg-[#C23A2E] hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Cliente" : "Novo Cliente"}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome completo"
            error={errors.name}
          />
          <Input
            label="CPF/CNPJ"
            value={formData.document}
            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
            placeholder="000.000.000-00"
            error={errors.document}
          />
          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            error={errors.email}
          />
          <Input
            label="Telefone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            error={errors.phone}
          />
          <Textarea
            label="Endereço"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Endereço completo"
            error={errors.address}
          />
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalhes do Cliente"
        size="lg"
      >
        {selectedClient && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#939399] text-xs font-semibold">Nome</span>
                <p className="text-[#2A2933] font-medium">{selectedClient.name || "-"}</p>
              </div>
              <div>
                <span className="text-[#939399] text-xs font-semibold">CPF/CNPJ</span>
                <p className="text-[#2A2933] font-medium">
                  {selectedClient.document ? formatDocument(selectedClient.document) : "-"}
                </p>
              </div>
              <div>
                <span className="text-[#939399] text-xs font-semibold">E-mail</span>
                <p className="text-[#2A2933] font-medium">{selectedClient.email || "-"}</p>
              </div>
              <div>
                <span className="text-[#939399] text-xs font-semibold">Telefone</span>
                <div className="flex items-center gap-2">
                  <p className="text-[#2A2933] font-medium">
                    {selectedClient.phone ? formatPhone(selectedClient.phone) : "-"}
                  </p>
                  {getWhatsAppLink(selectedClient.phone) && (
                    <a
                      href={getWhatsAppLink(selectedClient.phone) || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-6 h-6 rounded bg-[#25D366] flex items-center justify-center hover:bg-[#20BA5A] transition-colors"
                    >
                      <MessageCircle className="w-3 h-3 text-white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div>
              <span className="text-[#939399] text-xs font-semibold">Endereço</span>
              <p className="text-[#2A2933] font-medium">{selectedClient.address || "-"}</p>
            </div>

            {selectedClient.purchase_history.length > 0 && (
              <div>
                <span className="text-[#939399] text-xs font-semibold">Histórico de compras</span>
                <div className="mt-2 space-y-2">
                  {selectedClient.purchase_history.map((purchase) => (
                    <div
                      key={purchase.sale_id}
                      className="flex items-center justify-between bg-[#F8F6F4] rounded-xl p-3"
                    >
                      <span className="text-[#2A2933] text-sm">Venda #{purchase.sale_id}</span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: getStatusColor(purchase.status) }}
                      >
                        {purchase.status === "paid"
                          ? "Paga"
                          : purchase.status === "pending"
                          ? "Pendente"
                          : "Cancelada"}
                      </span>
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
