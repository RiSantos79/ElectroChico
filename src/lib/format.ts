export function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

// O Stripe devolve o tipo do método de pagamento em snake_case ("mb_way").
// Um método desconhecido é mostrado tal como veio, em vez de desaparecer.
const paymentMethodLabels: Record<string, string> = {
  card: "Cartão",
  multibanco: "Multibanco",
  mb_way: "MB WAY",
  paypal: "PayPal",
};

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "—";
  return paymentMethodLabels[method] ?? method;
}
