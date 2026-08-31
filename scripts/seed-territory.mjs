import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para a carga territorial.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { count: existingCount, error: countError } = await supabase
  .from('cities')
  .select('id', { count: 'exact', head: true });

if (countError) throw countError;

if ((existingCount ?? 0) >= 5500) {
  console.log(`Base territorial já possui ${existingCount} municípios. Carga ignorada.`);
  process.exit(0);
}

const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome', {
  headers: { Accept: 'application/json' },
});

if (!response.ok) {
  throw new Error(`IBGE respondeu HTTP ${response.status}.`);
}

const municipalities = await response.json();

if (!Array.isArray(municipalities) || municipalities.length < 5000) {
  throw new Error(`Resposta do IBGE inválida ou incompleta: ${municipalities?.length ?? 0} municípios.`);
}

const { data: states, error: statesError } = await supabase
  .from('states')
  .select('id,uf');

if (statesError) throw statesError;

const stateByIbge = new Map((states ?? []).map((state) => [Number(state.id), state.id]));

const rows = municipalities.map((municipality) => {
  const ibgeCode = Number(municipality.id);
  const stateIbgeCode = Number(municipality.microrregiao?.mesorregiao?.UF?.id ?? String(ibgeCode).slice(0, 2));
  const stateId = stateByIbge.get(stateIbgeCode);

  if (!stateId) {
    throw new Error(`UF ${stateIbgeCode} não encontrada para o município ${ibgeCode} (${municipality.nome}).`);
  }

  return {
    id: ibgeCode,
    state_id: stateId,
    name: municipality.nome,
    ibge_code: String(ibgeCode),
  };
});

const batchSize = 500;
for (let i = 0; i < rows.length; i += batchSize) {
  const batch = rows.slice(i, i + batchSize);
  const { error } = await supabase.from('cities').upsert(batch, { onConflict: 'id' });
  if (error) throw error;
  console.log(`Municípios carregados: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
}

const { count: finalCount, error: finalCountError } = await supabase
  .from('cities')
  .select('id', { count: 'exact', head: true });

if (finalCountError) throw finalCountError;
if ((finalCount ?? 0) < 5000) throw new Error(`Carga incompleta: apenas ${finalCount} municípios no banco.`);

console.log(`Carga territorial concluída: ${finalCount} municípios.`);
