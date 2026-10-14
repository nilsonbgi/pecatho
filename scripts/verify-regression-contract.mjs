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
    file: "src/app/api/fans/payments/mercadopago/webhook/route.ts",
    name: "Premium do cliente — conciliação por webhook",
    required: [
      "settle_pecatho_customer_premium_checkout",
      'productType === "premium_subscription"',
      "Assinatura inválida.",
    ],
  },
  {
    file: "src/components/CustomerPremium.tsx",
    name: "Premium do cliente — ativação condicionada à confirmação",
    required: [
      "o Premium só é ativado depois que o Pecatho confirma o pagamento",
      "Seu Premium está ativo",
      "Não há renovação automática habilitada.",
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
