type MercadoPagoPreferenceInput = {
  orderId: string;
  orderNumber: string;
  title: string;
  amount: number;
  buyerEmail: string;
  creatorId?: string;
  productType?: "digital_content" | "profile_media" | "gift" | "premium_subscription" | "fans_boost" | "publication_plan" | "creator_publication_plan" | "professional_premium_subscription";
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

  const protectionBypassToken = process.env.VERCEL_PREVIEW_PROTECTION_BYPASS;
  const withPreviewProtectionBypass = (value: string) => {
    if (!protectionBypassToken) return value;
    const url = new URL(value);
    url.searchParams.set("x-vercel-protection-bypass", protectionBypassToken);
    return url.toString();
  };
  const notificationUrl = withPreviewProtectionBypass(
    new URL("/api/fans/payments/mercadopago/webhook", baseUrl).toString(),
  );
  const productType = input.productType ?? "digital_content";
  const channel = productType === "fans_boost"
    ? "pecatho_fans_boost"
    : productType === "profile_media"
      ? "pecatho_profile_media"
      : productType === "gift"
        ? "pecatho_gift"
        : productType === "premium_subscription"
          ? "pecatho_customer_premium"
          : productType === "professional_premium_subscription"
            ? "pecatho_professional_premium"
          : productType === "publication_plan"
            ? "pecatho_publication_plan"
            : productType === "creator_publication_plan"
              ? "pecatho_creator_publication_plan"
                : input.creatorId ? "pecatho_fans" : "pecatho_digital_content";

  const successUrl = productType === "premium_subscription"
    ? `${baseUrl}/painel/cliente?premium=aguardando&order=${encodeURIComponent(input.orderId)}`
    : productType === "professional_premium_subscription"
      ? `${baseUrl}/painel/anuncio/premium?status=aguardando&order=${encodeURIComponent(input.orderId)}`
    : productType === "publication_plan"
      ? `${baseUrl}/painel/anuncio/planos?status=aguardando&order=${encodeURIComponent(input.orderId)}`
      : productType === "creator_publication_plan"
        ? `${baseUrl}/fans/gerenciar/visibilidade?status=aguardando&order=${encodeURIComponent(input.orderId)}`
        : `${baseUrl}/fans/checkout/sucesso?order=${encodeURIComponent(input.orderId)}`;

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
        success: withPreviewProtectionBypass(successUrl),
        pending: withPreviewProtectionBypass(`${baseUrl}/fans/checkout/pendente?order=${encodeURIComponent(input.orderId)}&product_type=${encodeURIComponent(productType)}`),
        failure: withPreviewProtectionBypass(`${baseUrl}/fans/checkout/falha?order=${encodeURIComponent(input.orderId)}&product_type=${encodeURIComponent(productType)}`),
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
