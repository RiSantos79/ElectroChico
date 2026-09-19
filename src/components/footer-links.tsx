import { SITE_URL } from "@/lib/site";

// O relatório de segurança é sobre o nosso domínio, por isso é construído a
// partir do SITE_URL em vez de ficar fixo — apontá-lo à mão é a forma certa
// de acabar a mostrar o relatório de outra loja.
const SAFE_BROWSING = `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(SITE_URL)}`;

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-4 shrink-0"
    >
      {children}
    </svg>
  );
}

const ShieldCheck = () => (
  <Icon>
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

const Sparkle = () => (
  <Icon>
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2l-1.8-5.6L4.5 10.8 10.2 9 12 3.5Z" />
    <path d="M18.5 3.5v3M20 5h-3" />
  </Icon>
);

const ComplaintBook = () => (
  <Icon>
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5v-16Z" />
    <path d="M5 20.5A1.5 1.5 0 0 1 6.5 19H19v2H6.5A1.5 1.5 0 0 1 5 20.5Z" />
    <path d="M12 7v4.5M12 14.2v.1" />
  </Icon>
);

const links = [
  {
    href: SAFE_BROWSING,
    label: "Site seguro",
    title: "Estado de segurança deste site no relatório de transparência da Google",
    icon: <ShieldCheck />,
  },
  {
    href: "https://www.livroreclamacoes.pt/Pedido/ElogioSugestao",
    label: "Elogio ou sugestão",
    title: "Deixar um elogio ou sugestão no Livro de Reclamações Eletrónico",
    icon: <Sparkle />,
  },
  {
    href: "https://www.livroreclamacoes.pt/inicio/reclamacao",
    label: "Livro de reclamações",
    title: "Apresentar uma reclamação no Livro de Reclamações Eletrónico",
    icon: <ComplaintBook />,
  },
];

export function FooterLinks() {
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((link) => (
        <li key={link.href}>
          <a
            href={link.href}
            target="_blank"
            // noreferrer além de noopener: são sites externos e não há razão
            // para lhes dizer de onde vem o visitante.
            rel="noopener noreferrer"
            title={link.title}
            className="group flex items-center gap-2 rounded-full border border-border bg-surface-raised px-3.5 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-foreground"
          >
            <span className="text-muted transition-colors group-hover:text-accent">{link.icon}</span>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
