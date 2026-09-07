const items = [
  {
    title: "Prazos de entrega",
    body: "Encomendas em stock são expedidas em 24 a 48h úteis em Portugal Continental. Ilhas: 3 a 5 dias úteis.",
  },
  {
    title: "Custos de envio",
    body: "Envio grátis em encomendas acima de 100€. Abaixo desse valor aplica-se uma taxa fixa de 4,90€.",
  },
  {
    title: "Grandes eletrodomésticos",
    body: "Entrega e instalação agendadas por contacto telefónico após a confirmação da encomenda.",
  },
  {
    title: "Seguimento da encomenda",
    body: "Após o envio recebe um código de rastreio por email para acompanhar a entrega em tempo real.",
  },
];

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Entregas</h1>
      <div className="mt-8 space-y-6">
        {items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
