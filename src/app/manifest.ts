import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pecatho.com.br").replace(/\/$/, "");

  return {
    name: "Pecatho",
    short_name: "Pecatho",
    description: "Descubra perfis, conecte-se e explore o ecossistema Pecatho.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000309",
    theme_color: "#000309",
    lang: "pt-BR",
    dir: "ltr",
    id: siteUrl,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
      {
        src: "/apple-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
