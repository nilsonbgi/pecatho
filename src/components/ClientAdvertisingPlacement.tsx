"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type BannerFormat = "leaderboard" | "rectangle" | "square" | "vertical";
type CatalogBanner = {
  id: string;
  title: string | null;
  image_path: string | null;
  link_url: string | null;
  target: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Record<string, unknown> | null;
};

const formats: Record<BannerFormat, { width: number; ratio: string }> = {
  leaderboard: { width: 1200, ratio: "5 / 1" },
  rectangle: { width: 600, ratio: "2 / 1" },
  square: { width: 600, ratio: "1 / 1" },
  vertical: { width: 300, ratio: "1 / 2" },
};

function safeHref(value: string | null) {
  const href = (value || "").trim();
  if (href.startsWith("/") && !href.startsWith("//") && !href.includes("\\")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:" ? href : "/conteudos";
  } catch {
    return "/conteudos";
  }
}

export default function ClientAdvertisingPlacement({ placement }: { placement: "catalog" }) {
  const [banners, setBanners] = useState<CatalogBanner[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,image_path,link_url,target,sort_order,starts_at,ends_at,metadata")
        .eq("active", true)
        .eq("placement", placement)
        .order("sort_order", { ascending: true })
        .limit(30);

      if (!active || error || !data) return;
      const now = Date.now();
      const eligible = (data as CatalogBanner[]).filter((banner) =>
        typeof banner.image_path === "string" &&
        /^https?:\\/\\//i.test(banner.image_path) &&
        (!banner.starts_at || new Date(banner.starts_at).getTime() <= now) &&
        (!banner.ends_at || new Date(banner.ends_at).getTime() >= now)
      );
      setBanners(eligible.slice(0, 8));
    })().catch((error: unknown) => {
      console.error("Falha ao carregar publicidade do catálogo:", error);
    });
    return () => { active = false; };
  }, [placement]);

  if (!banners.length) return null;

  return (
    <section aria-label="Publicidade" className="pecatho-catalog-ad-placement">
      <style>{`
        .pecatho-catalog-ad-placement{width:min(1240px,calc(100% - 32px));margin:0 auto 26px;display:flex;justify-content:center;align-items:flex-start;flex-wrap:wrap;gap:14px}
        .pecatho-catalog-ad-placement a{position:relative;display:block;flex:0 1 auto;width:100%;min-width:0;overflow:hidden;aspect-ratio:5 / 1;border:1px solid rgba(190,160,60,.28);border-radius:14px;background:#101014;color:#fff;text-decoration:none}
        .pecatho-catalog-ad-placement img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
        .pecatho-catalog-ad-placement span{position:absolute;left:12px;bottom:10px;max-width:80%;padding:5px 8px;border-radius:7px;background:rgba(0,0,0,.72);color:#fff;font-size:11px;font-weight:800}
        @media(max-width:560px){.pecatho-catalog-ad-placement{gap:10px;margin-bottom:20px}.pecatho-catalog-ad-placement a{max-width:100%!important}}
      `}</style>
      {banners.map((banner) => {
        const rawFormat = String(banner.metadata?.banner_format || "leaderboard");
        const format: BannerFormat = rawFormat in formats ? rawFormat as BannerFormat : "leaderboard";
        const size = formats[format];
        return (
          <Link
            key={banner.id}
            href={safeHref(banner.link_url)}
            target={banner.target === "_blank" ? "_blank" : undefined}
            rel={banner.target === "_blank" ? "noopener noreferrer" : undefined}
            aria-label={banner.title || "Campanha Pecatho"}
            style={{ maxWidth: size.width, flexBasis: size.width, aspectRatio: size.ratio }}
          >
            <img src={banner.image_path!} alt={banner.title || "Campanha Pecatho"} loading="lazy" />
            {banner.title ? <span>{banner.title}</span> : null}
          </Link>
        );
      })}
    </section>
  );
}
