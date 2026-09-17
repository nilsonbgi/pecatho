import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./anunciantes/discovery.css";
import "./anunciantes/discovery-state.css";
import "./public-profile.css";
import "./public-profile-error.css";
import "./public-profile-not-found.css";
import "./home-editorial.css";
import SessionBar from "@/components/SessionBar";

export const metadata: Metadata = {
  metadataBase: new URL("https://pecatho.com.br"),
  title: {
    default: "Pecatho — Descubra, conecte-se e escolha",
    template: "%s | Pecatho",
  },
  description: "Pecatho reúne descoberta de anunciantes, perfis completos e a experiência Pecatho Fans em um único ecossistema.",
  applicationName: "Pecatho",
  generator: "Next.js",
  keywords: ["Pecatho", "anunciantes", "perfis", "Pecatho Fans", "conteúdo", "descoberta"],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://pecatho.com.br/",
    siteName: "Pecatho",
    title: "Pecatho — Descubra, conecte-se e escolha",
    description: "Um ecossistema para descobrir perfis, conhecer experiências e acessar o Pecatho Fans.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pecatho — Descubra, conecte-se e escolha",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pecatho — Descubra, conecte-se e escolha",
    description: "Descubra perfis, conecte-se e explore o ecossistema Pecatho.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000309",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <SessionBar />
      </body>
    </html>
  );
}
