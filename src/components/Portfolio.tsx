import { useState, useEffect } from 'react';
import type { PortfolioRecommendation } from '../types/portfolio';
import sampleData from '../../public/data.json';

function formatVolume(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'T';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

export function Portfolio() {
  const [data, setData] = useState<PortfolioRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    // Use hardcoded sample data (from backend inference)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData(sampleData as any);
    setLoading(false);

    // Optional: Uncomment below to fetch from API instead
    /*
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    fetch(`${API_URL}/inference/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolio_size: 5 })
    })
      .then(res => {
        if (!res.ok) throw new Error('Không thể lấy dữ liệu');
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Lỗi kết nối');
        setLoading(false);
      });
    */
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Đang tải dữ liệu thị trường...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dữ liệu thị trường chứng khoán</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-400">{data?.date}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Tổng cổ phiếu</p>
            <p className="text-3xl font-bold">{data?.total_recommendations}</p>
          </div>
        </div>

        {/* Stock List */}
        <div className="space-y-4">
          {data?.stocks.sort((a, b) => b.weight - a.weight).map((stock) => {
            return (
              <div
                key={stock.symbol}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Left - Stock Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-white">{stock.symbol}</span>
                      <span className="px-2 py-1 bg-blue-600 text-white text-sm font-semibold rounded">
                        {stock.weight}%
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{stock.name}</p>

                    {/* Price Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Giá</p>
                        <p className="font-semibold">{stock.price.toLocaleString()}K</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Thay đổi</p>
                        <p className={`font-semibold ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}K ({stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Khối lượng</p>
                        <p className="font-semibold">{formatVolume(stock.volume)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">TB 20 ngày</p>
                        <p className="font-semibold">{formatVolume(stock.avg_volume)}</p>
                      </div>
                    </div>

                    {/* OHLC */}
                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Mở cửa</p>
                        <p className="font-medium">{stock.open.toLocaleString()}K</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Cao nhất</p>
                        <p className="font-medium text-green-400">{stock.high.toLocaleString()}K</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Thấp nhất</p>
                        <p className="font-medium text-red-400">{stock.low.toLocaleString()}K</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Ngành</p>
                        <p className="font-medium">{stock.sector}</p>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-gray-500 text-xs mb-1">Chỉ báo kỹ thuật</p>
                      <div className="flex gap-4 text-sm">
                        <span className={stock.sma_5 > stock.sma_20 ? 'text-green-400' : 'text-red-400'}>
                          SMA5: {stock.sma_5.toFixed(1)}K
                        </span>
                        <span className={stock.sma_20 > stock.sma_5 ? 'text-red-400' : 'text-green-400'}>
                          SMA20: {stock.sma_20.toFixed(1)}K
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right - News */}
                  <div className="text-right max-w-xs">
                    {stock.latest_news && stock.latest_news.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Tin mới nhất</p>
                        <div className="space-y-2">
                          {stock.latest_news.slice(0, 2).map((news, idx) => (
                            <p key={idx} className="text-xs text-gray-500 line-clamp-2">{news}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
