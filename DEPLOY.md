# Deploy de staging (acesso só para ti)

Três serviços gratuitos: **Neon** (base de dados), **Render** (API NestJS) e **Vercel** (site Next.js).
O site inteiro fica atrás de autenticação HTTP Basic — só quem tiver a credencial que definires consegue sequer abrir a página.

## Ordem recomendada

### 1. Neon (base de dados)

1. Cria conta em neon.tech e um projeto novo (ex. `electrochico`).
2. Copia a **connection string** (formato `postgresql://user:pass@host/db?sslmode=require`).
3. Guarda-a — é o `DATABASE_URL` que vais usar no Render.

### 2. GitHub (necessário para o deploy automático no Render e na Vercel)

Se ainda não tiveres o projeto num repositório GitHub, avisa-me quando tiveres conta criada que eu preparo o `git init` + primeiro commit e diz-me o nome que queres dar ao repositório.

### 3. Render (API)

1. Cria conta em render.com, liga a tua conta GitHub.
2. "New" → "Blueprint" → escolhe o repositório — o Render lê o ficheiro `render.yaml` já preparado na raiz do projeto.
3. Nas variáveis de ambiente do serviço `electrochico-api`, define:

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | a connection string do Neon |
   | `JWT_SECRET` | gera um valor aleatório com `openssl rand -hex 32` (ou pede-me para gerar) |
   | `WEB_ORIGIN` | o URL que a Vercel te der (define depois do passo 4, ex. `https://electrochico.vercel.app`) |
   | `ADMIN_EMAIL` | o email que vais usar para entrar no backoffice |
   | `ADMIN_PASSWORD` | uma password forte — só é usada uma vez, no primeiro seed |

4. Depois do primeiro deploy, corre o seed uma única vez (cria as categorias, produtos de exemplo e o utilizador admin). A forma mais simples: no dashboard do Render, abre o "Shell" do serviço e corre `npm run prisma:seed`.

### 4. Vercel (site)

1. Cria conta em vercel.com, liga a tua conta GitHub.
2. "Add New" → "Project" → escolhe o mesmo repositório. A raiz do projeto (onde está o Next.js) é a raiz do repositório — não precisas de mudar nada nas definições de build.
3. Define as variáveis de ambiente:

   | Variável | Valor |
   |---|---|
   | `API_URL` | o URL do serviço no Render (ex. `https://electrochico-api.onrender.com`) |
   | `JWT_SECRET` | **exatamente o mesmo valor** que puseste no Render |
   | `STAGING_BASIC_AUTH_USER` | um nome de utilizador à tua escolha |
   | `STAGING_BASIC_AUTH_PASSWORD` | uma password à tua escolha |

4. Faz deploy. Quando abrires o URL da Vercel, o browser vai pedir a credencial do Basic Auth antes de mostrar seja o que for.
5. Volta ao Render e atualiza `WEB_ORIGIN` com o URL final da Vercel (para o CORS da API aceitar pedidos vindos de lá).

## Limitações do plano gratuito (para não seres apanhado de surpresa)

- **Render free**: o serviço "adormece" ao fim de ~15 min sem pedidos — o primeiro acesso depois disso demora uns segundos a acordar.
- **Neon free**: base de dados pequena (storage limitado), mais que suficiente para staging.
- Nenhum destes é recomendado para produção com tráfego real — para isso, os planos pagos (ou outra escolha de infraestrutura) entram em cena mais tarde.

## Quando estiveres pronto

Avisa-me quando tiveres as contas criadas e eu ajudo a rever cada passo contigo, incluindo gerar os segredos e confirmar que tudo está ligado corretamente.
