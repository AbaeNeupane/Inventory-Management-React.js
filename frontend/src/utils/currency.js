
export function formatCurrencyNPR(amount) {
  if (amount == null || isNaN(amount)) return "NPR 0.00";
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 2
  }).format(amount);
}
