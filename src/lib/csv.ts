type CsvColumn<T> = { label: string; value: (row: T) => string | number | null | undefined };

// Escapa aspas e envolve em aspas sempre que o valor tem vírgula, aspas ou
// quebra de linha — regra padrão do formato CSV (RFC 4180).
function escapeCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(","));
  // BOM no início — sem isto o Excel abre acentos (é, ç, ã) partidos.
  return "﻿" + [header, ...lines].join("\r\n");
}

// Parser mínimo de RFC 4180 (campos entre aspas, aspas escapadas como "",
// vírgulas/quebras de linha dentro de campos entre aspas). Devolve um objeto
// por linha, com as chaves vindas do cabeçalho.
export function parseCsv(text: string): Record<string, string>[] {
  const content = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && content[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;
  return dataRows.map((cells) => Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""])));
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
