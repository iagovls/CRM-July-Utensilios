"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import TopBar from "@/components/TopBar";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import Input, { Textarea, Select } from "@/components/Input";
import { productService, categoryService } from "@/lib/services";
import { Product, Category } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    purchase_price: "",
    stock_quantity: "",
    category: "",
  });
  const [images, setImages] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProducts = useCallback(async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        purchase_price: product.purchase_price || "",
        stock_quantity: String(product.stock_quantity || 0),
        category: product.category || "",
      });
      setIsEditing(true);
    } else {
      setSelectedProduct(null);
      setFormData({
        name: "",
        description: "",
        purchase_price: "",
        stock_quantity: "",
        category: "",
      });
      setIsEditing(false);
    }
    setImages(null);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    if (formData.description) formDataToSend.append("description", formData.description);
    if (formData.purchase_price) formDataToSend.append("purchase_price", formData.purchase_price);
    if (formData.stock_quantity) formDataToSend.append("stock_quantity", formData.stock_quantity);
    if (formData.category) formDataToSend.append("category", formData.category);
    if (images) {
      Array.from(images).forEach((file) => {
        formDataToSend.append("uploaded_images", file);
      });
    }

    try {
      if (isEditing && selectedProduct) {
        await productService.update(selectedProduct.id, formDataToSend);
      } else {
        await productService.create(formDataToSend);
      }
      await fetchProducts();
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
    if (confirm("Tem certeza que deseja inativar este produto?")) {
      try {
        await productService.delete(id);
        await fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const getStockColor = (stock: number | null) => {
    if (stock === null || stock === 0) return "#C23A2E";
    if (stock < 20) return "#B76B00";
    return "#008A4E";
  };

  const getStockLabel = (stock: number | null) => {
    if (stock === null || stock === 0) return "Esgotado";
    if (stock < 20) return "Baixo";
    return "Disponível";
  };

  return (
    <div className="clip rounded-[32px] bg-white p-4 md:p-8 flex flex-col gap-5 h-full overflow-hidden">
      <TopBar
        title="Produtos"
        subtitle="Catálogo, estoque e margem por item."
        showNewSale={false}
        onSearch={setSearchQuery}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3 py-2 rounded-full text-[13px] font-semibold font-['Inter'] transition-colors ${
            !selectedCategory
              ? "bg-[#FFDAD8] text-[#2A2933]"
              : "bg-[#F8F6F4] text-[#2A2933]"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-3 py-2 rounded-full text-[13px] font-semibold font-['Inter'] transition-colors ${
              selectedCategory === cat.name
                ? "bg-[#FFDAD8] text-[#2A2933]"
                : "bg-[#F8F6F4] text-[#2A2933]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[#616167] text-sm">
          {filteredProducts.length} produtos
        </span>
        <Button onClick={() => handleOpenModal()}>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo produto
          </div>
        </Button>
      </div>

      <div className="flex-1 bg-[#F8F6F4] rounded-[28px] p-4 md:p-6 flex flex-col gap-3 overflow-auto">
        <div className="hidden md:grid md:grid-cols-[1fr_100px_100px_120px_100px_80px] gap-4 text-xs text-[#939399] font-semibold px-4 py-2">
          <span>Produto</span>
          <span className="text-center">Estoque</span>
          <span className="text-center">Status</span>
          <span className="text-right">Preço</span>
          <span className="text-right">Categoria</span>
          <span className="text-center">Ações</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Carregando...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#616167]">
            Nenhum produto encontrado.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col md:grid md:grid-cols-[1fr_100px_100px_120px_100px_80px] gap-3 md:gap-4 items-start md:items-center">
                <div className="flex items-center gap-3">
                  {product.images.length > 0 ? (
                    <div
                      className="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${product.images[0].image})` }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-[#FFDAD8] flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-[#2A2933]" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[#2A2933] text-sm font-semibold font-['Inter'] truncate">
                      {product.name || "Sem nome"}
                    </span>
                    {product.description && (
                      <span className="text-[#616167] text-xs truncate hidden md:block">
                        {product.description.substring(0, 50)}
                        {product.description.length > 50 ? "..." : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:text-center">
                  <span className="md:hidden text-[#939399] text-xs mr-2">Estoque:</span>
                  <span className="text-[#2A2933] font-semibold">
                    {product.stock_quantity ?? 0} un.
                  </span>
                </div>

                <div className="md:text-center">
                  <span className="md:hidden text-[#939399] text-xs mr-2">Status:</span>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      color: getStockColor(product.stock_quantity),
                      backgroundColor: `${getStockColor(product.stock_quantity)}20`,
                    }}
                  >
                    {getStockLabel(product.stock_quantity)}
                  </span>
                </div>

                <div className="md:text-right">
                  <span className="md:hidden text-[#939399] text-xs mr-2">Preço:</span>
                  <span className="text-[#2A2933] font-bold">
                    {formatCurrency(product.purchase_price)}
                  </span>
                </div>

                <div className="md:text-right">
                  <span className="md:hidden text-[#939399] text-xs mr-2">Categoria:</span>
                  <span className="text-[#616167] text-sm">
                    {product.category || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-1 md:justify-center">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="w-8 h-8 rounded-lg bg-[#F8F6F4] flex items-center justify-center hover:bg-[#E8E1DF] transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-[#616167]" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
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
        title={isEditing ? "Editar Produto" : "Novo Produto"}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do produto"
            error={errors.name}
          />
          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição do produto"
            error={errors.description}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preço de custo"
              type="number"
              step="0.01"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              placeholder="0,00"
              error={errors.purchase_price}
            />
            <Input
              label="Estoque"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              placeholder="0"
              error={errors.stock_quantity}
            />
          </div>
          <Select
            label="Categoria"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: "", label: "Selecione uma categoria" },
              ...categories.map((c) => ({ value: c.name, label: c.name })),
            ]}
            error={errors.category}
          />
          <div>
            <label className="block text-[#2A2933] text-sm font-medium mb-2">
              Imagens
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-12 border-2 border-dashed border-[#E8E1DF] rounded-xl text-[#616167] text-sm font-medium hover:border-[#FFDAD8] hover:text-[#2A2933] transition-colors"
            >
              {images ? `${images.length} imagem(ns) selecionada(s)` : "Clique para adicionar imagens"}
            </button>
            
            {isEditing && selectedProduct && selectedProduct.images.length > 0 && (
              <div className="mt-3">
                <span className="text-[#939399] text-xs font-medium">Imagens atuais:</span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {selectedProduct.images.map((img) => (
                    <div
                      key={img.id}
                      className="w-20 h-20 rounded-lg bg-cover bg-center border border-[#E8E1DF]"
                      style={{ backgroundImage: `url(${img.image})` }}
                      title={img.image}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
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
    </div>
  );
}
