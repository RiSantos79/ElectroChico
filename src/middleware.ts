import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// Ativa um "Basic Auth" para o site inteiro em staging, para que só quem tem
// a credencial consiga sequer ver a loja. Só entra em ação se as duas env
// vars estiverem definidas — em dev local ou produção real, fica inativo.
function isBasicAuthOk(request: NextRequest): boolean {
  const user = process.env.STAGING_BASIC_AUTH_USER;
  const pass = process.env.STAGING_BASIC_AUTH_PASSWORD;
  if (!user || !pass) return true;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = atob(header.slice(6));
  return decoded === `${user}:${pass}`;
}

export async function middleware(request: NextRequest) {
  if (!isBasicAuthOk(request)) {
    return new NextResponse("Autenticação necessária", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="ElectroChico Staging"' },
    });
  }

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  if (!isAdminRoute) return NextResponse.next();

  const token = request.cookies.get("session")?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role === "ADMIN") return NextResponse.next();
    } catch {
      // token inválido/expirado — cai para o redirect abaixo
    }
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
