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

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
