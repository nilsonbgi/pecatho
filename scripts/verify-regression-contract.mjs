import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "src/app/cadastro/page.tsx",
    name: "Cadastro — onboarding estruturado",
    required: [
      'type EntryMode = "customer" | "advertiser" | "fans" | "both"',
      "const [step, setStep] = useState(1)",
      "const [entryMode, setEntryMode]",
      "function lookupCep",
      "function validCpf",
      "function adult",
      "entry_mode: entryMode",
      "emailRedirectTo",
      "step === 5",
      "step >= 6",
    ],
  },
  {
    file: "src/app/fans/gerenciar/publicacoes/[id]/page.tsx",
    name: "Fans — editor de publicação",
    required: [
      "enviar-analise",
      "fans_post_media",
      "pecatho-private",
      "setPreview",
    ],
  },
  {
    file: "src/app/api/cliente/premium/route.ts",
    name: "Premium do cliente — checkout autenticado",
    required: [
      "create_pecatho_customer_premium_checkout",
      'productType: "premium_subscription"',
      "createMercadoPagoPreference",
      'order.status !== "awaiting_payment"',
    ],
  },
  {
    file: "supabase/migrations/20261022160000_enforce_customer_premium_checkout_audience.sql",
    name: "Premium do cliente — bloquear planos de públicos profissionais no checkout",
    required: [
      "and audience = 'customer'",
      "PREMIUM_PLAN_UNAVAILABLE",
      "revoke all on function public.create_pecatho_customer_premium_checkout(uuid, uuid) from public, anon",
      "grant execute on function public.create_pecatho_customer_premium_checkout(uuid, uuid) to authenticated, service_role",
    ],
  },
  {
    file: "src/app/api/anunciantes/planos/checkout/route.ts",
    name: "Anúncios — retomada idempotente de checkout pendente",
    required: [
      'contains("metadata", { product_type: "publication_plan", profile_id: profileId })',
      "order.metadata?.product_id === planId",
      "pendingPayment.provider_payment_id",
      'intent = { order_id: matchingPendingOrder.id }',
      "create_pecatho_publication_checkout",
      '.from("advertiser_profiles")',
      'profile.user_id !== user.id',
      '.from("fans_creators")',
      'plan.audience !== "both" && plan.audience !== expectedAudience',
    ],
  },
  {
    file: "src/app/api/fans/planos-publicacao/checkout/route.ts",
    name: "Vendedores de conteúdo — retomada idempotente de checkout pendente",
    required: [
      'contains("metadata", { product_type: "creator_publication_plan", creator_id: creatorId })',
      "order.metadata?.product_id === planId",
      "pendingPayment.provider_payment_id",
      'intent = { order_id: matchingPendingOrder.id }',
      "create_pecatho_creator_publication_checkout",
      'plan.audience !== "content_seller" && plan.audience !== "both"',
      '.from("fans_creators")',
      '.eq("id", creatorId)',
      'creator.user_id !== user.id || creator.status !== "active"',
    ],
  },
  {
    file: "src/app/api/fans/payments/mercadopago/webhook/route.ts",
    name: "Premium do cliente — conciliação por webhook",
    required: [
      "settle_pecatho_customer_premium_checkout",
      'productType === "premium_subscription"',
      "Assinatura inválida.",
    ],
  },
  {
    file: "src/app/api/fans/payments/mercadopago/webhook/route.ts",
    name: "Mercado Pago — conciliação segura de reembolsos parciais e integrais",
    required: [
      "const refundsResponse = await fetch(",
      '"/refunds"',
      '["approved", "processed", "accredited"]',
      'const normalizedRefundedAmount = status === "refunded"',
      "refundStateAlreadyMatches",
      "fullRefundSettlementError",
      'status: fullRefund ? "refunded" : "partially_refunded"',
      "refunded_amount: normalizedRefundedAmount",
      "A notificação precisa ser reenviada.",
    ],
  },
  {
    file: "supabase/migrations/20261022143400_pecatho_affiliate_partial_refunds.sql",
    name: "Afiliados — reversão proporcional, acumulada e idempotente",
    required: [
      "ADD COLUMN IF NOT EXISTS refunded_amount",
      "ADD COLUMN IF NOT EXISTS reversed_amount",
      "v_target_reversed",
      "v_reversal_delta",
      "'pecatho-affiliate-reversal:'",
      "'partially_refunded'",
      "commission_amount_reversed_total",
    ],
  },
  {
    file: "src/components/CustomerPremium.tsx",
    name: "Premium do cliente — ativação condicionada à confirmação",
    required: [
      "o Premium só é ativado depois que o Pecatho confirma o pagamento",
      "Seu Premium está ativo",
      "Não há renovação automática habilitada.",
      "const billingMonths = durationDays === 365 ? 12 : durationDays / 30;",
    ],
  },
  {
    file: "supabase/migrations/20261023120000_enforce_content_seller_contact_premium_gate.sql",
    name: "Conteúdo — WhatsApp e telefone protegidos por entitlement Premium",
    required: [
      "private.get_public_advertiser_profile",
      "fc.advertiser_profile_id = p.id",
      "fc.status = 'active'",
      "s.feature_flags -> 'private_seller_contact' = 'true'::jsonb",
      "else null",
    ],
  },
  {
    file: "src/app/anunciantes/[slug]/page.tsx",
    name: "Conteúdo — CTA Premium em vez de contato pessoal para não assinantes",
    required: [
      "premiumEntitlementLoaded",
      "sellerContactRequiresPremium",
      "setHasPrivateSellerContactPremium(canContactContentSeller)",
      "Seja Premium",
      "/painel/cliente#premium",
    ],
  },
  {
    file: "src/app/anunciantes/page.tsx",
    name: "Catálogo público — filtros estruturados",
    required: [
      "search_public_advertisers",
      "category_attributes",
      "category_services",
    ],
  },
];

const failures = [];
for (const check of checks) {
  let source;
  try {
    source = await readFile(check.file, "utf8");
  } catch (error) {
    failures.push(`${check.name}: arquivo ausente (${check.file})`);
    continue;
  }

  for (const marker of check.required) {
    if (!source.includes(marker)) {
      failures.push(`${check.name}: contrato ausente: ${marker}`);
    }
  }
}

if (failures.length) {
  console.error("REGRESSION CONTRACT FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Regression contract OK: ${checks.length} critical modules verified.`);
