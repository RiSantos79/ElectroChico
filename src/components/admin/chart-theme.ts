// Tema partilhado pelos gráficos do dashboard, ao estilo Grafana: painéis
// escuros, grelha discreta só na horizontal, eixos sem linha e sem marcas,
// e uma paleta consistente entre gráficos.

// Paleta do Grafana (tema escuro) — cores vivas o suficiente para ler
// sobre fundo escuro sem serem berrantes.
export const GRAFANA_COLORS = [
  "#73bf69",
  "#fade2a",
  "#5794f2",
  "#ff9830",
  "#f2495c",
  "#b877d9",
  "#ff780a",
  "#8ab8ff",
];

export const CHART_GRID = {
  stroke: "rgba(204, 204, 220, 0.09)",
  strokeDasharray: "0",
  vertical: false,
} as const;

export const CHART_AXIS = {
  tick: { fontSize: 11, fill: "rgba(204, 204, 220, 0.65)" },
  axisLine: false,
  tickLine: false,
} as const;

// Gradiente por baixo da linha — é o traço visual mais característico dos
// painéis de série temporal do Grafana.
export const AREA_GRADIENT_STOPS = [
  { offset: "0%", opacity: 0.45 },
  { offset: "100%", opacity: 0 },
] as const;

// Recharts não lê variáveis CSS dentro do tooltip, por isso as cores do
// painel flutuante são definidas aqui explicitamente.
export const CHART_TOOLTIP = {
  contentStyle: {
    background: "rgba(17, 20, 24, 0.96)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    fontSize: 12,
    color: "#e8eaed",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#9aa4b2", marginBottom: 2 },
  cursor: { fill: "rgba(255,255,255,0.06)" },
} as const;

export const CHART_LEGEND = { wrapperStyle: { fontSize: 11, color: "var(--muted)" } } as const;
