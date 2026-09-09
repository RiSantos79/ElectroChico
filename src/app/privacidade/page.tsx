export const metadata = { title: "Política de Privacidade — ElectroChico" };

const sections = [
  {
    title: "O que guardamos no teu browser",
    body: "Usamos apenas o armazenamento local (localStorage) do teu próprio dispositivo para guardar a preferência de tema (claro/escuro), o conteúdo do carrinho e a lista de favoritos. Estes dados nunca saem do teu browser nem são enviados para nós — não são cookies de rastreio, publicidade ou análise de terceiros.",
  },
  {
    title: "Dados que nos envias",
    body: "Se deixares uma avaliação num produto, guardamos o nome que indicares, a classificação e o comentário. Se fizeres login no backoffice (equipa ElectroChico), guardamos o email e uma password encriptada (nunca em texto simples).",
  },
  {
    title: "O que não fazemos",
    body: "Não usamos cookies de publicidade, não vendemos dados a terceiros, e não temos ferramentas de rastreio de terceiros (como Google Analytics ou pixels de redes sociais) neste momento.",
  },
  {
    title: "Os teus direitos",
    body: "Podes pedir a eliminação de qualquer avaliação que tenhas deixado, ou esclarecimentos sobre os teus dados, através da página de Contacto.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
      <div className="mt-8 space-y-6">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="font-semibold text-foreground">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
