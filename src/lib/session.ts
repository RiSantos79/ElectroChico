import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h, igual à expiração do token emitido pela API
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionToken() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}
