"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();

  if (!displayName) {
    redirect("/fans/gerenciar/perfil?error=Informe+o+nome+publico");
  }

  if (displayName.length > 80) {
    redirect("/fans/gerenciar/perfil?error=O+nome+publico+deve+ter+no+maximo+80+caracteres");
  }

  if (bio.length > 2000) {
    redirect("/fans/gerenciar/perfil?error=A+apresentacao+deve+ter+no+maximo+2000+caracteres");
  }

  if (avatarUrl.length > 1000) {
    redirect("/fans/gerenciar/perfil?error=A+URL+da+imagem+e+muito+longa");
  }

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id,slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) redirect("/fans/ativar");

  const { error } = await supabase
    .from("fans_creators")
    .update({
      display_name: displayName,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creator.id)
    .eq("user_id", user.id);

  if (error) {
    redirect("/fans/gerenciar/perfil?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/fans/gerenciar/perfil");
  revalidatePath("/fans/gerenciar");
  revalidatePath("/fans/" + creator.slug);
  redirect("/fans/gerenciar/perfil?saved=1");
}

export default async function FansProfileManagePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: creator } = await supabase
    .from("fans_creators")
    .select("id,slug,display_name,bio,status,avatar_url,advertiser_profile_id,created_at,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!creator) redirect("/fans/ativar");

  return (
    <main className="shell fansShell">
      <nav className="topbar">
        <div className="brand"><span className="brandMark">P</span><span>Pecatho <small>Fans</small></span></div>
        <div className="navLinks">
          <Link href="/fans/gerenciar">Central</Link>
          <Link href={`/fans/${creator.slug}`}>Ver perfil</Link>
        </div>
      </nav>

      <section className="hero fansHero">
        <div className="eyebrow">IDENTIDADE PÚBLICA · PECATHO FANS</div>
        <h1>Seu perfil de <em>criador.</em></h1>
        <p className="heroCopy">
          Controle aqui a apresentação que sua audiência encontra no Fans. Nome, imagem e apresentação são a base da sua vitrine comercial.
        </p>

        {params.saved === "1" && (
          <div className="profileNotice success" role="status">
            Perfil atualizado com sucesso. As alterações já foram preparadas para a página pública.
          </div>
        )}

        {params.error && (
          <div className="profileNotice error" role="alert">
            {params.error}
          </div>
        )}

        <div className="profileLayout">
          <section className="card profileEditor">
            <div className="sectionKicker">APRESENTAÇÃO</div>
            <h2>Como você aparece para os fãs</h2>
            <p className="sectionCopy">
              Use uma apresentação clara e uma imagem que representem sua identidade. O espaço pode ser usado para conteúdo, assinaturas, publicações e experiências privadas.
            </p>

            <form action={saveProfile} className="profileForm">
              <label>
                <span>Nome público</span>
                <input
                  name="display_name"
                  defaultValue={creator.display_name || ""}
                  maxLength={80}
                  required
                  placeholder="Como você quer ser conhecido no Fans"
                />
                <small>Este é o nome principal exibido no seu perfil público.</small>
              </label>

              <label>
                <span>Apresentação</span>
                <textarea
                  name="bio"
                  defaultValue={creator.bio || ""}
                  maxLength={2000}
                  rows={8}
                  placeholder="Conte aos seus fãs quem você é, o que publica e que tipo de experiência oferece."
                />
                <small>Até 2.000 caracteres. Evite inserir telefone, documentos ou dados sensíveis.</small>
              </label>

              <label>
                <span>URL da imagem de perfil</span>
                <input
                  name="avatar_url"
                  type="url"
                  defaultValue={creator.avatar_url || ""}
                  maxLength={1000}
                  placeholder="https://..."
                />
                <small>Informe uma imagem pública já hospedada. O campo pode ficar vazio.</small>
              </label>

              <div className="formActions">
                <Link className="secondaryButton" href="/fans/gerenciar">Cancelar</Link>
                <button className="primaryButton" type="submit">Salvar perfil</button>
              </div>
            </form>
          </section>

          <aside className="profileAside">
            <section className="card previewCard">
              <div className="sectionKicker">PRÉVIA</div>
              <div className="avatarPreview">
                {creator.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={creator.avatar_url} alt="" />
                ) : (
                  <span>{(creator.display_name || "P").slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <h2>{creator.display_name}</h2>
              <p>{creator.bio || "Sua apresentação aparecerá aqui quando você preencher o perfil."}</p>
              <span className="statusPill">{creator.status === "active" ? "● PERFIL ATIVO" : creator.status}</span>
              <Link className="primaryButton fullButton" href={`/fans/${creator.slug}`}>Abrir perfil público →</Link>
            </section>

            <section className="card identityCard">
              <div className="sectionKicker">ENDEREÇO PÚBLICO</div>
              <strong>/fans/{creator.slug}</strong>
              <p>O endereço público atual é preservado para não quebrar links já compartilhados.</p>
            </section>

            {creator.advertiser_profile_id && (
              <section className="card identityCard">
                <div className="sectionKicker">ECOSSISTEMA PECATHO</div>
                <strong>Perfil de anunciante vinculado</strong>
                <p>Seu espaço Fans permanece conectado ao ecossistema de anúncios, sem substituir o perfil de serviços.</p>
              </section>
            )}
          </aside>
        </div>
      </section>

      <style>{`
        .profileNotice{margin-top:18px;border-radius:14px;padding:13px 15px;font-size:11px;font-weight:750;line-height:1.5}
        .profileNotice.success{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
        .profileNotice.error{background:#fff1f2;border:1px solid #fecdd3;color:#be123c}
        .profileLayout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.7fr);gap:14px;margin-top:22px}
        .profileEditor{padding:25px}
        .profileAside{display:grid;gap:14px;align-content:start}
        .sectionKicker{font-size:9px;letter-spacing:.18em;font-weight:900;color:#7c3aed}
        .profileEditor h2,.previewCard h2{font-size:24px;letter-spacing:-.045em;margin:7px 0}
        .sectionCopy{font-size:11px;color:#687181;line-height:1.7;max-width:680px}
        .profileForm{display:grid;gap:18px;margin-top:22px}
        .profileForm label{display:grid;gap:7px}
        .profileForm label>span{font-size:11px;font-weight:900;color:#111827}
        .profileForm input,.profileForm textarea{width:100%;border:1px solid #dfe3e8;border-radius:13px;background:#fff;padding:12px 13px;font:inherit;font-size:12px;color:#111827;outline:none;box-sizing:border-box}
        .profileForm textarea{resize:vertical;min-height:160px;line-height:1.6}
        .profileForm input:focus,.profileForm textarea:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.09)}
        .profileForm small{font-size:9px;color:#7a8290;line-height:1.5}
        .formActions{display:flex;justify-content:flex-end;gap:9px;padding-top:5px}
        .previewCard,.identityCard{padding:22px}
        .avatarPreview{width:108px;height:108px;border-radius:28px;background:#111827;overflow:hidden;display:grid;place-items:center;color:#fff;font-size:42px;font-weight:950;margin:16px 0}
        .avatarPreview img{width:100%;height:100%;object-fit:cover}
        .previewCard h2{font-size:21px}
        .previewCard p,.identityCard p{font-size:11px;line-height:1.65;color:#6b7280}
        .statusPill{display:inline-flex;margin-top:10px;border-radius:999px;background:#ecfdf5;border:1px solid #bbf7d0;color:#047857;padding:7px 9px;font-size:9px;font-weight:900}
        .fullButton{display:flex!important;justify-content:center;margin-top:16px}
        .identityCard strong{display:block;margin-top:10px;font-size:12px;word-break:break-all}
        @media(max-width:800px){.profileLayout{grid-template-columns:1fr}.profileAside{grid-template-columns:1fr 1fr}.previewCard{grid-column:1/-1}}
        @media(max-width:560px){.profileAside{grid-template-columns:1fr}.profileEditor{padding:19px}.formActions{display:grid;grid-template-columns:1fr}.formActions>*{text-align:center;justify-content:center}.avatarPreview{width:92px;height:92px;border-radius:24px}}
      `}</style>
    </main>
  );
}
