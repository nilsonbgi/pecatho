import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.pecatho.com").replace(/\/$/, "");
const PAGE_SIZE = 1000;

type PublishedProfile = {
  slug: string | null;
  updated_at: string | null;
};

type PublicPartner = {
  slug: string | null;
  updated_at?: string | null;
};

async function getPublicPartnerSlugs(): Promise<PublicPartner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_partner_venues", { p_slug: null });

  if (error || !data?.length) return [];

  return (data as PublicPartner[]).filter((partner) => Boolean(partner.slug));
}

async function getPublishedProfiles(): Promise<PublishedProfile[]> {
  const supabase = await createClient();
  const profiles: PublishedProfile[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("advertiser_profiles")
      .select("slug,updated_at")
      .eq("status", "published")
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .order("slug", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data?.length) break;

    profiles.push(...(data as PublishedProfile[]));

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return profiles;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [profiles, partners] = await Promise.all([
    getPublishedProfiles(),
    getPublicPartnerSlugs(),
  ]);

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/anunciantes`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.95,
    },
    ...profiles
      .filter((profile) => Boolean(profile.slug))
      .map((profile) => ({
        url: `${siteUrl}/anunciantes/${encodeURIComponent(profile.slug as string)}`,
        lastModified: profile.updated_at ? new Date(profile.updated_at) : now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    {
      url: `${siteUrl}/fans`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/parceiros`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    ...partners.map((partner) => ({
      url: `${siteUrl}/parceiros/${encodeURIComponent(partner.slug as string)}`,
      lastModified: partner.updated_at ? new Date(partner.updated_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
    {
      url: `${siteUrl}/conteudos`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/como-funciona`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/cadastro`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
