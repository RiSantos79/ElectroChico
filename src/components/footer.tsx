const trustItems = [
  { title: "Entregas rápidas", desc: "Em 24-48h em todo o país" },
  { title: "Pagamentos seguros", desc: "MB Way, Multibanco, cartão e PayPal" },
  { title: "Apoio ao cliente", desc: "Suporte dedicado 7 dias por semana" },
  { title: "Garantia oficial", desc: "Garantia do fabricante em todos os produtos" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="grid grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4 lg:px-10">
        {trustItems.map((item) => (
          <div key={item.title}>
            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="px-6 py-6 text-sm text-muted lg:px-10">
          © {new Date().getFullYear()} ElectroChico. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
