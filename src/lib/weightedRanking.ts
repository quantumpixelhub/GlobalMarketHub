type RankableProduct = {
  id: string;
  title: string;
  description?: string;
  currentPrice: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  isFeatured?: boolean;
  seller?: {
    id?: string;
    storeName?: string;
    rating?: number;
    reviewCount?: number;
    isVerified?: boolean;
  };
  createdAt?: string | Date;
};

export type RankingWeights = {
  textRelevance: number;
  conversionSignal: number;
  clickSignal: number;
  ratingConfidence: number;
  priceCompetitiveness: number;
  sellerQuality: number;
  freshness: number;
};

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  textRelevance: 0.35,
  conversionSignal: 0.2,
  clickSignal: 0.15,
  ratingConfidence: 0.1,
  priceCompetitiveness: 0.08,
  sellerQuality: 0.07,
  freshness: 0.05,
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((v) => v.trim())
    .filter((v) => v.length > 1);
}

function textRelevanceScore(query: string, product: RankableProduct) {
  const q = query.trim().toLowerCase();
  if (!q) return 0.5;

  const title = String(product.title || '').toLowerCase();
  const description = String(product.description || '').toLowerCase();
  const qTokens = tokenize(q);

  let score = 0;
  if (title.includes(q)) score += 0.6;
  if (description.includes(q)) score += 0.2;

  if (qTokens.length > 0) {
    const titleTokenHits = qTokens.filter((t) => title.includes(t)).length;
    const descriptionTokenHits = qTokens.filter((t) => description.includes(t)).length;
    score += 0.15 * (titleTokenHits / qTokens.length);
    score += 0.05 * (descriptionTokenHits / qTokens.length);
  }

  return clamp01(score);
}

function bayesianRatingScore(rating: number, reviewCount: number) {
  const C = 3.6;
  const m = 20;
  const r = Number.isFinite(rating) ? rating : 0;
  const v = Math.max(0, Number.isFinite(reviewCount) ? reviewCount : 0);
  const weighted = (v / (v + m)) * r + (m / (v + m)) * C;
  return clamp01(weighted / 5);
}

function priceCompetitivenessScore(price: number, marketMedianPrice: number) {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(marketMedianPrice) || marketMedianPrice <= 0) {
    return 0.5;
  }

  const ratio = price / marketMedianPrice;
  if (ratio <= 0.5) return 1;
  if (ratio <= 1) return clamp01(1 - (ratio - 0.5) * 0.6);
  if (ratio <= 1.5) return clamp01(0.7 - (ratio - 1) * 0.8);
  return clamp01(0.3 - (ratio - 1.5) * 0.2);
}

function sellerQualityScore(product: RankableProduct) {
  const sellerRating = Number(product.seller?.rating || 0);
  const sellerReviewCount = Number(product.seller?.reviewCount || 0);
  const verifiedBoost = product.seller?.isVerified ? 0.05 : 0;

  const ratingComponent = clamp01(sellerRating / 5) * 0.7;
  const reviewComponent = clamp01(Math.log10(sellerReviewCount + 1) / 3) * 0.25;
  return clamp01(ratingComponent + reviewComponent + verifiedBoost);
}

function freshnessScore(createdAt?: string | Date) {
  if (!createdAt) return 0.5;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0.5;

  const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 3) return 1;
  if (ageDays <= 15) return 0.85;
  if (ageDays <= 45) return 0.65;
  if (ageDays <= 90) return 0.45;
  return 0.25;
}

function getMedian(values: number[]) {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (clean.length === 0) return 0;
  const mid = Math.floor(clean.length / 2);
  if (clean.length % 2 === 0) {
    return (clean[mid - 1] + clean[mid]) / 2;
  }
  return clean[mid];
}

export function applyWeightedRanking<T extends RankableProduct>(
  items: T[],
  query: string,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS,
  behavioralSignals?: Record<string, { ctr?: number; conversionRate?: number }>
): Array<T & { rankingScore: number }> {
  const medianPrice = getMedian(items.map((item) => Number(item.currentPrice || 0)));

  return items
    .map((item) => {
      const signal = behavioralSignals?.[item.id];
      const conversionSignal = clamp01(Number(signal?.conversionRate ?? 0));
      const clickSignal = clamp01(Number(signal?.ctr ?? 0));

      const score =
        weights.textRelevance * textRelevanceScore(query, item) +
        weights.conversionSignal * conversionSignal +
        weights.clickSignal * clickSignal +
        weights.ratingConfidence * bayesianRatingScore(Number(item.rating || 0), Number(item.reviewCount || 0)) +
        weights.priceCompetitiveness * priceCompetitivenessScore(Number(item.currentPrice || 0), medianPrice) +
        weights.sellerQuality * sellerQualityScore(item) +
        weights.freshness * freshnessScore(item.createdAt);

      return {
        ...item,
        rankingScore: Number(score.toFixed(6)),
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}
