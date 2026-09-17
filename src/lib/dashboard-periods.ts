export type PeriodPreset =
  | "hoje"
  | "ontem"
  | "7dias"
  | "30dias"
  | "90dias"
  | "mes"
  | "mes-anterior"
  | "ano"
  | "ano-anterior"
  | "custom";

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7dias", label: "Últimos 7 dias" },
  { value: "30dias", label: "Últimos 30 dias" },
  { value: "90dias", label: "Últimos 90 dias" },
  { value: "mes", label: "Este mês" },
  { value: "mes-anterior", label: "Mês anterior" },
  { value: "ano", label: "Este ano" },
  { value: "ano-anterior", label: "Ano anterior" },
  { value: "custom", label: "Intervalo personalizado" },
];

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function resolvePeriod(
  preset: PeriodPreset,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const now = new Date();

  switch (preset) {
    case "hoje":
      return { from: startOfDay(now).toISOString(), to: now.toISOString() };
    case "ontem": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 1);
      return { from: start.toISOString(), to: startOfDay(now).toISOString() };
    }
    case "7dias":
      return { from: new Date(now.getTime() - 7 * 86_400_000).toISOString(), to: now.toISOString() };
    case "90dias":
      return { from: new Date(now.getTime() - 90 * 86_400_000).toISOString(), to: now.toISOString() };
    case "mes":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: now.toISOString() };
    case "mes-anterior":
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        to: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      };
    case "ano":
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: now.toISOString() };
    case "ano-anterior":
      return {
        from: new Date(now.getFullYear() - 1, 0, 1).toISOString(),
        to: new Date(now.getFullYear(), 0, 1).toISOString(),
      };
    case "custom":
      return {
        from: customFrom ? new Date(customFrom).toISOString() : new Date(now.getTime() - 30 * 86_400_000).toISOString(),
        to: customTo ? new Date(`${customTo}T23:59:59.999`).toISOString() : now.toISOString(),
      };
    case "30dias":
    default:
      return { from: new Date(now.getTime() - 30 * 86_400_000).toISOString(), to: now.toISOString() };
  }
}
