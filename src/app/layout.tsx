import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import SessionBar from "@/components/SessionBar";

export const metadata: Metadata = {
  title: "Pecatho",
  description: "Ecossistema Pecatho — anunciantes e Pecatho Fans",
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
