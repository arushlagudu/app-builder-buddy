export const STRIPE_PRICES = {
  monthly: {
    price_id: "price_1T0nF3BEjyacZUjvnlGx2f7M",
    amount: 9.99,
    label: "Monthly",
    interval: "month" as const,
  },
  annual: {
    price_id: "price_1T0nG9BEjyacZUjvaYOpcO3i",
    amount: 79.99,
    label: "Annual",
    interval: "year" as const,
    savings: "Save 33%",
    monthly_equivalent: 6.66,
  },
} as const;
