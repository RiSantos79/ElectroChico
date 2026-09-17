import { PT_MAP } from "@/data/pt-map";
import { formatPrice } from "@/lib/format";

type CityDatum = { city: string; orderCount: number; total: number };

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .trim();
}

// Escala sequencial (verde), do mais claro ao mais escuro. Concelhos sem
// encomendas ficam neutros — como num mapa de calor, o branco é "sem dados",
// não "zero vendas mal feitas".
const SCALE = ["#d7f0e0", "#a8ddb9", "#74c791", "#43a96a", "#248549", "#12602f"];
const EMPTY_FILL = "var(--surface)";

function shadeFor(value: number, max: number): string {
  if (value <= 0) return EMPTY_FILL;
  const ratio = max <= 1 ? 1 : Math.log(value + 1) / Math.log(max + 1);
  const index = Math.min(SCALE.length - 1, Math.floor(ratio * SCALE.length));
  return SCALE[index];
}

export function PortugalChoropleth({ cities }: { cities: CityDatum[] }) {
  // Várias cidades podem cair no mesmo concelho (ex. localidades distintas) —
  // somam-se em vez de a última ganhar.
  const byConcelho = new Map<string, { orderCount: number; total: number }>();
  for (const city of cities) {
    const key = normalize(city.city);
    const current = byConcelho.get(key) ?? { orderCount: 0, total: 0 };
    byConcelho.set(key, {
      orderCount: current.orderCount + city.orderCount,
      total: current.total + city.total,
    });
  }

  const max = Math.max(...[...byConcelho.values()].map((v) => v.orderCount), 0);
  const matchedKeys = new Set(PT_MAP.shapes.map((s) => s.k));
  const unmatched = cities.filter((c) => !matchedKeys.has(normalize(c.city)));
  const withOrders = PT_MAP.shapes.filter((s) => (byConcelho.get(s.k)?.orderCount ?? 0) > 0).length;

  return (
    <div className="flex h-full flex-col">
      {/* min-h-0 é o que impede o mapa de ditar a altura da grelha: sendo
          duas vezes mais alto do que largo, a largura da coluna dava-lhe uma
          altura enorme e esticava as três linhas de gráficos ao lado. Assim
          é o mapa que se ajusta ao espaço disponível, com preserveAspectRatio
          a mantê-lo proporcional. A altura mínima só conta em ecrã estreito,
          onde deixa de haver colunas para preencher. */}
      <div className="min-h-[420px] flex-1 lg:min-h-0">
        <svg
          viewBox={`0 0 ${PT_MAP.width} ${PT_MAP.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Mapa de encomendas por concelho"
          className="h-full w-full"
        >
          {PT_MAP.shapes.map((shape) => {
            const data = byConcelho.get(shape.k);
            const orders = data?.orderCount ?? 0;
            return (
              <path
                key={shape.k}
                d={shape.p}
                fill={shadeFor(orders, max)}
                stroke="var(--border)"
                strokeWidth={1}
                className="transition-[stroke,stroke-width] hover:stroke-accent hover:[stroke-width:3]"
              >
                <title>
                  {`${shape.n} (${shape.d})${
                    orders > 0
                      ? ` — ${orders} encomenda${orders !== 1 ? "s" : ""}, ${formatPrice(data?.total ?? 0)}`
                      : " — sem encomendas"
                  }`}
                </title>
              </path>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 space-y-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>Menos</span>
          <span className="flex flex-1 overflow-hidden rounded">
            {SCALE.map((color) => (
              <span key={color} className="h-2 flex-1" style={{ backgroundColor: color }} />
            ))}
          </span>
          <span>Mais</span>
        </div>
        <p>
          {withOrders} concelho{withOrders !== 1 ? "s" : ""} com encomendas.
        </p>
        {unmatched.length > 0 && (
          <p>
            Sem correspondência no mapa: {unmatched.map((c) => `${c.city} (${c.orderCount})`).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
