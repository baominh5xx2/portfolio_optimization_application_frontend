export interface StockData {
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
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  reason: string;
  target_price?: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  sma_5: number;
  sma_20: number;
  weight: number;
  allocation: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentiment_score: number;
  news_count: number;
  latest_news: string[];
}

export interface PortfolioRecommendation {
  date: string;
  market_status: string;
  total_recommendations: number;
  stocks: StockData[];
  summary: {
    buy: number;
    hold: number;
    sell: number;
  };
}
