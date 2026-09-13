import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:3333";

// Proxy simples para o endpoint público de analítica na API — evita expor o
// URL da API ao browser e mantém o padrão do resto do site (o cliente nunca
// fala diretamente com a API).
export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json();
    if (typeof path === "string" && path.length > 0) {
      await fetch(`${API_URL}/analytics/pageview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path.slice(0, 300) }),
      });
    }
  } catch {
    // analítica nunca deve quebrar a navegação do utilizador
  }
  return new NextResponse(null, { status: 204 });
}
