export const formatCurrency = (amount: number, showCurrency = true): string => {
  return new Intl.NumberFormat("en-IN", {
    style: showCurrency ? "currency" : "decimal",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}
