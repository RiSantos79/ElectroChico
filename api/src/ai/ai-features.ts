// Catálogo de funcionalidades de IA. Os prompts vivem aqui, no servidor: o
// backoffice só escolhe uma funcionalidade da lista e envia contexto
// estruturado (nome do produto, categoria, texto atual...), nunca o prompt
// em si — assim o custo e o comportamento do modelo ficam sob controlo.

export const AI_FEATURES = [
  // Sem botão no backoffice de propósito: o produto não tem campo de descrição
  // curta e a meta descrição já cobre esse texto. Fica disponível para o dia em
  // que o cartão de produto passar a mostrar um resumo.
  'PRODUCT_SHORT_DESCRIPTION',
  'PRODUCT_LONG_DESCRIPTION',
  'PRODUCT_SPECS',
  'TEXT_IMPROVE',
  'TEXT_SPELLCHECK',
  'TEXT_REWRITE',
  'SEO_TITLE',
  'SEO_DESCRIPTION',
  'SEO_KEYWORDS',
  'SEO_CONTENT',
  'SEO_SUGGESTIONS',
  'FAQ_GENERATE',
  'MARKETING_CAMPAIGN',
  'MARKETING_BANNER',
  'MARKETING_NEWSLETTER',
  'MARKETING_SEASONAL',
  'MARKETING_LANDING_PAGE',
  'RELATED_PRODUCTS',
  'ASSISTANT',
] as const;

export type AiFeature = (typeof AI_FEATURES)[number];

export const AI_FEATURE_LABELS: Record<AiFeature, string> = {
  PRODUCT_SHORT_DESCRIPTION: 'Descrição curta de produto',
  PRODUCT_LONG_DESCRIPTION: 'Descrição longa de produto',
  PRODUCT_SPECS: 'Especificações técnicas',
  TEXT_IMPROVE: 'Melhorar texto',
  TEXT_SPELLCHECK: 'Corrigir ortografia',
  TEXT_REWRITE: 'Reescrever conteúdo',
  SEO_TITLE: 'Meta título',
  SEO_DESCRIPTION: 'Meta descrição',
  SEO_KEYWORDS: 'Keywords',
  SEO_CONTENT: 'Conteúdo SEO',
  SEO_SUGGESTIONS: 'Sugestões SEO',
  FAQ_GENERATE: 'Perguntas frequentes',
  MARKETING_CAMPAIGN: 'Campanha promocional',
  MARKETING_BANNER: 'Texto de banner',
  MARKETING_NEWSLETTER: 'Texto de newsletter',
  MARKETING_SEASONAL: 'Campanha sazonal',
  MARKETING_LANDING_PAGE: 'Landing page',
  RELATED_PRODUCTS: 'Produtos relacionados',
  ASSISTANT: 'Assistente do backoffice',
};

const BASE_SYSTEM =
  'És um assistente de e-commerce da ElectroChico, uma loja portuguesa de eletrodomésticos, TV e climatização. ' +
  'Escreves sempre em português de Portugal, num tom profissional e claro, sem inventar características que não ' +
  'constem do contexto dado. Respondes apenas com o conteúdo pedido, sem preâmbulos nem comentários.';

type Context = Record<string, string | undefined>;

