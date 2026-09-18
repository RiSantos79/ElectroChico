// Gera src/data/concelhos.ts a partir de src/data/pt-map.ts.
//
// Correr: node --experimental-strip-types scripts/gerar-concelhos.mjs
//
// O mapa só tem o continente. Os concelhos dos Açores e da Madeira são
// acrescentados à mão porque, sem eles, a dropdown obrigatória do checkout
// impediria clientes das ilhas de comprar — o mapa não os pinta, o que é uma
// limitação aceitável; recusar a venda não era.
import { writeFileSync } from "node:fs";
import { PT_MAP } from "../src/data/pt-map.ts";

const ILHAS = [
  // Madeira
  "Calheta", "Câmara de Lobos", "Funchal", "Machico", "Ponta do Sol", "Porto Moniz",
  "Porto Santo", "Ribeira Brava", "Santa Cruz", "Santana", "São Vicente",
  // Açores
  "Angra do Heroísmo", "Corvo", "Horta", "Lagoa", "Lajes das Flores", "Lajes do Pico",
  "Madalena", "Nordeste", "Ponta Delgada", "Povoação", "Praia da Vitória", "Ribeira Grande",
  "Santa Cruz da Graciosa", "Santa Cruz das Flores", "São Roque do Pico", "Velas",
  "Vila do Porto", "Vila Franca do Campo",
];

// "VILA NOVA DE GAIA" -> "Vila Nova de Gaia". As partículas ficam minúsculas,
// exceto no início; os hífenes contam como separadores ("Albergaria-a-Velha").
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "as", "os"]);

function capitalizar(palavra) {
  return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
}

function titulo(nome) {
  return nome
    .toLowerCase()
    .split(" ")
    .map((palavra, i) => {
      if (i > 0 && PARTICULAS.has(palavra)) return palavra;
      return palavra
        .split("-")
        .map((parte, j) => (j > 0 && PARTICULAS.has(parte) ? parte : capitalizar(parte)))
        .join("-");
    })
    .join(" ");
}

const doMapa = PT_MAP.shapes.map((s) => titulo(s.n));
const nomes = [...new Set([...doMapa, ...ILHAS])].sort((a, b) => a.localeCompare(b, "pt"));

const conteudo = `// Concelhos de Portugal para a escolha no checkout.
//
// GERADO — não editar à mão. Correr: node --experimental-strip-types scripts/gerar-concelhos.mjs
//
// Vem de src/data/pt-map.ts para que todo o concelho escolhido tenha forma no
// mapa do dashboard: com a localidade em texto livre, quem escrevesse o nome
// de uma aldeia nunca aparecia no mapa. Os concelhos insulares são
// acrescentados pelo gerador — não são pintados no mapa, mas têm de poder
// comprar.
export const CONCELHOS = [
${nomes.map((n) => `  ${JSON.stringify(n)},`).join("\n")}
] as const;
`;

writeFileSync(new URL("../src/data/concelhos.ts", import.meta.url), conteudo);
console.log(`${nomes.length} concelhos escritos (${doMapa.length} do mapa + ${ILHAS.length} insulares)`);
