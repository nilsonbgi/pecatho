"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import ApproximateLocationMap from "@/components/ApproximateLocationMap";

type Profile = { id: string; user_id: string; title: string | null; display_name: string | null; summary: string | null; description: string | null; status: string; verification_status: string | null; city_id: number | null; state_id: number | null; category_id: number | null; social_links: Record<string, string> | null };
type Address = { public_latitude: number | null; public_longitude: number | null };
type Media = { id: string; profile_id: string; storage_bucket: string; storage_path: string; preview_storage_bucket: string | null; preview_storage_path: string | null; kind: string; access_type: "public" | "paid"; price: number; currency: string; is_primary: boolean; sort_order: number; moderation_status: string };
type Review = { id: string; rating: number | null; comment: string | null; created_at: string; experience_verified: boolean };
type City = { name: string };
type State = { uf: string; name: string };
type Category = { name: string };
type FansCreator = { slug: string; display_name: string; bio: string | null; status: string };

type GalleryItem = Media & { url: string | null; previewUrl: string | null; unlockedUrl?: string };

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function publicUrl(supabase: ReturnType<typeof createClient>, bucket: string | null, path: string | null) {
  if (!bucket || !path) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl || null;
}

export default function PublicAdvertiserPage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [city, setCity] = useState<City | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [fans, setFans] = useState<FansCreator | null>(null);
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mediaTab, setMediaTab] = useState<"all" | "image" | "video">("all");
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data: p, error: profileError } = await supabase
        .from("advertiser_profiles")
        .select("id,user_id,title,display_name,summary,description,status,verification_status,city_id,state_id,category_id,social_links")
        .eq("slug", params.slug)
        .eq("status", "published")
        .maybeSingle();
      if (profileError || !p) {
        if (active) { setError("Anúncio não encontrado ou ainda não publicado."); setLoading(false); }
        return;
      }
      const typed = p as Profile;
      const [a, c, s, cat, mediaResult, reviewResult, fansResult] = await Promise.all([
        supabase.from("user_addresses").select("public_latitude,public_longitude").eq("user_id", typed.user_id).eq("is_primary", true).maybeSingle(),
        typed.city_id ? supabase.from("cities").select("name").eq("id", typed.city_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        typed.state_id ? supabase.from("states").select("uf,name").eq("id", typed.state_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        typed.category_id ? supabase.from("categories").select("name").eq("id", typed.category_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from("profile_media").select("id,profile_id,storage_bucket,storage_path,preview_storage_bucket,preview_storage_path,kind,access_type,price,currency,is_primary,sort_order,moderation_status").eq("profile_id", typed.id).eq("moderation_status", "approved").order("sort_order"),
        supabase.from("profile_feedback").select("id,rating,comment,created_at,experience_verified").eq("profile_id", typed.id).eq("status", "approved").eq("experience_verified", true).order("created_at", { ascending: false }).limit(12),
        supabase.from("fans_creators").select("slug,display_name,bio,status").eq("advertiser_profile_id", typed.id).eq("status", "active").maybeSingle(),
      ]);
      const gallery = ((mediaResult.data ?? []) as Media[]).map((item) => ({
        ...item,
        url: item.access_type === "public" ? publicUrl(supabase, item.storage_bucket, item.storage_path) : null,
        previewUrl: item.access_type === "paid" ? publicUrl(supabase, item.preview_storage_bucket, item.preview_storage_path) : null,
      }));
      if (!active) return;
      setProfile(typed); setAddress((a.data as Address | null) || null); setCity((c.data as City | null) || null); setState((s.data as State | null) || null); setCategory((cat.data as Category | null) || null); setFans((fansResult.data as FansCreator | null) || null); setMedia(gallery); setReviews((reviewResult.data ?? []) as Review[]); setLoading(false);
    })().catch((err) => { console.error(err); if (active) { setError("Não foi possível carregar este perfil."); setLoading(false); } });
    return () => { active = false; };
  }, [params.slug]);

  const filteredMedia = useMemo(() => media.filter((item) => mediaTab === "all" || item.kind === mediaTab), [media, mediaTab]);
  const averageRating = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length : 0;
  const publicImages = media.filter((item) => item.kind === "image").length;
  const publicVideos = media.filter((item) => item.kind === "video").length;
  const socialLinks = Object.entries(profile?.social_links || {}).filter(([, value]) => Boolean(value));

  async function unlock(item: GalleryItem) {
    setUnlocking(item.id); setNotice("");
    try {
      const supabase = createClient();
      const { data, error: fnError } = await supabase.functions.invoke("get-advertiser-media-access", { body: { media_id: item.id } });
      if (fnError) throw fnError;
      if (!data?.url) { setNotice(data?.error || "O conteúdo ainda não está disponível para este usuário."); return; }
      setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, unlockedUrl: data.url } : entry));
    } catch (err) {
      console.error(err);
      setNotice("Este conteúdo é pago. O acesso só é liberado após a confirmação do pagamento.");
    } finally { setUnlocking(null); }
  }

  if (loading) return <main className="shell"><section className="hero"><p>Carregando anúncio...</p></section></main>;
  if (error || !profile) return <main className="shell"><section className="hero"><div className="eyebrow">PECATHO</div><h1>Anúncio <em>indisponível.</em></h1><p className="heroCopy">{error || "Este anúncio não está disponível."}</p><Link href="/anunciantes" className="primaryButton">Voltar aos anunciantes</Link></section></main>;

  return (
    <main className="shell publicProfile">
      <nav className="topbar"><Link href="/" className="brand"><span className="brandMark">P</span><span>Pecatho</span></Link><Link href="/anunciantes" className="navCta">Ver anunciantes</Link></nav>

      <section className="publicProfileHero">
        <div className="eyebrow">{category?.name || "ANUNCIANTE"}</div>
        <div className="profileTitleRow"><div><h1>{profile.title || profile.display_name || "Perfil Pecatho"}</h1><p className="heroCopy">{profile.summary || "Conheça este perfil no Pecatho."}</p></div><div className="profileTrust">{profile.verification_status === "verified" ? <span>✓ PERFIL VERIFICADO</span> : <span>PERFIL PUBLICADO</span>}{reviews.length > 0 && <strong>★ {averageRating.toFixed(1)} <small>({reviews.length} avaliações)</small></strong>}</div></div>
        <div className="profileStats"><span>📷 {publicImages} fotos</span><span>▶ {publicVideos} vídeos</span><span>★ {reviews.length} avaliações verificadas</span>{city?.name && <span>⌖ {city.name}{state?.uf ? ` · ${state.uf}` : ""}</span>}</div>
      </section>

      <section className="profileMediaSection">
        <div className="sectionHeading"><div><div className="eyebrow">GALERIA</div><h2>Fotos e vídeos</h2><p>Conteúdo público e conteúdo exclusivo com acesso pago definido pela própria anunciante.</p></div><div className="mediaTabs"><button className={mediaTab === "all" ? "active" : ""} onClick={() => setMediaTab("all")}>Tudo</button><button className={mediaTab === "image" ? "active" : ""} onClick={() => setMediaTab("image")}>Fotos</button><button className={mediaTab === "video" ? "active" : ""} onClick={() => setMediaTab("video")}>Vídeos</button></div></div>
        {notice && <div className="mediaNotice">{notice}</div>}
        {filteredMedia.length === 0 ? <div className="emptyDiscovery"><h2>Galeria em preparação</h2><p>Esta anunciante ainda não publicou mídia aprovada nesta categoria.</p></div> : <div className="profileGallery">{filteredMedia.map((item) => {
          const unlocked = Boolean(item.unlockedUrl);
          const src = unlocked ? item.unlockedUrl : item.url || item.previewUrl;
          const isVideo = item.kind === "video";
          return <article className={`profileMediaCard ${item.access_type === "paid" ? "paid" : "public"}`} key={item.id}>
            <div className="profileMediaVisual">{src ? (isVideo && unlocked ? <video src={src} controls playsInline preload="metadata" /> : <img src={src} alt={item.access_type === "paid" ? "Prévia de conteúdo exclusivo" : "Foto do perfil"} />) : <div className="lockedMedia"><span>{isVideo ? "▶" : "✦"}</span><strong>Conteúdo exclusivo</strong><small>Prévia não publicada</small></div>}
              {item.access_type === "paid" && !unlocked && <div className="paidOverlay"><span>🔒 EXCLUSIVO</span><strong>{brl(Number(item.price))}</strong><button type="button" onClick={() => unlock(item)} disabled={unlocking === item.id}>{unlocking === item.id ? "Verificando acesso..." : "Desbloquear conteúdo"}</button></div>}
              {item.access_type === "public" && <span className="mediaBadge">PÚBLICO</span>}
            </div>
          </article>;
        })}</div>}
      </section>

      <section className="profileContentGrid">
        <article className="card profileAbout"><div className="eyebrow">SOBRE</div><h2>{profile.display_name || "Anunciante"}</h2><p>{profile.description || "A anunciante ainda não adicionou uma apresentação detalhada."}</p>{socialLinks.length > 0 && <div className="profileLinks"><strong>Redes e presença digital</strong>{socialLinks.map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={label}>{label}</a>)}</div>}{fans && <div className="fansCta"><div><span>PECATHO FANS</span><strong>{fans.display_name}</strong><p>{fans.bio || "Conteúdo exclusivo diretamente no ecossistema Pecatho."}</p></div><Link href={`/fans/${fans.slug}`} className="primaryButton">Ver conteúdo exclusivo</Link></div>}</article>
        <ApproximateLocationMap latitude={address?.public_latitude ?? null} longitude={address?.public_longitude ?? null} label="Localização aproximada do anúncio" />
      </section>

      <section className="profileReviews"><div className="sectionHeading"><div><div className="eyebrow">EXPERIÊNCIAS VERIFICADAS</div><h2>Avaliações de quem utilizou os serviços</h2><p>Somente experiências verificadas e aprovadas pela moderação entram no rating público.</p></div>{reviews.length > 0 && <div className="ratingBig"><strong>★ {averageRating.toFixed(1)}</strong><span>{reviews.length} avaliações</span></div>}</div>{reviews.length === 0 ? <div className="emptyDiscovery"><h2>Ainda não há avaliações publicadas.</h2><p>Quando houver experiências verificadas, os comentários aparecerão aqui.</p></div> : <div className="reviewGrid">{reviews.map((review) => <article className="reviewCard" key={review.id}><div className="reviewStars">{"★".repeat(Math.max(0, Math.min(5, Number(review.rating || 0))))}<span>{review.experience_verified ? "✓ Experiência verificada" : ""}</span></div><p>{review.comment || "O usuário não deixou comentário."}</p><small>{new Date(review.created_at).toLocaleDateString("pt-BR")}</small></article>)}</div>}</section>

      <footer><span>Pecatho · experiência pública da anunciante</span><Link href="/anunciantes">Voltar para a busca</Link></footer>
    </main>
  );
}
