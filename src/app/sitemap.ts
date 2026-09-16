import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pecatho.com.br").replace(/\/$/, "");

type PublishedProfile = {
  slug: string | null;
  updated_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const supabase = await createClient();
  const { data } = await supabase
    .from("advertiser_profiles")
    .select("slug,updated_at")
    .eq("status", "published")
    .not("slug", "is", null)
    .order("updated_at", { ascending: false });

  const profiles = (data || []) as PublishedProfile[];

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
