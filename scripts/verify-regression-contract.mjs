import { readFile } from "node:fs/promises";

const checks = [
  {
    file: "src/app/cadastro/page.tsx",
    name: "Cadastro — onboarding estruturado",
    required: [
      'type EntryMode = "advertiser" | "fans" | "both"',
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
