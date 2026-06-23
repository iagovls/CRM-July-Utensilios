"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import TopBar from "@/components/TopBar";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input from "@/components/Input";
import { categoryService } from "@/lib/services";
import { Category } from "@/types";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({ name: category.name || "" });
      setIsEditing(true);
    } else {
      setSelectedCategory(null);
      setFormData({ name: "" });
      setIsEditing(false);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      if (isEditing && selectedCategory) {
        await categoryService.update(selectedCategory.id, formData);
      } else {
        await categoryService.create(formData);
      }
      await fetchCategories();
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
    if (confirm("Tem certeza que deseja inativar esta categoria?")) {
      try {
        await categoryService.delete(id);
        await fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <div className="clip rounded-[32px] bg-white p-4 md:p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Categorias"
        subtitle="Organize o catálogo por grupos."
        showNewSale={false}
        searchPlaceholder="Buscar categoria..."
        onSearch={setSearchQuery}
      />

      <div className="flex items-center justify-between">
        <span className="text-[#616167] text-sm">{filteredCategories.length} categorias</span>
        <Button onClick={() => handleOpenModal()}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova categoria
          </div>
        </Button>
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-4 md:p-6 flex flex-col gap-3 overflow-auto">
        <div className="hidden md:grid md:grid-cols-[1fr_140px_100px] gap-4 text-xs text-[#939399] font-semibold px-4 py-2">
          <span>Categoria</span>
          <span className="text-center">Status</span>
          <span className="text-center">Ações</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Carregando...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Nenhuma categoria encontrada.
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col md:grid md:grid-cols-[1fr_140px_100px] gap-3 md:gap-4 items-start md:items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFDAD8] flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-[#2A2933]" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[#2A2933] text-sm font-semibold font-['Inter'] truncate">
                      {category.name || "Sem nome"}
                    </span>
                    <span className="text-[#616167] text-xs font-normal font-['Inter'] md:hidden">
                      {category.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex md:justify-center">
                  <span
                    className="text-sm font-semibold font-['Inter'] px-2 py-1 rounded-full"
                    style={{
                      color: category.is_active ? "#008A4E" : "#939399",
                      backgroundColor: category.is_active ? "#008A4E20" : "#F8F6F4",
                    }}
                  >
                    {category.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="flex items-center gap-1 md:justify-center">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="w-8 h-8 rounded-lg bg-[#F8F6F4] flex items-center justify-center hover:bg-[#E8E1DF] transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-[#616167]" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="w-8 h-8 rounded-lg bg-[#F8F6F4] flex items-center justify-center hover:bg-[#C23A2E] hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? "Editar Categoria" : "Nova Categoria"}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex.: Panelas"
            error={errors.name}
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

