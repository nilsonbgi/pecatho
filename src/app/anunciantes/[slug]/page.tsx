"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import ApproximateLocationMap from "@/components/ApproximateLocationMap";

type Profile = { id: string; title: string | null; display_name: string | null; summary: string | null; description: string | null; status: string; verification_status: string | null; city_id: number | null; state_id: number | null; category_id: number | null };
type Address = { public_latitude: number | null; public_longitude: number | null; location_visibility: string; city_id: number | null; state_id: number | null };
type City = { name: string };
type State = { uf: string; name: string };
type Category = { name: string };

export default function PublicAdvertiserPage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: p, error: profileError } = await supabase.from("advertiser_profiles").select("id,title,display_name,summary,description,status,verification_status,city_id,state_id,category_id").eq("slug", params.slug).eq("status", "published").maybeSingle();
      if (profileError || !p) { setError("Anúncio não encontrado ou ainda não publicado."); setLoading(false); return; }
      setProfile(p as Profile);
      const [a, c, s, cat] = await Promise.all([
        supabase.from("user_addresses").select("public_latitude,public_longitude,location_visibility,city_id,state_id").eq("user_id", (p as Profile & { user_id?: string }).user_id || "").eq("is_primary", true).maybeSingle(),
        p.city_id ? supabase.from("cities").select("name").eq("id", p.city_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        p.state_id ? supabase.from("states").select("uf,name").eq("id", p.state_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        p.category_id ? supabase.from("categories").select("name").eq("id", p.category_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      ]);
      setAddress((a.data as Address | null) || null); setCity((c.data as City | null) || null); setState((s.data as State | null) || null); setCategory((cat.data as Category | null) || null); setLoading(false);
    })();
  }, [params.slug]);

  if (loading) return <main className="shell"><section className="hero"><p>Carregando anúncio...</p></section></main>;
  if (error || !profile) return <main className="shell"><section className="hero"><div className="eyebrow">PECATHO</div><h1>Anúncio <em>indisponível.</em></h1><p className="heroCopy">{error || "Este anúncio não está disponível."}</p><Link href="/anunciantes" className="primaryButton">Voltar aos anunciantes</Link></section></main>;

  return <main className="shell"><nav className="topbar"><div className="brand"><span className="brandMark">P</span><span>Pecatho</span></div><Link href="/anunciantes" className="navCta">Ver anunciantes</Link></nav><section className="hero publicProfile"><div className="eyebrow">{category?.name || "ANUNCIANTE"}</div><h1>{profile.title || profile.display_name || "Perfil Pecatho"}</h1><p className="heroCopy">{profile.summary || "Conheça este perfil no Pecatho."}</p><div className="publicProfileGrid"><article className="card"><span className="previewBadge">{profile.verification_status === "verified" ? "VERIFICADO" : "PERFIL PUBLICADO"}</span><h2>{profile.display_name || "Anunciante"}</h2>{city?.name && <p>{city.name}{state?.uf ? ` — ${state.uf}` : ""}</p>}<p>{profile.description || ""}</p></article><ApproximateLocationMap latitude={address?.public_latitude ?? null} longitude={address?.public_longitude ?? null} label="Localização aproximada do anúncio" /></div></section></main>;
}
