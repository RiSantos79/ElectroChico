export const RECOMMENDATION_KINDS = ['RELATED', 'CROSS_SELL', 'UPSELL', 'BOUGHT_TOGETHER'] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export type RecommendationRequest = {
  productId: string;
  kind: RecommendationKind;
  limit: number;
};

export type RecommendationRules = {
  preferSameBrand: boolean;
  priceTolerancePct: number;
  useCoPurchase: boolean;
};

// A costura: hoje só existe a estratégia por regras, mas um modelo de ML
// (serviço externo ou próprio) entra aqui como outra implementação desta
// mesma interface — o resto da aplicação continua a pedir "recomendações
// para este produto" sem saber quem responde.
export interface RecommendationStrategy {
  readonly name: string;
  /** Devolve ids de produtos, já ordenados por relevância. */
  recommend(request: RecommendationRequest, rules: RecommendationRules): Promise<string[]>;
}
