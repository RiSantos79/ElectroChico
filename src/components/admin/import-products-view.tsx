"use client";

import Link from "next/link";
import { useState } from "react";
import { parseCsv } from "@/lib/csv";
import { bulkImportProductsAction } from "@/lib/admin-actions";
import type { BulkImportProductRow, BulkImportResult } from "@/lib/api";
import type { EnergyClass } from "@/data/catalog";

const PREVIEW_LIMIT = 50;
const VALID_ENERGY_CLASSES = new Set(["A", "B", "C", "D", "E", "F", "G"]);

type ParsedRow = { row: BulkImportProductRow; error?: string };

function toRow(cells: Record<string, string>, index: number): ParsedRow {
  const name = cells["Nome"]?.trim();
  const brand = cells["Marca (slug)"]?.trim();
  const category = cells["Categoria (slug)"]?.trim();
  const priceText = cells["Preço"]?.trim();

  if (!name || !brand || !category || !priceText) {
    return {
      row: { name: name ?? "", brand: brand ?? "", category: category ?? "", price: 0 },
      error: `Linha ${index + 1}: faltam campos obrigatórios (Nome, Marca (slug), Categoria (slug), Preço)`,
    };
  }
  const price = Number(priceText.replace(",", "."));
  if (!Number.isFinite(price)) {
    return { row: { name, brand, category, price: 0 }, error: `Linha ${index + 1}: preço inválido "${priceText}"` };
  }
  const energyClassRaw = cells["Classe Energética"]?.trim().toUpperCase();
  const energyClass = VALID_ENERGY_CLASSES.has(energyClassRaw ?? "") ? (energyClassRaw as EnergyClass) : undefined;

  return {
    row: {
      id: cells["ID"]?.trim() || undefined,
      name,
      brand,
      category,
      sku: cells["SKU"]?.trim() || undefined,
      ean: cells["EAN"]?.trim() || undefined,
      price,
      oldPrice: cells["Preço Antigo"]?.trim() ? Number(cells["Preço Antigo"].replace(",", ".")) : undefined,
      stockQuantity: cells["Stock"]?.trim() ? Number(cells["Stock"]) : undefined,
      energyClass,
      archived: cells["Arquivado"]?.trim().toLowerCase() === "sim",
    },
  };
}

export function ImportProductsView() {
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setError(null);
    const text = await file.text();
    const cells = parseCsv(text);
    setParsed(cells.map(toRow));
  }

  async function handleImport() {
    if (!parsed) return;
    const validRows = parsed.filter((p) => !p.error).map((p) => p.row);
    if (validRows.length === 0) return;
    setBusy(true);
    setError(null);
    const outcome = await bulkImportProductsAction(validRows);
    setBusy(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setResult(outcome.result);
    setParsed(null);
  }

  const validCount = parsed?.filter((p) => !p.error).length ?? 0;
  const invalidRows = parsed?.filter((p) => p.error) ?? [];
  const toCreate = parsed?.filter((p) => !p.error && !p.row.id).length ?? 0;
  const toUpdate = validCount - toCreate;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <p className="mb-4 text-sm text-muted">
          Usa o ficheiro{" "}
          <Link href="/admin/produtos/export" className="text-accent hover:underline">
            exportado daqui
          </Link>{" "}
          como base: linhas com <code>ID</code> preenchido atualizam esse produto, linhas sem <code>ID</code> criam um
          produto novo (Marca e Categoria têm de corresponder a um slug já existente).
        </p>
        <input type="file" accept=".csv" onChange={handleFile} className="input-field" />
      </div>

      {parsed && (
        <div className="rounded-xl border border-border bg-surface-raised p-6">
          <p className="mb-4 text-sm text-foreground">
            {validCount} linha(s) válida(s) — {toCreate} a criar, {toUpdate} a atualizar.
            {invalidRows.length > 0 && (
              <span className="text-danger"> {invalidRows.length} linha(s) com erro (não serão importadas).</span>
            )}
          </p>

          {invalidRows.length > 0 && (
            <ul className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
              {invalidRows.map((p, i) => (
                <li key={i}>{p.error}</li>
              ))}
            </ul>
          )}

          <div className="mb-4 max-h-80 overflow-y-auto overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Ação</th>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Marca</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed
                  .filter((p) => !p.error)
                  .slice(0, PREVIEW_LIMIT)
                  .map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-muted">{p.row.id ? "Atualizar" : "Criar"}</td>
                      <td className="px-3 py-2 text-foreground">{p.row.name}</td>
                      <td className="px-3 py-2 text-muted">{p.row.brand}</td>
                      <td className="px-3 py-2 text-muted">{p.row.category}</td>
                      <td className="px-3 py-2 text-muted">{p.row.price}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {validCount > PREVIEW_LIMIT && (
              <p className="border-t border-border px-3 py-2 text-xs text-muted">
                + {validCount - PREVIEW_LIMIT} linha(s) não mostradas na pré-visualização (serão importadas na mesma).
              </p>
            )}
          </div>

          {error && <p className="mb-4 text-sm text-danger">{error}</p>}

          <button
            type="button"
            disabled={busy || validCount === 0}
            onClick={handleImport}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "A importar..." : `Importar ${validCount} produto(s)`}
          </button>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-6">
          <p className="text-sm font-medium text-foreground">
            Importação concluída: {result.created} produto(s) criado(s), {result.updated} atualizado(s).
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-40 overflow-y-auto text-xs text-danger">
              {result.errors.map((e, i) => (
                <li key={i}>
                  Linha {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/produtos" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">
            Ver produtos
          </Link>
        </div>
      )}
    </div>
  );
}
