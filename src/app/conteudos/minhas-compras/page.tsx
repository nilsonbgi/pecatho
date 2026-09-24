import { Suspense } from "react";
import MinhasComprasClient from "./MinhasComprasClient";

export const dynamic = "force-dynamic";

export default function MinhasComprasPage() {
  return (
    <Suspense fallback={<main className="min-h-screen grid place-items-center bg-slate-50 p-6"><p>Carregando suas compras…</p></main>}>
      <MinhasComprasClient />
    </Suspense>
  );
}
