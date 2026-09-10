import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

type PublicProfile = {
  title: string | null;
  display_name: string | null;
  summary: string | null;
  slug: string | null;
  verification_status: string | null;
  city_id: number | null;
  state_id: number | null;
  category_id: number | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("advertiser_profiles")
    .select("title,display_name,summary,slug,verification_status,city_id,state_id,category_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!profile) {
    return {
      title: "Anúncio não encontrado | Pecatho",
      description: "Este anúncio não está disponível no Pecatho.",
      robots: { index: false, follow: false },
    };
  }

  const typed = profile as PublicProfile;
  const [cityResult, stateResult, categoryResult] = await Promise.all([
    typed.city_id ? supabase.from("cities").select("name").eq("id", typed.city_id).maybeSingle() : Promise.resolve({ data: null }),
    typed.state_id ? supabase.from("states").select("uf,name").eq("id", typed.state_id).maybeSingle() : Promise.resolve({ data: null }),
    typed.category_id ? supabase.from("categories").select("name").eq("id", typed.category_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const name = typed.title || typed.display_name || "Perfil Pecatho";
  const category = categoryResult.data?.name || "Anunciante";
  const location = cityResult.data?.name
    ? `${cityResult.data.name}${stateResult.data?.uf ? ` · ${stateResult.data.uf}` : ""}`
    : "Brasil";
  const description = (typed.summary || `Conheça ${name} no Pecatho.`).slice(0, 160);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pecatho.com.br";
  const canonical = `${baseUrl.replace(/\/$/, "")}/anunciantes/${encodeURIComponent(typed.slug || slug)}`;
  const verified = typed.verification_status === "verified" ? " · Perfil verificado" : "";

  return {
    title: `${name} | ${category} | ${location} | Pecatho`,
    description: `${description}${verified}`.slice(0, 160),
    alternates: { canonical },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "profile",
      url: canonical,
      siteName: "Pecatho",
      title: `${name} | Pecatho`,
      description: `${description}${verified}`.slice(0, 200),
      locale: "pt_BR",
    },
    twitter: {
      card: "summary",
      title: `${name} | Pecatho`,
      description: `${description}${verified}`.slice(0, 200),
    },
  };
}

export default function PublicAdvertiserLayout({ children }: Props) {
  return children;
}
