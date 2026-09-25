type MercadoPagoPreferenceInput = {
  orderId: string;
  orderNumber: string;
  title: string;
  amount: number;
  buyerEmail: string;
  creatorId?: string;
  productType?: "digital_content" | "profile_media";
};

type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export async function createMercadoPagoPreference(input: MercadoPagoPreferenceInput): Promise<MercadoPagoPreference> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL não configurado.");

  const notificationUrl = new URL("/api/fans/payments/mercadopago/webhook", baseUrl).toString();
  const productType = input.productType ?? "digital_content";
  const channel = productType === "profile_media" ? "pecatho_profile_media" : input.creatorId ? "pecatho_fans" : "pecatho_digital_content";

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": input.orderId,
    },
    body: JSON.stringify({
      external_reference: input.orderId,
      items: [{
        id: input.orderId,
        title: input.title.slice(0, 256),
        quantity: 1,
        currency_id: "BRL",
        unit_price: input.amount,
      }],
      payer: { email: input.buyerEmail },
      notification_url: notificationUrl,
      back_urls: {
        success: `${baseUrl}/fans/checkout/sucesso?order=${encodeURIComponent(input.orderId)}`,
        pending: `${baseUrl}/fans/checkout/pendente?order=${encodeURIComponent(input.orderId)}`,
        failure: `${baseUrl}/fans/checkout/falha?order=${encodeURIComponent(input.orderId)}`,
      },
      auto_return: "approved",
      metadata: {
        pecatho_order_id: input.orderId,
        pecatho_order_number: input.orderNumber,
        product_type: productType,
        channel,
        ...(input.creatorId ? { creator_id: input.creatorId } : {}),
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Mercado Pago recusou a criação do checkout (${response.status}). ${detail.slice(0, 500)}`);
  }

  return response.json() as Promise<MercadoPagoPreference>;
}
