/// <reference types="vitest" />

declare module '*.json' {
  const value: {
    date: string;
    market_status: string;
    total_recommendations: number;
    stocks: Array<{
      symbol: string;
      name: string;
      sector: string;
      price: number;
      open: number;
      high: number;
      low: number;
      change: number;
      change_percent: number;
      volume: number;
      avg_volume: number;
      market_cap?: number;
      pe_ratio?: number;
      recommendation: string;
      reason: string;
      target_price?: number;
      risk_level: string;
      sma_5: number;
      sma_20: number;
      weight: number;
      allocation: string;
      sentiment: string;
      sentiment_score: number;
      news_count: number;
      latest_news: string[];
    }>;
    summary: {
      buy: number;
      hold: number;
      sell: number;
    };
    fetched_at: string;
  };
  export default value;
}

declare global {
  var global: typeof globalThis;
}
