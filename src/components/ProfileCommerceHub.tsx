"use client";

import Link from "next/link";

type Props =
  | {
      ownerType: "advertiser";
      ownerId: string;
      fansSlug?: string | null;
      serviceCount: number;
      priceCount: number;
      galleryCount: number;
    }
  | {
      ownerType: "creator";
      creatorSlug: string;
      creatorId: string;
      publicationCount: number;
      planCount: number;
      liveOfferCount: number;
    };

export default function ProfileCommerceHub(props: Props) {
  const isAdvertiser = props.ownerType === "advertiser";

  const cards = isAdvertiser
    ? [
        {
          key: "content",
          kicker: "CONTEÚDO",
          title: "Conteúdo exclusivo",
          text: "Imagens, vídeos e pacotes vendidos diretamente neste perfil.",
          meta: "Compra individual",
          href: "#conteudo-exclusivo",
          count: null,
        },
        {
          key: "services",
          kicker: "SERVIÇOS",
          title: "Serviços e modalidades",
          text: "Consulte os serviços disponibilizados por esta anunciante.",
          meta: props.serviceCount ? `${props.serviceCount} serviço(s)` : "Consulte o perfil",
          href: "#servicos",
          count: props.serviceCount,
        },
        {
          key: "gallery",
          kicker: "GALERIA",
          title: "Fotos e vídeos",
          text: "Veja a mídia pública e as opções de acesso exclusivo.",
          meta: `${props.galleryCount} item(ns) publicado(s)`,
          href: "#galeria",
          count: props.galleryCount,
        },
        ...(props.fansSlug
          ? [
              {
                key: "fans",
                kicker: "PECATHO FANS",
                title: "Assinatura e experiências",
                text: "Acesse o espaço Fans vinculado a este perfil.",
                meta: "Conteúdo + experiências privadas",
                href: `/fans/${props.fansSlug}`,
                count: null,
              },
            ]
          : []),
      ]
    : [
        {
          key: "content",
          kicker: "CONTEÚDO",
          title: "Conteúdo exclusivo",
          text: "Imagens, vídeos e pacotes vendidos diretamente por este criador.",
          meta: "Compra individual",
          href: "#conteudo-exclusivo",
          count: null,
        },
        {
          key: "plans",
          kicker: "ASSINATURA",
          title: "Planos de acesso",
          text: "Escolha um plano recorrente para acompanhar o conteúdo.",
          meta: props.planCount ? `${props.planCount} plano(s) ativo(s)` : "Nenhum plano ativo",
          href: "#assinatura",
          count: props.planCount,
        },
        {
          key: "live",
          kicker: "EXPERIÊNCIA PRIVADA",
          title: "Videochamadas",
          text: "Contrate uma experiência privada diretamente com o criador.",
          meta: props.liveOfferCount ? `${props.liveOfferCount} oferta(s)` : "Nenhuma oferta ativa",
          href: "#videochamadas",
          count: props.liveOfferCount,
        },
        {
          key: "posts",
          kicker: "PUBLICAÇÕES",
          title: "Conteúdo do Fans",
          text: "Explore as publicações abertas, pagas e destinadas a assinantes.",
          meta: `${props.publicationCount} publicação(ões)`,
          href: "#publicacoes",
          count: props.publicationCount,
        },
      ];

  return (
    <section className="mx-auto mt-7 max-w-7xl px-4 sm:mt-8">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,.06)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-violet-950 px-5 py-6 text-white sm:px-7">
          <div className="text-[10px] font-black tracking-[.2em] text-violet-300">
            EXPERIÊNCIA COMERCIAL · PECATHO
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-.045em] sm:text-3xl">
                Escolha como interagir com este perfil
              </h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-300 sm:text-sm">
                Conteúdo, serviços e experiências ficam organizados em um único ponto de entrada.
                Escolha uma opção abaixo para continuar.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[9px] font-black tracking-[.12em] text-white/60">
              PERFIL MONETIZADO
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          {cards.map((card) => {
            const internal = card.href.startsWith("/");
            return internal ? (
              <Link
                key={card.key}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 no-underline transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"
              >
                <CardContent card={card} />
              </Link>
            ) : (
              <a
                key={card.key}
                href={card.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 no-underline transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"
              >
                <CardContent card={card} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CardContent({
  card,
}: {
  card: {
    kicker: string;
    title: string;
    text: string;
    meta: string;
    count: number | null;
  };
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[9px] font-black tracking-[.15em] text-violet-600">
          {card.kicker}
        </span>
        {card.count !== null && (
          <span className="rounded-full bg-slate-200 px-2 py-1 text-[9px] font-black text-slate-600">
            {card.count}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-.025em] text-slate-950">
        {card.title}
      </h3>
      <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{card.text}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <span className="text-[10px] font-bold text-slate-400">{card.meta}</span>
        <span className="text-xs font-black text-violet-600 transition group-hover:translate-x-0.5">
          Abrir →
        </span>
      </div>
    </>
  );
}
