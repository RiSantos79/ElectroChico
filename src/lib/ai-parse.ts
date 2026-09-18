// Alguns prompts de IA devolvem linhas rotuladas ("Título: ...", "Assunto: ...")
// seguidas do conteúdo livre. Este módulo separa as duas partes para que cada
// rótulo vá para o seu campo do formulário e o resto siga para o corpo.

function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function splitLabelled(
  text: string,
  fields: Record<string, string>,
): { values: Record<string, string>; rest: string } {
  const keys = Object.keys(fields);
  const values: Record<string, string> = {};
  const rest: string[] = [];

  for (const line of text.split("\n")) {
    // Rótulo curto no início da linha, tolerando o **negrito** que alguns
    // modelos acrescentam. O "<" exclui linhas que já são HTML do corpo.
    const match = /^\s*\**([^:<]{2,30}?)\**\s*:\s*(.*)$/.exec(line);
    const key = match && keys.find((k) => normalizeKey(k) === normalizeKey(match[1]));
    // O negrito pode fechar depois dos dois pontos ("**Título:** X"), por isso
    // os asteriscos são limpos também do valor.
    if (match && key) values[fields[key]] = match[2].replace(/^\*+|\*+$/g, "").trim();
    else rest.push(line);
  }

  return { values, rest: rest.join("\n").trim() };
}
