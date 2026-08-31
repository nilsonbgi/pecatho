import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({request});
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: c => c.forEach(({name,value}) => { request.cookies.set(name,value); response.cookies.set(name,value); }) }
  });
  const {data:{user}} = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/painel") && !user) { const url=request.nextUrl.clone(); url.pathname="/login"; return NextResponse.redirect(url); }
  return response;
}
export const config = { matcher: ["/painel/:path*"] };