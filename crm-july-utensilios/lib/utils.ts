export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return cpf;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function formatDocument(document: string | null): string {
  if (!document) return "-";
  const cleaned = document.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return formatCPF(document);
  } else if (cleaned.length === 14) {
    return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return document;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
    case "Paga":
    case "Ativo":
      return "#008A4E";
    case "pending":
    case "Pendente":
    case "Atenção":
      return "#B76B00";
    case "canceled":
    case "Cancelada":
    case "Atrasada":
      return "#C23A2E";
    case "Fiel":
      return "#2A2933";
    default:
      return "#616167";
  }
}

export function getMonthName(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
