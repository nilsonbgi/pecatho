import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type BannerFormat = "leaderboard" | "rectangle" | "square" | "vertical";
type BannerRow = {
  id: string;
  title: string | null;
  image_path: string | null;
  link_url: string | null;
  target: string | null;
  placement: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Record<string, unknown> | null;
};

function isSafeCampaignLink(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const formats: Record<BannerFormat, { width: number; ratio: string }> = {
  leaderboard: { width: 1200, ratio: "5 / 1" },
  rectangle: { width: 600, ratio: "2 / 1" },
  square: { width: 600, ratio: "1 / 1" },
  vertical: { width: 300, ratio: "1 / 2" },
};

export default async function AdvertisingPlacement({ placement }: { placement: "fans" | "catalog" }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("id,title,image_path,link_url,target,placement,sort_order,starts_at,ends_at,metadata")
    .eq("active", true)
    .eq("placement", placement)
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .order("sort_order", { ascending: true })
    .limit(30);

  if (error || !data?.length) return null;
  const banners = (data as BannerRow[])
    .filter((banner) =>
      typeof banner.image_path === "string" &&
      /^https?:\/\//i.test(banner.image_path)
    )
    .slice(0, 8);
  if (!banners.length) return null;

  return (
    <section aria-label="Publicidade" className="pecatho-ad-placement">
      <style>{`
        .pecatho-ad-placement{width:100%;margin:22px auto 28px;display:flex;justify-content:center;align-items:flex-start;flex-wrap:wrap;gap:14px}
        .pecatho-ad-placement a{position:relative;display:block;flex:0 1 auto;width:100%;min-width:0;overflow:hidden;aspect-ratio:5 / 1;border:1px solid rgba(190,160,60,.28);border-radius:14px;background:#101014;color:#fff;text-decoration:none}
        .pecatho-ad-placement img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
        .pecatho-ad-placement span{position:absolute;left:12px;bottom:10px;max-width:80%;padding:5px 8px;border-radius:7px;background:rgba(0,0,0,.72);color:#fff;font-size:11px;font-weight:800}
        @media(max-width:560px){.pecatho-ad-placement{gap:10px;margin:18px auto 22px}.pecatho-ad-placement a{max-width:100%!important}}
      `}</style>
      {banners.map((banner) => {
        const raw = String(banner.metadata?.banner_format || "leaderboard");
        const format: BannerFormat = raw in formats ? raw as BannerFormat : "leaderboard";
        const size = formats[format];
        const requestedHref = (banner.link_url || "").trim();
        const href = isSafeCampaignLink(requestedHref) && requestedHref
          ? requestedHref
          : (placement === "fans" ? "/fans" : "/conteudos");
        return (
          <Link
            key={banner.id}
            href={href}
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
