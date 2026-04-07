const onlyDigits = (value: string) => value.replace(/\D/g, "");

export const formatDocument = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

export const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

export const formatCurrencyInput = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) {
    return "";
  }
  return formatCurrency(Number(digits) / 100);
};

export const normalizeCurrencyValue = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) {
    return "0.00";
  }
  return (Number(digits) / 100).toFixed(2);
};

export const validateDocument = (value: string) => {
  const digits = onlyDigits(value);
  if (!digits) {
    return true;
  }
  if (digits.length === 11) {
    if (/^(\d)\1{10}$/.test(digits)) {
      return false;
    }
    let total = 0;
    for (let index = 0; index < 9; index += 1) {
      total += Number(digits[index]) * (10 - index);
    }
    let remainder = (total * 10) % 11;
    if (remainder === 10) {
      remainder = 0;
    }
    if (remainder !== Number(digits[9])) {
      return false;
    }
    total = 0;
    for (let index = 0; index < 10; index += 1) {
      total += Number(digits[index]) * (11 - index);
    }
    remainder = (total * 10) % 11;
    if (remainder === 10) {
      remainder = 0;
    }
    return remainder === Number(digits[10]);
  }
  if (digits.length === 14) {
    if (/^(\d)\1{13}$/.test(digits)) {
      return false;
    }
    const calculate = (base: string, weights: number[]) => {
      const total = weights.reduce((sum, weight, index) => sum + Number(base[index]) * weight, 0);
      const remainder = total % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };
    const firstDigit = calculate(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const secondDigit = calculate(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13]);
  }
  return false;
};
