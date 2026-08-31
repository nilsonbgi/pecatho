"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type StateRow = { id: number; uf: string; name: string };
type CityRow = { id: number; name: string; state_id?: number | null };
type CategoryRow = { id: number; name: string };

const sections = ["Apresentação", "Localização", "Características", "Serviços", "Preços", "Publicação"];

export default function AnuncioPage() {
  const [active, setActive] = useState("Apresentação");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [services, setServices] = useState("");
  const [price, setPrice] = useState("");
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const a = await supabase.from("states").select("id,uf,name").order("name");
      const b = await supabase.from("cities").select("id,name,state_id").order("name").limit(5000);
      const c = await supabase.from("categories").select("id,name").eq("display", true).order("sort_order");
      setStates((a.data as StateRow[] | null) || []);
      setCities((b.data as CityRow[] | null) || []);
      setCategories((c.data as CategoryRow[] | null) || []);
    })();
  }, []);

  const visibleCities = useMemo(
    () => cities.filter((c) => !stateId || String(c.state_id) === stateId),
    [cities, stateId]
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: old } = await supabase
      .from("advertiser_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const normalizedPrice = price
      ? Number(price.replace(/\./g, "").replace(",", "."))
      : null;

    const numericAge = age ? Number(age) : null;
    const birthDate = numericAge && numericAge >= 18
      ? `${new Date().getFullYear() - numericAge}-01-01`
      : null;

    const payload = {
      title,
      display_name: name,
      summary,
      description,
      state_id: stateId ? Number(stateId) : null,
      city_id: cityId ? Number(cityId) : null,
      category_id: categoryId ? Number(categoryId) : null,
      birth_date: birthDate,
      height_cm: height ? Number(height) : null,
      pricing: { price: normalizedPrice },
      service_options: { description: services },
      social_links: {},
      payment_options: {},
    };

    const result = old
      ? await supabase.from("advertiser_profiles").update(payload).eq("id", old.id)
      : await supabase.from("advertiser_profiles").insert({
          ...payload,
          user_id: user.id,
          status: "draft",
          verification_status: "unverified",
        });

    if (result.error) {
      setError("Não foi possível salvar o anúncio. " + result.error.message);
    } else {
      setMessage("Alterações salvas com sucesso. O anúncio continua em rascunho até a validação.");
    }
    setBusy(false);
  }

  return (
    <main className="shell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div>
        <Link href="/painel" className="navCta">Voltar ao painel</Link>
      </nav>
      <section className="hero">
        <div className="eyebrow">EDITOR DE ANÚNCIO</div>
        <h1>Crie um anúncio <em>memorável.</em></h1>
        <p className="heroCopy">Informação clara, apresentação profissional e conteúdo relevante aumentam a confiança de quem visita seu perfil.</p>
        <div className="editorGrid">
          <div className="editorNav">
            {sections.map((section) => (
              <button type="button" key={section} className={active === section ? "editorTab active" : "editorTab"} onClick={() => setActive(section)}>
                {section}
              </button>
            ))}
          </div>
          <form className="authCard editorCard" onSubmit={submit}>
            {active === "Apresentação" && <>
              <label>Título do anúncio<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} placeholder="Ex.: Uma experiência para guardar na memória" /></label>
              <label>Nome de exibição<input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Como você deseja ser conhecida(o)" /></label>
              <label>Resumo<input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={280} placeholder="Uma frase curta, elegante e objetiva" /></label>
              <label>Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={9} maxLength={5000} placeholder="Conte mais sobre você, sua proposta e o que o visitante encontrará no seu anúncio." /></label>
            </>}
            {active === "Localização" && <>
              <label>Estado<select value={stateId} onChange={(e) => { setStateId(e.target.value); setCityId(""); }}><option value="">Selecione o estado</option>{states.map((s) => <option key={s.id} value={s.id}>{s.uf} — {s.name}</option>)}</select></label>
              <label>Cidade<select value={cityId} onChange={(e) => setCityId(e.target.value)} disabled={!stateId}><option value="">Selecione a cidade</option>{visibleCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label>Categoria<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Selecione a categoria</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            </>}
            {active === "Características" && <>
              <label>Idade<input type="number" min="18" max="100" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex.: 28" /></label>
              <label>Altura (cm)<input type="number" min="100" max="230" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ex.: 170" /></label>
            </>}
            {active === "Serviços" && <label>Serviços e informações<textarea value={services} onChange={(e) => setServices(e.target.value)} rows={12} maxLength={5000} placeholder="Descreva os serviços e informações que deseja disponibilizar, de forma objetiva e profissional." /></label>}
            {active === "Preços" && <><label>Valor de referência (R$)<input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex.: 350,00" /></label><p className="fieldNote">Os valores exibidos ao público seguirão o padrão brasileiro: R$ 350,00.</p></>}
            {active === "Publicação" && <div className="publicationBox"><h2>Prévia do anúncio</h2><article className="adPreview"><div className="adImage">Imagem principal</div><div><span className="previewBadge">RASCUNHO</span><h3>{title || "Seu título aparecerá aqui"}</h3><p className="previewName">{name || "Nome de exibição"}</p><p>{summary || "Apresente em poucas palavras aquilo que torna seu anúncio relevante."}</p><small>Complete os dados, adicione mídia e solicite a publicação quando estiver pronto.</small></div></article></div>}
            {error && <p className="formError">{error}</p>}
            {message && <p className="formSuccess">{message}</p>}
            <button className="primaryButton" disabled={busy}>{busy ? "Salvando..." : "Salvar anúncio"}</button>
          </form>
        </div>
      </section>
    </main>
  );
}
