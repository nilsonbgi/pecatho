"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type Follow = { profile_id: string; created_at: string; advertiser: { slug: string; title: string | null; display_name: string | null; summary: string | null; city_id: number | null; state_id: number | null } | null };

type City = { id: number; name: string };
type State = { id: number; uf: string };

export default function SeguindoPage() {
  const [items, setItems] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cities, setCities] = useState<Record<number, string>>({});
  const [states, setStates] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (active) { setMessage("Entre na sua conta para visualizar os perfis que você acompanha."); setLoading(false); }
        return;
      }
      const { data, error } = await supabase.from("user_follows").select("profile_id,created_at").eq("follower_id", auth.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      const follows = (data ?? []) as Array<{ profile_id: string; created_at: string }>;
      if (!follows.length) { if (active) { setItems([]); setLoading(false); } return; }
      const ids = follows.map((row) => row.profile_id);
      const { data: profiles, error: profileError } = await supabase.from("advertiser_profiles").select("id,slug,title,display_name,summary,city_id,state_id").in("id", ids).eq("status", "published");
      if (profileError) throw profileError;
      const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      const result = follows.map((row) => ({ ...row, advertiser: byId.get(row.profile_id) ? { ...byId.get(row.profile_id) } as Follow["advertiser"] : null })).filter((row) => row.advertiser);
      const cityIds = [...new Set(result.map((row) => row.advertiser?.city_id).filter((id): id is number => typeof id === "number"))];
      const stateIds = [...new Set(result.map((row) => row.advertiser?.state_id).filter((id): id is number => typeof id === "number"))];
      const [cityResult, stateResult] = await Promise.all([
        cityIds.length ? supabase.from("cities").select("id,name").in("id", cityIds) : Promise.resolve({ data: [], error: null }),
        stateIds.length ? supabase.from("states").select("id,uf").in("id", stateIds) : Promise.resolve({ data: [], error: null }),
      ]);
      if (!active) return;
      setCities(Object.fromEntries(((cityResult.data ?? []) as City[]).map((row) => [row.id, row.name])));
      setStates(Object.fromEntries(((stateResult.data ?? []) as State[]).map((row) => [row.id, row.uf])));
      setItems(result); setLoading(false);
    })().catch((error) => { console.error(error); if (active) { setMessage("Não foi possível carregar seus perfis acompanhados."); setLoading(false); } });
    return () => { active = false; };
  }, []);

  async function unfollow(profileId: string) {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("user_follows").delete().eq("follower_id", auth.user.id).eq("profile_id", profileId);
    if (error) { setMessage("Não foi possível remover o acompanhamento."); return; }
    setItems((current) => current.filter((item) => item.profile_id !== profileId));
  }

  return <main className="shell"><nav className="topbar"><Link href="/painel" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><div className="navLinks"><Link href="/anunciantes">Anunciantes</Link><Link href="/painel" className="navCta">Meu painel</Link></div></nav>
    <section className="hero compactHero"><div className="eyebrow">MEU PECATHO</div><h1>Perfis que você <em>acompanha.</em></h1><p className="heroCopy">Tenha em um só lugar os anunciantes que despertaram seu interesse. O acompanhamento é privado e pode ser removido a qualquer momento.</p></section>
    <section className="followingSection">{loading ? <div className="emptyDiscovery"><h2>Carregando seus acompanhamentos...</h2></div> : message ? <div className="emptyDiscovery"><h2>{message}</h2><Link href="/anunciantes" className="primaryButton">Explorar anunciantes</Link></div> : items.length === 0 ? <div className="emptyDiscovery"><h2>Você ainda não acompanha nenhum perfil.</h2><p>Explore os anunciantes e use “＋ Acompanhar perfil” para criar sua lista pessoal.</p><Link href="/anunciantes" className="primaryButton">Explorar anunciantes</Link></div> : <div className="followingGrid">{items.map((item) => { const advertiser = item.advertiser!; const location = [advertiser.city_id ? cities[advertiser.city_id] : "", advertiser.state_id ? states[advertiser.state_id] : ""].filter(Boolean).join(" · "); return <article className="followingCard card" key={item.profile_id}><div className="followingCardMark">P</div><div className="followingCardBody"><div className="eyebrow">PERFIL ACOMPANHADO</div><h2>{advertiser.title || advertiser.display_name || "Anunciante Pecatho"}</h2>{location && <span className="followingLocation">⌖ {location}</span>}<p>{advertiser.summary || "Veja o perfil público, serviços, mídia e avaliações."}</p><div className="followingActions"><Link href={`/anunciantes/${advertiser.slug}`} className="primaryButton">Ver perfil</Link><button type="button" className="secondaryButton" onClick={() => unfollow(item.profile_id)}>Deixar de acompanhar</button></div></div></article>; })}</div>}</section>
    <footer><span>Pecatho · sua área de acompanhamento</span><Link href="/anunciantes">Explorar anunciantes</Link></footer>
  </main>;
}
