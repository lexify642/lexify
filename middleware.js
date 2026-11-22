import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Whole app is an internal firm tool — everything requires a session except
// the login screen itself and the OTP endpoints that power it.
const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() (not getSession()) revalidates against Supabase Auth on every
  // request instead of trusting a possibly-stale cookie payload.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (!user && !isPublicPath(pathname)) {
    if (isApi) {
      return NextResponse.json({ data: null, pagination: null, error: { message: "Sign in required.", details: null } }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
