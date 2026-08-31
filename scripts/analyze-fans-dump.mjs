import fs from 'node:fs';

const input = process.argv[2] ?? 'fans_vipcomdump.sql';
const outDir = process.argv[3] ?? 'docs';
const sql = fs.readFileSync(input, 'utf8');
fs.mkdirSync(outDir, { recursive: true });

const tables = [];
const tableRe = /CREATE\s+TABLE\s+`([^`]+)`\s*\((.*?)\)\s*ENGINE=/gis;
let match;
while ((match = tableRe.exec(sql)) !== null) {
  const [, name, body] = match;
  const columns = [];
  const indexes = [];
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim().replace(/,$/, '');
    const col = line.match(/^`([^`]+)`\s+(.+)$/);
    if (col) {
      columns.push({ name: col[1], definition: col[2].trim() });
      continue;
    }
    if (/^(PRIMARY KEY|UNIQUE KEY|KEY|CONSTRAINT|FULLTEXT|SPATIAL)/i.test(line)) indexes.push(line);
  }
  tables.push({ name, columns, indexes });
}

tables.sort((a, b) => a.name.localeCompare(b.name));
const result = {
  source: input,
  bytes: Buffer.byteLength(sql),
  tables_count: tables.length,
  tables,
};
fs.writeFileSync(`${outDir}/fans-legacy-schema.json`, JSON.stringify(result, null, 2) + '\n');

const lines = [
  '# Estrutura legada do Pecatho Fans',
  '',
  `Arquivo: \`${input}\``,
  `Tamanho: ${result.bytes.toLocaleString('pt-BR')} bytes`,
  `Tabelas encontradas: **${result.tables_count}**`,
  '',
  '> Documento gerado automaticamente a partir do dump legado. Ele é referência de compatibilidade; não deve ser executado diretamente no PostgreSQL/Supabase.',
  '',
];
for (const table of tables) {
  lines.push(`## ${table.name}`, '', '| Campo | Definição legada |', '|---|---|');
  for (const c of table.columns) lines.push(`| \`${c.name}\` | ${c.definition.replace(/\|/g, '\\|')} |`);
  if (table.indexes.length) lines.push('', '**Índices/restrições:**', '', ...table.indexes.map(i => `- \`${i.replace(/`/g, '\\`')}\``));
  lines.push('');
}
fs.writeFileSync(`${outDir}/fans-legacy-schema.md`, lines.join('\n') + '\n');
console.log(`Analyzed ${tables.length} tables from ${input}`);