function productBlock(ctx: Context): string {
  return [
    ctx.name && `Produto: ${ctx.name}`,
    ctx.brand && `Marca: ${ctx.brand}`,
    ctx.category && `Categoria: ${ctx.category}`,
    ctx.price && `Preço: ${ctx.price}`,
    ctx.energyClass && `Classe energética: ${ctx.energyClass}`,
    ctx.specs && `Especificações conhecidas:\n${ctx.specs}`,
    ctx.description && `Descrição atual:\n${ctx.description}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildPrompt(feature: AiFeature, context: Context): { system: string; prompt: string; maxTokens: number } {
  const product = productBlock(context);
  const text = context.text ?? context.description ?? '';

  switch (feature) {
    case 'PRODUCT_SHORT_DESCRIPTION':
      return {
        system: BASE_SYSTEM,
        prompt: `Escreve uma descrição curta (1 a 2 frases, máximo 250 caracteres) para este produto.\n\n${product}`,
        maxTokens: 300,
      };
    case 'PRODUCT_LONG_DESCRIPTION':
      return {
        system: `${BASE_SYSTEM} Devolves HTML simples, usando apenas <p>, <strong>, <ul> e <li>.`,
        prompt: `Escreve uma descrição comercial completa (3 a 5 parágrafos) para este produto, destacando benefícios reais para quem o usa em casa.\n\n${product}`,
        maxTokens: 1200,
      };
    case 'PRODUCT_SPECS':
      return {
        system: `${BASE_SYSTEM} Devolves uma especificação por linha, no formato "Nome: Valor", sem marcadores nem numeração.`,
        prompt: `Organiza e completa as especificações técnicas deste produto, mantendo apenas o que é plausível a partir do contexto.\n\n${product}`,
        maxTokens: 600,
      };
    case 'TEXT_IMPROVE':
      return {
        system: BASE_SYSTEM,
        prompt: `Melhora o texto seguinte, tornando-o mais claro e apelativo, sem alterar os factos nem o comprimento aproximado.\n\n${text}`,
        maxTokens: 1200,
      };
    case 'TEXT_SPELLCHECK':
      return {
        system: `${BASE_SYSTEM} Corriges apenas ortografia, acentuação, pontuação e concordância — nunca reescreves o conteúdo.`,
        prompt: `Corrige os erros do texto seguinte e devolve-o corrigido.\n\n${text}`,
        maxTokens: 1200,
      };
    case 'TEXT_REWRITE':
      return {
        system: BASE_SYSTEM,
        prompt: `Reescreve o texto seguinte com outras palavras, mantendo o mesmo significado e factos.\n\n${text}`,
        maxTokens: 1200,
      };
    case 'SEO_TITLE':
      return {
        system: `${BASE_SYSTEM} Devolves apenas o título, sem aspas, com um máximo de 60 caracteres.`,
        prompt: `Escreve um meta título otimizado para motores de busca para este produto.\n\n${product}`,
        maxTokens: 120,
      };
    case 'SEO_DESCRIPTION':
      return {
        system: `${BASE_SYSTEM} Devolves apenas a descrição, sem aspas, entre 140 e 158 caracteres.`,
        prompt: `Escreve uma meta descrição otimizada para motores de busca para este produto.\n\n${product}`,
        maxTokens: 200,
      };
    case 'SEO_KEYWORDS':
      return {
        system: `${BASE_SYSTEM} Devolves apenas as palavras-chave separadas por vírgulas, sem numeração.`,
        prompt: `Sugere entre 8 e 12 palavras-chave de pesquisa relevantes para este produto.\n\n${product}`,
        maxTokens: 200,
      };
    case 'SEO_CONTENT':
      return {
        system: `${BASE_SYSTEM} Devolves HTML simples, usando apenas <h2>, <p> e <ul>/<li>.`,
        prompt: `Escreve um bloco de conteúdo SEO (300 a 400 palavras) sobre este produto ou categoria, útil para quem está a decidir a compra.\n\n${product || (context.topic ?? '')}`,
        maxTokens: 1200,
      };
    case 'SEO_SUGGESTIONS':
      return {
        system: `${BASE_SYSTEM} Devolves uma lista de sugestões concretas, uma por linha, começadas por "- ".`,
        prompt: `Analisa este conteúdo e sugere melhorias de SEO acionáveis.\n\n${product}\n\nConteúdo:\n${text}`,
        maxTokens: 800,
      };
    case 'FAQ_GENERATE':
      return {
        system: `${BASE_SYSTEM} Devolves uma pergunta por linha, no formato "Pergunta | Resposta", sem numeração.`,
        prompt: `Escreve 5 perguntas frequentes com respostas curtas e úteis sobre este produto.\n\n${product}`,
        maxTokens: 900,
      };
    case 'MARKETING_CAMPAIGN':
      return {
        system: BASE_SYSTEM,
        prompt: `Propõe uma campanha promocional: nome, mensagem principal, público-alvo, canais e uma sugestão de desconto.\n\nContexto: ${context.topic ?? product}`,
        maxTokens: 900,
      };
    case 'MARKETING_BANNER':
      return {
        system: `${BASE_SYSTEM} Devolves três linhas: "Título:", "Subtítulo:" e "Botão:".`,
        prompt: `Escreve o texto de um banner de destaque para a homepage.\n\nContexto: ${context.topic ?? product}`,
        maxTokens: 300,
      };
    case 'MARKETING_NEWSLETTER':
      return {
        system: `${BASE_SYSTEM} Devolves o assunto na primeira linha (começada por "Assunto:") e o corpo em HTML simples a seguir.`,
        prompt: `Escreve uma newsletter para os subscritores da loja.\n\nContexto: ${context.topic ?? product}`,
        maxTokens: 1200,
      };
    case 'MARKETING_SEASONAL':
      return {
        system: BASE_SYSTEM,
        prompt: `Propõe uma campanha sazonal completa (mensagem, produtos a destacar e calendário sugerido) para: ${context.topic ?? 'a próxima época alta'}.`,
        maxTokens: 1000,
      };
    case 'MARKETING_LANDING_PAGE':
      return {
        system: `${BASE_SYSTEM} Devolves HTML simples, usando apenas <h1>, <h2>, <p> e <ul>/<li>.`,
        prompt: `Escreve o conteúdo de uma landing page de campanha.\n\nContexto: ${context.topic ?? product}`,
        maxTokens: 1500,
      };
    case 'RELATED_PRODUCTS':
      return {
        system: `${BASE_SYSTEM} Devolves apenas nomes de produtos da lista dada, um por linha, no máximo 4.`,
        prompt: `Escolhe da lista os produtos que fazem mais sentido sugerir a quem está a ver o produto principal (complementares ou superiores).\n\nProduto principal:\n${product}\n\nLista disponível:\n${context.candidates ?? ''}`,
        maxTokens: 300,
      };
    case 'ASSISTANT':
      return {
        system: `${BASE_SYSTEM} És o assistente do backoffice. Respondes com base apenas nos dados de negócio fornecidos; se não forem suficientes, dizes o que falta.`,
        prompt: `Pergunta do administrador: ${context.question ?? ''}\n\nDados atuais da loja:\n${context.data ?? '(sem dados fornecidos)'}`,
        maxTokens: 1200,
      };
  }
}
