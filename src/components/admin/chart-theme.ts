// Tema partilhado pelos gráficos do dashboard, ao estilo Grafana: painéis
// escuros, grelha discreta só na horizontal, eixos sem linha e sem marcas,
// e uma paleta consistente entre gráficos.

export const GRAFANA_COLORS = [
  "#7eb26d",
  "#eab839",
  "#6ed0e0",
  "#ef843c",
  "#e24d42",
  "#1f78c1",
  "#ba43a9",
  "#705da0",
];

export const CHART_GRID = {
  stroke: "var(--border)",
  strokeDasharray: "2 4",
  vertical: false,
} as const;

export const CHART_AXIS = {
  tick: { fontSize: 11, fill: "var(--muted)" },
  axisLine: false,
  tickLine: false,
} as const;

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
