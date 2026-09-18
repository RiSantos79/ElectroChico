// Auto-teste do parser de respostas rotuladas da IA.
// Correr com: node --experimental-strip-types src/lib/ai-parse.check.ts
import assert from "node:assert/strict";
import { splitLabelled } from "./ai-parse.ts";

// Banner: três rótulos, nada de corpo.
const banner = splitLabelled(
  "Título: Frio a sério\nSubtítulo: Arcas congeladoras até -30%\nBotão: Ver campanha",
  { "Título": "title", "Subtítulo": "description", "Botão": "ctaLabel" },
);
assert.deepEqual(banner.values, {
  title: "Frio a sério",
  description: "Arcas congeladoras até -30%",
  ctaLabel: "Ver campanha",
});
assert.equal(banner.rest, "");

// Newsletter: um rótulo, o resto é o corpo em HTML.
const news = splitLabelled(
  "Assunto: Saldos de verão\n<p>Aproveite até 31 de agosto.</p>\n<ul><li>Ar condicionado</li></ul>",
  { Assunto: "subject" },
);
assert.equal(news.values.subject, "Saldos de verão");
assert.equal(news.rest, "<p>Aproveite até 31 de agosto.</p>\n<ul><li>Ar condicionado</li></ul>");

// Tolera negrito do modelo e acentuação/capitalização diferentes.
assert.equal(splitLabelled("**TITULO:** Olá", { "Título": "title" }).values.title, "Olá");

// Não confunde texto normal com dois pontos com um rótulo conhecido.
const prose = splitLabelled("Atenção: isto é só uma frase do corpo.", { Assunto: "subject" });
assert.deepEqual(prose.values, {});
assert.equal(prose.rest, "Atenção: isto é só uma frase do corpo.");

// Formato inesperado devolve values vazio — é o sinal que a UI usa para avisar.
assert.deepEqual(splitLabelled("Texto solto sem rótulos", { "Título": "title" }).values, {});

console.log("ai-parse: ok");
