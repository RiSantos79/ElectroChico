// Tema partilhado pelos gráficos do dashboard, ao estilo da Vercel (Geist):
// fundo quase preto, contraste alto, cromo reduzido ao mínimo e cor usada com
// parcimónia — a grelha quase não se vê e o dado é que salta.

// Paleta Geist. A primeira é o azul de assinatura da Vercel e é a que aparece
// sozinha na maioria dos painéis; as restantes só entram quando uma série
// precisa mesmo de se distinguir das outras.
export const CHART_COLORS = [
  "#0070f3", // blue
  "#7928ca", // purple
  "#ff0080", // pink
  "#ffb224", // amber
  "#50e3c2", // cyan
  "#e5484d", // red
  "#45d483", // green
  "#8f8f8f", // gray
];

// Cada série tem um nome em vez de um índice: assim, mudar a ordem da paleta
// não troca silenciosamente as cores dos gráficos, que foi o que aconteceu ao
// passar do tema anterior para este.
export const SERIES = {
  vendas: CHART_COLORS[0], // azul — a métrica principal do dashboard
  visitas: CHART_COLORS[3], // âmbar — contrasta com o azul sem competir com ele
  encomendas: CHART_COLORS[4], // cyan
  clientes: CHART_COLORS[6], // verde
  ticket: CHART_COLORS[1], // roxo
} as const;

// Linhas de grelha mais fracas do que no Grafana: na estética da Vercel a
// grelha é uma referência discreta, não parte do desenho.
export const CHART_GRID = {
  stroke: "rgba(255, 255, 255, 0.06)",
  strokeDasharray: "0",
  vertical: false,
} as const;

export const CHART_AXIS = {
  tick: { fontSize: 11, fill: "#8f8f8f" },
  axisLine: false,
  tickLine: false,
} as const;

// Gradiente mais curto e mais opaco no topo: a Vercel usa o preenchimento
// para dar peso à linha, não para pintar a área toda.
export const AREA_GRADIENT_STOPS = [
  { offset: "0%", opacity: 0.28 },
  { offset: "100%", opacity: 0 },
] as const;

// Recharts não lê variáveis CSS dentro do tooltip, por isso as cores do
// painel flutuante são definidas aqui explicitamente.
export const CHART_TOOLTIP = {
  contentStyle: {
    background: "#0a0a0a",
    border: "1px solid #2e2e2e",
    borderRadius: 6,
    fontSize: 12,
    color: "#ededed",
    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
  },
  labelStyle: { color: "#8f8f8f", marginBottom: 2 },
  cursor: { fill: "rgba(255,255,255,0.04)" },
} as const;

export const CHART_LEGEND = { wrapperStyle: { fontSize: 11, color: "#8f8f8f" } } as const;
