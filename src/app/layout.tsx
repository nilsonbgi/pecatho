import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./anunciantes/discovery.css";
import "./public-profile.css";
import "./public-profile-error.css";
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
  openGraph: { type: "website", locale: "pt_BR", url: "https://pecatho.com.br/", siteName: "Pecatho", title: "Pecatho — Descubra, conecte-se e escolha", description: "Um ecossistema para descobrir perfis, conhecer experiências e acessar o Pecatho Fans." },
  twitter: { card: "summary", title: "Pecatho — Descubra, conecte-se e escolha", description: "Descubra perfis, conecte-se e explore o ecossistema Pecatho." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}<SessionBar /></body></html>;
}
