import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type BoostedDiscoveryPost = {
  id: string;
  title: string;
  access_type: "free" | "paid" | "subscriber";
  price: number;
  currency: string;
  creator_id: string;
  creator_slug: string;
  creator_name: string;
  multiplier: number;
  ends_at: string;
};

type PublicFansCreator = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  status: string;
  avatar_url: string | null;
  reputation_score?: number;
  reputation_level?: string;
  positive_likes?: number;
  visible_comments?: number;
  positive_reactions?: number;
  plan_featured_card?: boolean;
  plan_premium_badge?: boolean;
  plan_profile_theme?: "standard" | "highlighted" | "premium";
  plan_search_priority?: number;
};

function summarizeCreatorBio(value: string | null, maxLength = 132): string {
  const plain = (value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\[(?:\/?cor)(?:=[^\]]*)?\]/gi, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-•]\s*/gm, "")
    .replace(/[#*_\x60~>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "Conteúdos e experiências exclusivas no Pecatho Fans.";
  return plain.length > maxLength ? plain.slice(0, maxLength).trimEnd() + "…" : plain;
}

export default async function FansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: creator } = user
    ? await supabase.from("fans_creators").select("id,slug,display_name,bio,status,avatar_url").eq("user_id", user.id).maybeSingle()
    : { data: null };

  let plansCount = 0;
  let postsCount = 0;

  const [
    { data: creators },
    { data: creatorsTotal },
    { data: creatorPlans },
    { data: creatorOffers },
  ] = await Promise.all([
    supabase.rpc("get_public_fans_creator_leaderboard", { p_limit: 24 }),
    supabase.rpc("get_public_fans_creators_count"),
    supabase.from("fans_plans").select("creator_id").eq("status", "active"),
    supabase.from("fans_live_offers").select("creator_id").eq("status", "active"),
  ]);

  const publicCreators = (creators ?? []) as PublicFansCreator[];
  const creatorIds = publicCreators.map((item) => item.id);
  let creatorPresentationRows: Array<{ creator_id: string; featured_card: boolean; show_premium_badge: boolean; profile_theme: "standard" | "highlighted" | "premium"; search_priority: number }> = [];
  if (creatorIds.length) {
    try {
      const { data } = await createAdminClient().rpc("get_public_fans_creator_plan_features", { p_creator_ids: creatorIds });
      creatorPresentationRows = (data ?? []) as typeof creatorPresentationRows;
    } catch {
      creatorPresentationRows = [];
    }
  }
  const creatorPresentationMap = new Map(creatorPresentationRows.map((item) => [item.creator_id, item]));
  for (let index = 0; index < publicCreators.length; index++) {
    const item = publicCreators[index];
    const presentation = creatorPresentationMap.get(item.id);
    publicCreators[index] = {
      ...item,
      plan_featured_card: presentation?.featured_card === true,
      plan_premium_badge: presentation?.show_premium_badge === true,
      plan_profile_theme: presentation?.profile_theme ?? "standard",
      plan_search_priority: presentation?.search_priority ?? 0,
    };
  }
  publicCreators.sort((a, b) =>
    Number(Boolean(b.plan_featured_card)) - Number(Boolean(a.plan_featured_card)) ||
    Number(b.plan_search_priority || 0) - Number(a.plan_search_priority || 0)
  );
  const planMap = new Map<string, number>();
  const offerMap = new Map<string, number>();

  for (const item of creatorPlans || []) {
    planMap.set(item.creator_id, (planMap.get(item.creator_id) || 0) + 1);
  }

  for (const item of creatorOffers || []) {
    offerMap.set(item.creator_id, (offerMap.get(item.creator_id) || 0) + 1);
  }

  if (creator !== null) {
    const [{ count: plans }, { count: posts }] = await Promise.all([
      supabase.from("fans_plans").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
      supabase.from("fans_posts").select("id", { count: "exact", head: true }).eq("creator_id", creator.id),
    ]);
    plansCount = plans || 0;
    postsCount = posts || 0;
  }

  let boostedDiscoveryPosts: BoostedDiscoveryPost[] = [];
  try {
    const boostClient = createAdminClient();
    const now = new Date().toISOString();
    const [{ data: activeBoostRows }, { data: boostPlans }] = await Promise.all([
      boostClient.from("fans_boosts")
        .select("post_id,creator_id,plan_id,ends_at")
        .eq("status", "active")
        .gt("ends_at", now)
        .order("ends_at", { ascending: false })
        .limit(30),
      boostClient.from("fans_boost_plans")
        .select("id,multiplier")
        .eq("status", "active"),
    ]);
    const boostRows = activeBoostRows ?? [];
    const postIds = [...new Set(boostRows.map((row) => row.post_id))];
    const creatorIdsForBoosts = [...new Set(boostRows.map((row) => row.creator_id))];
    if (postIds.length > 0 && creatorIdsForBoosts.length > 0) {
      const [{ data: boostedPosts }, { data: boostCreators }] = await Promise.all([
        boostClient.from("fans_posts")
          .select("id,title,access_type,price,currency,creator_id,published_at,created_at")
          .in("id", postIds)
          .eq("status", "published"),
        boostClient.from("fans_creators")
          .select("id,slug,display_name,status")
          .in("id", creatorIdsForBoosts)
          .eq("status", "active"),
      ]);
      const multiplierByPlan = new Map((boostPlans ?? []).map((plan) => [plan.id, Number(plan.multiplier) || 1]));
      const creatorById = new Map((boostCreators ?? []).map((item) => [item.id, item]));
      const postById = new Map((boostedPosts ?? []).map((item) => [item.id, item]));
      boostedDiscoveryPosts = boostRows
        .map((boost) => {
          const post = postById.get(boost.post_id);
          const boostedCreator = creatorById.get(boost.creator_id);
          if (!post || !boostedCreator || post.creator_id !== boostedCreator.id) return null;
          return {
            id: post.id,
            title: post.title,
            access_type: post.access_type as "free" | "paid" | "subscriber",
            price: Number(post.price) || 0,
            currency: post.currency || "BRL",
            creator_id: boostedCreator.id,
            creator_slug: boostedCreator.slug,
            creator_name: boostedCreator.display_name,
            multiplier: multiplierByPlan.get(boost.plan_id) ?? 1,
            ends_at: boost.ends_at,
          };
        })
        .filter((item): item is BoostedDiscoveryPost => item !== null)
        .sort((a, b) => b.multiplier - a.multiplier || new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime())
        .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
        .slice(0, 6);
      if (boostedDiscoveryPosts.length > 0) {
        await boostClient.rpc("record_fans_boost_exposures", {
          p_post_ids: boostedDiscoveryPosts.map((post) => post.id),
        });
      }
    }
  } catch {
    boostedDiscoveryPosts = [];
  }

  const featuredCreators = publicCreators.slice(0, 6);
  const discoveryCreators = publicCreators.slice(0, 12);
  const heroCreator = featuredCreators[0] || null;
  const creatorCountLabel = creatorsTotal && creatorsTotal > 0 ? creatorsTotal.toLocaleString("pt-BR") : "0";
  const userInitial = user?.email?.slice(0, 1).toUpperCase() || "F";

  return (
    <main className="fansHome">
      <style>{`
        .fansHome{min-height:100vh;background:#070707;color:#f7f5ef;overflow:hidden}
        .fansHome *{box-sizing:border-box}
        .fansPageWrap{width:min(1440px,100%);margin:auto;padding:0 42px}
        .fansTopbar{height:86px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(231,195,63,.11);position:relative;z-index:10}
        .fansLogo{display:flex;align-items:center;gap:12px;color:#f4c94f;text-decoration:none;white-space:nowrap}
        .fansLogoMark{width:42px;height:42px;display:grid;place-items:center;border:1px solid rgba(231,195,63,.65);border-radius:12px;background:linear-gradient(145deg,rgba(231,195,63,.2),rgba(231,195,63,.03));box-shadow:0 0 28px rgba(231,195,63,.08);font-weight:950;font-size:20px}
        .fansLogoText{font-size:23px;letter-spacing:.14em;font-weight:900;text-transform:uppercase}
        .fansLogoText small{display:block;color:#8e8b82;font-size:8px;letter-spacing:.28em;margin-top:2px;font-weight:700}
        .fansMainNav{display:flex;align-items:center;gap:30px;margin-left:30px}
        .fansMainNav a{color:#a9a69e;text-decoration:none;font-size:13px;font-weight:650;transition:.2s}
        .fansMainNav a:hover,.fansMainNav a.active{color:#f1c94d}
        .fansTopActions{display:flex;align-items:center;gap:10px}
        .fansSearch{height:42px;width:215px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.045);display:flex;align-items:center;gap:9px;padding:0 13px;color:#77746e;font-size:11px}
        .fansSearchIcon{font-size:17px;color:#aaa59b}
        .fansIconBtn{width:42px;height:42px;border:1px solid rgba(255,255,255,.09);border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.04);color:#d8d4c9;text-decoration:none;font-size:16px}
        .fansAvatarMini{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#d8b33d,#8b681b);color:#090909;font-size:13px;font-weight:950;border:2px solid rgba(255,255,255,.13)}
        .fansHero{position:relative;min-height:650px;display:grid;grid-template-columns:1.03fr .97fr;align-items:center;gap:24px;padding:72px 0 62px}
        .fansHero:before{content:"";position:absolute;left:-300px;top:-240px;width:720px;height:720px;border-radius:50%;background:radial-gradient(circle,rgba(231,195,63,.09),transparent 68%);pointer-events:none}
        .fansHero:after{content:"";position:absolute;right:-330px;bottom:-300px;width:780px;height:780px;border-radius:50%;background:radial-gradient(circle,rgba(231,195,63,.08),transparent 67%);pointer-events:none}
        .fansHeroCopy{position:relative;z-index:2;padding:18px 0 20px}
        .fansEyebrow{display:flex;align-items:center;gap:10px;color:#e7c33f;font-size:11px;letter-spacing:.2em;font-weight:900;text-transform:uppercase}
        .fansEyebrow:before{content:"";width:28px;height:1px;background:#e7c33f}
        .fansHero h1{font-size:clamp(52px,6vw,88px);line-height:.94;letter-spacing:-.065em;margin:20px 0 25px;max-width:760px}
        .fansHero h1 span{color:#e7c33f}
        .fansLead{font-size:17px;line-height:1.75;color:#a8a49b;max-width:620px;margin:0}
        .fansActions{display:flex;gap:11px;flex-wrap:wrap;margin-top:32px}
        .fansPrimary,.fansSecondary{min-height:49px;padding:0 20px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:12px;font-weight:900;letter-spacing:.01em}
        .fansPrimary{background:linear-gradient(135deg,#f3d06a,#dcae31);color:#111;box-shadow:0 12px 30px rgba(231,195,63,.15)}
        .fansSecondary{border:1px solid rgba(231,195,63,.34);color:#e7c33f;background:rgba(231,195,63,.035)}
        .fansBenefits{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:46px;max-width:720px}
        .fansBenefit{display:flex;gap:11px;align-items:flex-start}
        .fansBenefitIcon{width:36px;height:36px;border-radius:11px;border:1px solid rgba(231,195,63,.2);background:rgba(231,195,63,.06);display:grid;place-items:center;color:#e7c33f;font-size:16px;flex:none}
        .fansBenefit strong{display:block;font-size:12px;color:#eeeae0}
        .fansBenefit span{display:block;color:#77736b;font-size:10px;margin-top:4px;line-height:1.4}
        .fansHeroVisual{position:relative;min-height:570px;display:flex;align-items:center;justify-content:center}
        .fansHeroGlow{position:absolute;width:470px;height:470px;border-radius:50%;background:radial-gradient(circle,rgba(231,195,63,.15),transparent 65%);filter:blur(8px)}
        .fansHeroImage{position:relative;width:min(430px,82%);height:510px;border-radius:210px 210px 28px 28px;overflow:hidden;border:1px solid rgba(231,195,63,.22);box-shadow:0 35px 100px rgba(0,0,0,.6)}
        .fansHeroImage img{width:100%;height:100%;object-fit:cover}
        .fansHeroImageFallback{height:100%;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#4a3a1c,#16140e 45%,#080808 75%);font-size:100px;font-weight:950;color:#e7c33f}
        .fansHeroImage:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 48%,rgba(0,0,0,.66) 100%)}
        .fansHeroCreatorTag{position:absolute;z-index:3;left:-42px;bottom:44px;border:1px solid rgba(231,195,63,.25);background:rgba(15,14,11,.88);backdrop-filter:blur(14px);border-radius:16px;padding:13px 16px;min-width:225px;box-shadow:0 20px 50px rgba(0,0,0,.35)}
        .fansHeroCreatorTag small{display:block;color:#8f8b80;font-size:9px;letter-spacing:.15em}
        .fansHeroCreatorTag strong{display:block;color:#f1eee6;font-size:14px;margin-top:4px}
        .fansHeroCreatorTag span{display:block;color:#e7c33f;font-size:10px;margin-top:5px}
        .fansHeroBadge{position:absolute;z-index:3;right:-12px;top:84px;border:1px solid rgba(231,195,63,.32);background:rgba(18,17,13,.9);backdrop-filter:blur(14px);border-radius:17px;padding:14px 17px;box-shadow:0 18px 45px rgba(0,0,0,.35)}
        .fansHeroBadge strong{display:block;color:#e7c33f;font-size:11px}
        .fansHeroBadge span{display:block;color:#e6e1d6;font-size:11px;margin-top:4px}
        .fansStatsBar{border:1px solid rgba(255,255,255,.09);background:linear-gradient(120deg,rgba(255,255,255,.065),rgba(255,255,255,.025));border-radius:18px;padding:22px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;box-shadow:0 24px 70px rgba(0,0,0,.25);position:relative;z-index:3}
        .fansStat{display:flex;align-items:center;justify-content:center;gap:12px;padding:6px 18px;border-right:1px solid rgba(255,255,255,.08)}
        .fansStat:last-child{border-right:0}
        .fansStatIcon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(231,195,63,.08);border:1px solid rgba(231,195,63,.17);color:#e7c33f;font-size:18px}
        .fansStat strong{display:block;font-size:22px;letter-spacing:-.04em;color:#f1eee7}
        .fansStat span{display:block;font-size:10px;color:#8d8a82;margin-top:2px}
        .fansBoostDiscoveryGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
        .fansBoostDiscoveryCard{display:flex;flex-direction:column;min-height:190px;padding:21px;border:1px solid rgba(231,195,63,.25);border-radius:18px;background:radial-gradient(ellipse at 0 0,rgba(231,195,63,.12),transparent 65%),linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));color:#f7f3e8;text-decoration:none;transition:transform .2s,border-color .2s}
        .fansBoostDiscoveryCard:hover{transform:translateY(-3px);border-color:rgba(231,195,63,.58)}
        .fansBoostDiscoveryTag{align-self:flex-start;border:1px solid rgba(231,195,63,.35);border-radius:999px;padding:6px 9px;color:#f0cf63;font-size:9px;font-weight:900;letter-spacing:.06em}
        .fansBoostDiscoveryCard strong{display:block;margin-top:15px;font-size:17px;line-height:1.35;overflow-wrap:anywhere}
        .fansBoostDiscoveryCard span:last-child{margin-top:auto;padding-top:16px;color:#aaa59b;font-size:11px;line-height:1.5}
        .fansSection{padding:68px 0 0;position:relative;z-index:2}
        .fansSectionHead{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}
        .fansSectionKicker{color:#e7c33f;font-size:10px;letter-spacing:.18em;font-weight:900}
        .fansSectionTitle{font-size:30px;letter-spacing:-.055em;margin:6px 0 0;color:#f5f2e9}
        .fansSectionLead{font-size:12px;color:#79766f;line-height:1.7;margin:8px 0 0;max-width:660px}
        .fansViewAll{color:#e7c33f;text-decoration:none;font-size:11px;font-weight:900;white-space:nowrap}
        .fansFeaturedGrid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}
        .fansFeaturedCard{min-width:0;position:relative;height:310px;border-radius:15px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#121212;text-decoration:none;color:#fff;box-shadow:0 15px 40px rgba(0,0,0,.24);transition:transform .2s,border-color .2s}
        .fansFeaturedCard:hover{transform:translateY(-5px);border-color:rgba(231,195,63,.34)}
        .fansFeaturedCard img{width:100%;height:100%;object-fit:cover}
        .fansFeaturedCardFallback{width:100%;height:100%;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#55441f,#18150e 45%,#0c0c0c 75%);color:#e7c33f;font-size:48px;font-weight:950}
        .fansFeaturedCard:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(0,0,0,.9) 100%)}
        .fansFeaturedInfo{position:absolute;z-index:2;left:14px;right:14px;bottom:14px}
        .fansFeaturedInfo strong{font-size:14px;line-height:1.35;display:block;color:#fff;overflow-wrap:anywhere}
        .fansFeaturedInfo span{display:block;color:#c4bfb2;font-size:10px;margin-top:6px;line-height:1.5}
        .fansReputationBadge{display:inline-flex!important;align-items:center;gap:5px;width:max-content;max-width:100%;border:1px solid rgba(231,195,63,.28);border-radius:999px;background:rgba(231,195,63,.09);padding:5px 8px;color:#f0cf63!important;font-size:9px!important;font-weight:850;letter-spacing:.02em;overflow-wrap:anywhere}
        .fansOnline{display:inline-block;width:7px;height:7px;border-radius:50%;background:#39d56f;margin-right:5px}
        .fansCreatorGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
        .fansCreatorCard{position:relative;isolation:isolate;display:flex;align-items:flex-start;gap:15px;padding:19px;border:1px solid rgba(255,255,255,.085);border-radius:19px;background:radial-gradient(ellipse at 0 0,rgba(231,195,63,.075),transparent 58%),linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));text-decoration:none;color:#fff;transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;min-width:0;overflow:hidden}
        .fansCreatorCard:before{content:"";position:absolute;z-index:-1;left:0;top:18px;bottom:18px;width:2px;border-radius:2px;background:linear-gradient(180deg,#e7c33f,rgba(231,195,63,0));opacity:.55;transition:opacity .22s ease}.fansCreatorCard:hover{border-color:rgba(231,195,63,.38);transform:translateY(-3px);box-shadow:0 18px 42px rgba(0,0,0,.24),0 0 0 1px rgba(231,195,63,.035)}.fansCreatorCard:hover:before{opacity:1}.fansCreatorCard:focus-visible,.fansFeaturedCard:focus-visible,.fansPrimary:focus-visible,.fansSecondary:focus-visible,.fansViewAll:focus-visible{outline:2px solid #e7c33f;outline-offset:4px}
        .fansCreatorAvatar{width:64px;height:64px;border-radius:17px;overflow:hidden;background:linear-gradient(145deg,#302714,#15130e);display:grid;place-items:center;color:#e7c33f;font-size:23px;font-weight:950;flex:none;border:1px solid rgba(231,195,63,.22);box-shadow:0 7px 18px rgba(0,0,0,.22)}
        .fansCreatorAvatar img{width:100%;height:100%;object-fit:cover}
        .fansCreatorCard strong{font-size:14px;line-height:1.35;letter-spacing:-.015em;color:#f7f3e8;overflow-wrap:anywhere}
        .fansCreatorMeta{font-size:10px;color:#a29d91;margin-top:7px;line-height:1.5;overflow-wrap:anywhere}.fansCreatorMeta .fansOnline{background:#e7c33f;width:5px;height:5px;vertical-align:middle;opacity:.85}
        .fansCreatorBio{font-size:11px;line-height:1.65;color:#b2ada1;margin-top:10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;max-width:100%}
        .fansCreatorArrow{margin-left:auto;color:#e7c33f;font-size:22px;align-self:center;flex:none;width:27px;height:27px;display:grid;place-items:center;border:1px solid rgba(231,195,63,.18);border-radius:50%;background:rgba(231,195,63,.045);transition:transform .22s ease,background .22s ease}.fansCreatorCard:hover .fansCreatorArrow{transform:translateX(2px);background:rgba(231,195,63,.12)}
        .fansOwnerPanel{margin-top:68px;border:1px solid rgba(231,195,63,.18);border-radius:22px;background:linear-gradient(120deg,rgba(231,195,63,.08),rgba(255,255,255,.025));padding:30px;display:flex;align-items:center;justify-content:space-between;gap:25px}
        .fansOwnerPanel h2{font-size:27px;letter-spacing:-.05em;margin:5px 0 8px}
        .fansOwnerPanel p{font-size:12px;color:#97938a;line-height:1.7;margin:0;max-width:700px}
        .fansOwnerBadge{border:1px solid rgba(231,195,63,.3);color:#e7c33f;background:rgba(231,195,63,.06);border-radius:999px;padding:7px 11px;font-size:10px;white-space:nowrap}
        .fansOnboarding{margin-top:68px}
        .fansArchitecture{margin-top:72px;padding:58px 0;border-top:1px solid rgba(255,255,255,.08);display:grid;grid-template-columns:1fr 1fr;gap:50px}
        .fansArchitecture h2{font-size:39px;line-height:1.03;letter-spacing:-.065em;margin:8px 0 15px}
        .fansArchitecture p{font-size:12px;line-height:1.85;color:#858179;margin:0;max-width:640px}
        .fansFlow{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
        .fansFlow span{border:1px solid rgba(231,195,63,.16);border-radius:12px;padding:15px 18px;background:rgba(231,195,63,.035);font-size:11px;color:#e9e4d9}
        .fansFlow b{color:#e7c33f}
        .fansFooter{border-top:1px solid rgba(255,255,255,.07);margin-top:20px;padding:25px 0 38px;display:flex;justify-content:space-between;gap:20px;color:#626057;font-size:10px}
        .fansEmpty{border:1px dashed rgba(231,195,63,.2);border-radius:18px;padding:35px;text-align:center;color:#7f7b73;background:rgba(255,255,255,.02)}
        @media(max-width:1100px){.fansBoostDiscoveryGrid{grid-template-columns:repeat(2,1fr)}.fansPageWrap{padding:0 24px}.fansMainNav{gap:18px}.fansSearch{width:170px}.fansFeaturedGrid{grid-template-columns:repeat(3,1fr)}.fansFeaturedCard{height:300px}.fansHero{grid-template-columns:1fr .82fr}.fansHeroImage{width:360px;height:450px}.fansHeroCreatorTag{left:-10px}.fansHeroBadge{right:-2px}.fansCreatorGrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:800px){.fansBoostDiscoveryGrid{grid-template-columns:1fr}.fansPageWrap{padding:0 16px}.fansTopbar{height:72px}.fansMainNav{display:none}.fansTopActions{gap:7px}.fansSearch{display:none}.fansIconBtn{display:none}.fansLogoText{font-size:19px}.fansLogoMark{width:37px;height:37px}.fansHero{grid-template-columns:1fr;padding:52px 0 44px;min-height:auto}.fansHeroCopy{padding:0}.fansHero h1{font-size:51px}.fansLead{font-size:15px}.fansBenefits{grid-template-columns:1fr;gap:12px;margin-top:34px}.fansHeroVisual{min-height:430px;margin-top:18px}.fansHeroImage{width:300px;height:385px}.fansHeroCreatorTag{left:0;bottom:18px}.fansHeroBadge{right:0;top:28px}.fansStatsBar{grid-template-columns:repeat(2,1fr);padding:13px}.fansStat{padding:12px 8px;border-right:0}.fansStat:nth-child(1),.fansStat:nth-child(2){border-bottom:1px solid rgba(255,255,255,.08)}.fansStat strong{font-size:18px}.fansStatIcon{width:36px;height:36px}.fansSection{padding-top:50px}.fansSectionHead{align-items:start;flex-direction:column}.fansFeaturedGrid{grid-template-columns:repeat(2,1fr);gap:10px}.fansFeaturedCard{height:270px}.fansCreatorGrid{grid-template-columns:1fr}.fansOwnerPanel{align-items:flex-start;flex-direction:column;margin-top:50px}.fansArchitecture{grid-template-columns:1fr;gap:30px;margin-top:55px}.fansArchitecture h2{font-size:34px}.fansFooter{flex-direction:column}}
        @media(max-width:430px){.fansCreatorCard{gap:11px;padding:14px}.fansCreatorAvatar{width:54px;height:54px;border-radius:14px}.fansCreatorArrow{width:24px;height:24px;font-size:19px}.fansHero h1{font-size:44px}.fansFeaturedGrid{grid-template-columns:1fr 1fr}.fansFeaturedCard{height:235px}.fansHeroCreatorTag{min-width:205px}.fansHeroBadge{padding:11px 13px}.fansStat{gap:8px}.fansStat span{font-size:9px}}
        .fansCreatorCard.fansPlanFeatured{border-color:rgba(231,195,63,.72);box-shadow:0 14px 38px rgba(231,195,63,.09),0 0 0 1px rgba(231,195,63,.12);background:linear-gradient(145deg,rgba(231,195,63,.14),rgba(255,255,255,.018) 65%)}
        .fansCreatorCard.fansPlanHighlighted{border-color:rgba(231,195,63,.42)}
        .fansCreatorCard.fansPlanPremium{border-color:rgba(231,195,63,.75);box-shadow:0 18px 46px rgba(231,195,63,.12);background:linear-gradient(145deg,rgba(231,195,63,.16),rgba(255,255,255,.018) 70%)}
        .fansCreatorCard.fansPlanPremium>div:nth-child(2)>strong{color:#f5d96c}
        .fansPublicationPremiumBadge{display:table;width:max-content;max-width:100%;margin-top:7px;padding:5px 8px;border:1px solid rgba(231,195,63,.5);border-radius:999px;background:rgba(8,8,8,.85);color:#f5d96c;font-size:9px;font-weight:900;letter-spacing:.06em}
      `}</style>

      <div className="fansPageWrap">
        <header className="fansTopbar">
          <Link href="/fans" className="fansLogo">
            <span className="fansLogoMark">P</span>
            <span className="fansLogoText">Pecatho <small>FANS · PREMIUM CREATOR EXPERIENCE</small></span>
          </Link>

          <nav className="fansMainNav" aria-label="Navegação Fans">
            <Link href="/fans" className="active">Início</Link>
            <Link href="#criadores">Descobrir</Link>
            <Link href="#destaques">Criadores</Link>
            <Link href="/painel/mensagens">Mensagens</Link>
            <Link href="/fans/minhas-assinaturas">Assinaturas</Link>
          </nav>

          <div className="fansTopActions">
            <div className="fansSearch"><span className="fansSearchIcon">⌕</span><span>Buscar criadores...</span></div>
            <Link href="/painel/mensagens" className="fansIconBtn" aria-label="Mensagens">✉</Link>
            <Link href={user ? "/fans/gerenciar" : "/login?next=/fans"} className="fansAvatarMini" aria-label={user ? "Meu Fans" : "Entrar"}>{userInitial}</Link>
          </div>
        </header>

        <section className="fansHero">
          <div className="fansHeroCopy">
            <div className="fansEyebrow">Pecatho Fans · conteúdo e experiências exclusivas</div>
            <h1>Conexões reais.<br /><span>Experiências exclusivas.</span></h1>
            <p className="fansLead">Descubra criadores, acompanhe conteúdos exclusivos, assine experiências e estabeleça conexões privadas dentro do ecossistema Pecatho.</p>

            <div className="fansActions">
              <Link className="fansPrimary" href="#destaques">EXPLORAR CRIADORES <span style={{marginLeft:10}}>→</span></Link>
              <Link className="fansSecondary" href={creator ? "/fans/gerenciar" : "/fans/ativar"}>{creator ? "GERENCIAR MEU FANS" : "TORNAR-SE CRIADOR"} <span style={{marginLeft:10}}>✦</span></Link>
            </div>

            <div className="fansBenefits">
              <div className="fansBenefit"><span className="fansBenefitIcon">♢</span><div><strong>Conteúdo exclusivo</strong><span>Publicações e planos para sua audiência</span></div></div>
              <div className="fansBenefit"><span className="fansBenefitIcon">▣</span><div><strong>Privacidade garantida</strong><span>Relacionamento direto e acesso controlado</span></div></div>
              <div className="fansBenefit"><span className="fansBenefitIcon">◇</span><div><strong>Pagamentos seguros</strong><span>Fluxos financeiros com confirmação oficial</span></div></div>
            </div>
          </div>

          <div className="fansHeroVisual">
            <div className="fansHeroGlow" />
            <div className="fansHeroImage">
              {heroCreator?.avatar_url ? <img src={heroCreator.avatar_url} alt={heroCreator.display_name} /> : <div className="fansHeroImageFallback">P</div>}
            </div>
            <div className="fansHeroBadge"><strong>PECATHO FANS</strong><span>Conteúdo · Assinaturas · Experiências</span></div>
            {heroCreator && <div className="fansHeroCreatorTag"><small>CRIADOR EM DESTAQUE</small><strong>{heroCreator.display_name}</strong><span>● Online · {planMap.get(heroCreator.id) || 0} plano(s) · {offerMap.get(heroCreator.id) || 0} experiência(s)</span></div>}
          </div>
        </section>

        <section className="fansStatsBar" aria-label="Indicadores da plataforma">
          <div className="fansStat"><span className="fansStatIcon">♧</span><div><strong>{creatorCountLabel}</strong><span>Criadores ativos</span></div></div>
          <div className="fansStat"><span className="fansStatIcon">☆</span><div><strong>{creatorPlans?.length || 0}</strong><span>Planos ativos</span></div></div>
          <div className="fansStat"><span className="fansStatIcon">▣</span><div><strong>{creatorOffers?.length || 0}</strong><span>Experiências privadas</span></div></div>
          <div className="fansStat"><span className="fansStatIcon">◎</span><div><strong>24/7</strong><span>Ecossistema disponível</span></div></div>
        </section>

        {boostedDiscoveryPosts.length > 0 && (
          <section id="publicacoes-impulsionadas" className="fansSection">
            <div className="fansSectionHead">
              <div><div className="fansSectionKicker">VISIBILIDADE EXTRA</div><h2 className="fansSectionTitle">Publicações impulsionadas</h2><p className="fansSectionLead">Conteúdos de criadores com impulsionamento ativo, priorizados pelo multiplicador contratado.</p></div>
            </div>
            <div className="fansBoostDiscoveryGrid">
              {boostedDiscoveryPosts.map((post) => (
                <Link key={post.id} href={`/fans/publicacoes/${post.id}`} className="fansBoostDiscoveryCard">
                  <span className="fansBoostDiscoveryTag">✦ IMPULSIONADO · {post.multiplier.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×</span>
                  <strong>{post.title}</strong>
                  <span>{post.creator_name} · {post.access_type === "free" ? "Acesso gratuito" : post.access_type === "paid" ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: post.currency }).format(post.price) : "Exclusivo para assinantes"} · Ver publicação →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section id="destaques" className="fansSection">
          <div className="fansSectionHead">
            <div><div className="fansSectionKicker">SELEÇÃO PECATHO</div><h2 className="fansSectionTitle">Criadores em destaque</h2><p className="fansSectionLead">Perfis ativos para descobrir conteúdos, planos de assinatura e experiências privadas.</p></div>
            <Link href="#criadores" className="fansViewAll">VER TODOS →</Link>
          </div>

          {featuredCreators.length === 0 ? <div className="fansEmpty">Ainda não há criadores ativos para destacar.</div> : <div className="fansFeaturedGrid">
            {featuredCreators.map((item) => <Link key={item.id} href={"/fans/" + item.slug} className="fansFeaturedCard">
              {item.avatar_url ? <img src={item.avatar_url} alt={item.display_name} /> : <div className="fansFeaturedCardFallback">{item.display_name.slice(0, 1).toUpperCase()}</div>}
              <div className="fansFeaturedInfo"><strong>{item.display_name}</strong><span className="fansReputationBadge">🏆 {item.reputation_level || "Iniciante"} · {Number(item.reputation_score || 0).toLocaleString("pt-BR")} pontos</span><span><i className="fansOnline" />{planMap.get(item.id) || 0} plano(s) disponível(is)</span></div>
            </Link>)}
          </div>}
        </section>

        <section id="criadores" className="fansSection">
          <div className="fansSectionHead">
            <div><div className="fansSectionKicker">DESCUBRA</div><h2 className="fansSectionTitle">Encontre seu próximo criador</h2><p className="fansSectionLead">Acesse o perfil público para conhecer a proposta, conteúdos e experiências disponíveis.</p></div>
          </div>

          {discoveryCreators.length === 0 ? <div className="fansEmpty">Ainda não há criadores ativos publicados no Fans.</div> : <div className="fansCreatorGrid">
            {discoveryCreators.map((item) => <Link key={item.id} href={"/fans/" + item.slug} className={`fansCreatorCard ${item.plan_featured_card ? "fansPlanFeatured" : ""} ${item.plan_profile_theme === "premium" ? "fansPlanPremium" : item.plan_profile_theme === "highlighted" ? "fansPlanHighlighted" : ""}`}>
              <div className="fansCreatorAvatar">{item.avatar_url ? <img src={item.avatar_url} alt={item.display_name} /> : item.display_name.slice(0, 1).toUpperCase()}</div>
              <div style={{minWidth:0,flex:1}}><strong>{item.display_name}</strong>{item.plan_premium_badge && <span className="fansPublicationPremiumBadge">✦ PERFIL PREMIUM</span>}<div className="fansCreatorMeta"><span className="fansOnline" />{planMap.get(item.id) || 0} plano(s) · {offerMap.get(item.id) || 0} experiência(s) privada(s)</div><div className="fansReputationBadge" style={{marginTop:8}}>🏆 {item.reputation_level || "Iniciante"} · {Number(item.reputation_score || 0).toLocaleString("pt-BR")} pontos</div><div className="fansCreatorBio">{summarizeCreatorBio(item.bio)}</div></div>
              <span className="fansCreatorArrow">›</span>
            </Link>)}
          </div>}
        </section>

        {creator === null ? (
          <section className="fansOwnerPanel fansOnboarding">
            <div><div className="fansSectionKicker">TORNE-SE CRIADOR</div><h2>Crie seu espaço no Fans.</h2><p>Configure sua página, publique conteúdos, desenvolva sua audiência e ofereça experiências privadas. O Fans amplia o ecossistema Pecatho sem substituir o ambiente principal.</p></div>
            <div className="fansActions" style={{marginTop:0}}><Link className="fansPrimary" href="/fans/ativar">CRIAR MEU ESPAÇO FANS ↗</Link><Link className="fansSecondary" href="/fans/minhas-assinaturas">MINHAS ASSINATURAS</Link></div>
          </section>
        ) : (
          <>
            <section className="fansOwnerPanel">
              <div><div className="fansSectionKicker">SEU ESPAÇO DE CRIADOR</div><h2>{creator.display_name}</h2><p>{summarizeCreatorBio(creator.bio, 180)}</p></div>
              <span className="fansOwnerBadge">{creator.status === "active" ? "CRIADOR ATIVO" : creator.status}</span>
            </section>
            <section className="fansStatsBar" style={{marginTop:18}}>
              <div className="fansStat"><span className="fansStatIcon">◇</span><div><strong>{plansCount}</strong><span>Planos de assinatura</span></div></div>
              <div className="fansStat"><span className="fansStatIcon">▣</span><div><strong>{postsCount}</strong><span>Publicações cadastradas</span></div></div>
              <div className="fansStat"><span className="fansStatIcon">↗</span><div><strong>Fans</strong><span>Área de relacionamento</span></div></div>
              <div className="fansStat"><span className="fansStatIcon">→</span><div><Link href="/fans/gerenciar" className="fansViewAll">GERENCIAR</Link><span>Seu painel de criador</span></div></div>
            </section>
            <section className="fansOwnerPanel" style={{marginTop:18}}>
              <div><div className="fansSectionKicker">ÁREA DO FÃ</div><h2>Seu relacionamento continua aqui.</h2><p>Consulte suas assinaturas e acessos adquiridos independentemente da sua atuação como criador.</p></div>
              <div className="fansActions" style={{marginTop:0}}><Link className="fansPrimary" href="/fans/minhas-assinaturas">MINHAS ASSINATURAS</Link><Link className="fansSecondary" href="/fans/gerenciar">GERENCIAR MEU FANS</Link></div>
            </section>
          </>
        )}

        <section className="fansArchitecture">
          <div><div className="fansEyebrow">SEPARAÇÃO FUNCIONAL</div><h2>O Fans não substitui o Pecatho. <span style={{color:"#e7c33f"}}>Amplia o ecossistema.</span></h2><p>O Pecatho principal permanece responsável pelos anúncios de serviços. O Fans possui sua própria operação de conteúdo, assinaturas, relacionamento e experiências privadas. Um mesmo usuário pode utilizar os dois ambientes.</p></div>
          <div className="fansFlow"><span>Pecatho</span><b>→</b><span>Anunciante</span><b>→</b><span>Fans</span><b>→</b><span>Experiências</span></div>
        </section>

        <footer className="fansFooter"><span>© {new Date().getFullYear()} Pecatho Fans</span><span>Conteúdo, audiência e experiências em evolução.</span></footer>
      </div>
    </main>
  );
}
