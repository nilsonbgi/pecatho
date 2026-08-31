import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const FALLBACK_SUPABASE_URL = "https://haplmoswsojbibgamqju.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gbJA-2Tqt7SCeqokRLFuCQ_ubJy7QvD";
const FANS_HOSTS = new Set(["fans.pecatho.com.br", "www.fans.pecatho.com.br"]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase();
  const isFansHost = hostname ? FANS_HOSTS.has(hostname) : false;
  const pathname = request.nextUrl.pathname;
  const isProtectedPanel = pathname.startsWith("/painel");

  if (isProtectedPanel) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value);
            });
          },
        },
      },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  if (isFansHost && !pathname.startsWith("/fans") && !pathname.startsWith("/_next") && pathname !== "/favicon.ico") {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/fans" : `/fans${pathname}`;
    return NextResponse.rewrite(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
