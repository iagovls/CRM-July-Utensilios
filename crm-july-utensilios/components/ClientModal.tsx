"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import Input, { Textarea } from "@/components/Input";
import { Client } from "@/types";

export interface ClientFormData {
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClient?: Client | null;
  onSave: (data: ClientFormData, isEditing: boolean, clientId?: string) => Promise<void>;
}

function initialForm(initialClient?: Client | null): ClientFormData {
  if (initialClient) {
    return {
      name: initialClient.name || "",
      document: initialClient.document || "",
      email: initialClient.email || "",
      phone: initialClient.phone || "",
      address: initialClient.address || "",
    };
  }
  return { name: "", document: "", email: "", phone: "", address: "" };
}

function applyDocumentMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$3")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function isValidEmail(email: string): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDocument(document: string): boolean {
  if (!document) return true;
  const digits = document.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

function validate(data: ClientFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    errors.name = "O nome é obrigatório.";
  } else if (trimmedName.length < 2) {
    errors.name = "O nome deve ter pelo menos 2 caracteres.";
  }

  if (data.document && !isValidDocument(data.document)) {
    errors.document = "CPF/CNPJ inválido. Informe 11 (CPF) ou 14 (CNPJ) dígitos.";
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = "Telefone inválido. Use o formato (00) 00000-0000.";
  }

  return errors;
}

export default function ClientModal({
  isOpen,
  onClose,
  initialClient,
  onSave,
}: ClientModalProps) {
  const isEditing = !!initialClient;
  const clientId = initialClient?.id;

  const [formData, setFormData] = useState<ClientFormData>(() => initialForm(initialClient));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateField = <K extends keyof ClientFormData>(
    key: K,
    value: ClientFormData[K]
  ) => {
    const next = { ...formData, [key]: value };
    setFormData(next);
    if (touched[key]) {
      setErrors(validate(next));
    }
  };

  const handleBlur = (key: keyof ClientFormData) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(formData));
  };

  const handleSave = async () => {
    setTouched({ name: true, document: true, email: true, phone: true, address: true });
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const cleanedData: ClientFormData = {
        name: formData.name.trim(),
        document: formData.document.replace(/\D/g, ""),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ""),
        address: formData.address.trim(),
      };
      await onSave(cleanedData, isEditing, clientId);
      onClose();
    } catch (error: unknown) {
      const msg = (error as Error)?.message || "";
      const map: Record<string, string> = {};
      if (msg) {
        if (/name/i.test(msg)) map.name = msg;
        if (/email/i.test(msg)) map.email = msg;
        if (/document/i.test(msg)) map.document = msg;
        if (Object.keys(map).length === 0) {
          map.name = "Erro ao salvar cliente.";
        }
      } else {
        map.name = "Erro ao salvar cliente.";
      }
      setErrors((prev) => ({ ...prev, ...map }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Cliente" : "Novo Cliente"}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nome"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          placeholder="Nome completo"
          error={errors.name}
          autoFocus
        />
        <Input
          label="CPF/CNPJ"
          value={formData.document}
          onChange={(e) => updateField("document", applyDocumentMask(e.target.value))}
          onBlur={() => handleBlur("document")}
          placeholder="000.000.000-00"
          error={errors.document}
          inputMode="numeric"
        />
        <Input
          label="E-mail"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          placeholder="email@exemplo.com"
          error={errors.email}
        />
        <Input
          label="Telefone"
          value={formData.phone}
          onChange={(e) => updateField("phone", applyPhoneMask(e.target.value))}
          onBlur={() => handleBlur("phone")}
          placeholder="(00) 00000-0000"
          error={errors.phone}
          inputMode="tel"
        />
        <Textarea
          label="Endereço"
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          onBlur={() => handleBlur("address")}
          placeholder="Endereço completo"
          error={errors.address}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
