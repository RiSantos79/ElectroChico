-- CreateTable
CREATE TABLE "ContentPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentPage_slug_key" ON "ContentPage"("slug");

-- Semeia o conteúdo com o texto que estava fixo no código, para as páginas
-- nunca aparecerem vazias antes de o admin as editar pela primeira vez.
INSERT INTO "ContentPage" (id, slug, title, body, "updatedAt") VALUES
(
    md5(random()::text || clock_timestamp()::text || 'entregas'),
    'entregas',
    'Entregas',
    '<h2>Prazos de entrega</h2><p>Encomendas em stock são expedidas em 24 a 48h úteis em Portugal Continental. Ilhas: 3 a 5 dias úteis.</p><h2>Custos de envio</h2><p>Envio grátis em encomendas acima de 100€. Abaixo desse valor aplica-se uma taxa fixa de 4,90€.</p><h2>Grandes eletrodomésticos</h2><p>Entrega e instalação agendadas por contacto telefónico após a confirmação da encomenda.</p><h2>Seguimento da encomenda</h2><p>Após o envio recebe um código de rastreio por email para acompanhar a entrega em tempo real.</p>',
    now()
),
(
    md5(random()::text || clock_timestamp()::text || 'privacidade'),
    'privacidade',
    'Política de Privacidade',
    '<h2>O que guardamos no teu browser</h2><p>Usamos apenas o armazenamento local (localStorage) do teu próprio dispositivo para guardar a preferência de tema (claro/escuro), o conteúdo do carrinho e a lista de favoritos. Estes dados nunca saem do teu browser nem são enviados para nós — não são cookies de rastreio, publicidade ou análise de terceiros.</p><h2>Dados que nos envias</h2><p>Se deixares uma avaliação num produto, guardamos o nome que indicares, a classificação e o comentário. Se fizeres login no backoffice (equipa ElectroChico), guardamos o email e uma password encriptada (nunca em texto simples).</p><h2>O que não fazemos</h2><p>Não usamos cookies de publicidade, não vendemos dados a terceiros, e não temos ferramentas de rastreio de terceiros (como Google Analytics ou pixels de redes sociais) neste momento.</p><h2>Os teus direitos</h2><p>Podes pedir a eliminação de qualquer avaliação que tenhas deixado, ou esclarecimentos sobre os teus dados, através da página de Contacto.</p>',
    now()
),
(
    md5(random()::text || clock_timestamp()::text || 'contacto'),
    'contacto',
    'Contacto',
    '<p>Tem alguma dúvida? Preencha o formulário e a nossa equipa responde o mais rápido possível.</p>',
    now()
),
(
    md5(random()::text || clock_timestamp()::text || 'orcamentos'),
    'orcamentos',
    'Pedido de orçamento',
    '<p>Precisa de um orçamento para instalação ou compra em quantidade? Conte-nos o que procura.</p>',
    now()
);
