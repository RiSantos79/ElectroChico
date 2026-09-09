import type { Product } from "@/data/catalog";

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// Tolera pequenos erros de escrita: aceita a palavra se aparecer como
// substring, ou se estiver "perto" (1-2 letras trocadas/em falta) de
// alguma palavra do texto — sem precisar de nenhum serviço de pesquisa externo.
function wordMatches(word: string, haystack: string): boolean {
  if (haystack.includes(word)) return true;
  const maxDistance = word.length <= 4 ? 1 : 2;
  return haystack.split(/\s+/).some((token) => levenshtein(word, token) <= maxDistance);
}

export function matchesSearch(product: Product, query: string): boolean {
  const q = normalize(query).trim();
  if (!q) return true;

  const haystack = normalize(`${product.name} ${product.brand} ${product.description} ${product.category}`);
  const words = q.split(/\s+/).filter(Boolean);
  return words.every((word) => wordMatches(word, haystack));
}
