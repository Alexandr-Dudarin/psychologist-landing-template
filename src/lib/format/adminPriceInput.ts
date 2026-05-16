export function normalizeAdminPriceInput(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatAdminPriceInput(
  value: string | number | null | undefined
): string {
  const digits = normalizeAdminPriceInput(String(value ?? ""));

  if (!digits) {
    return "";
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}