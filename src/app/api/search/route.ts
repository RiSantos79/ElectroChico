import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/api";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  const results = await searchProducts(q).catch(() => []);
  return NextResponse.json(results);
}
