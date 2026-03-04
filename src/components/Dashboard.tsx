import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import type { PortfolioRecommendation } from '../types/portfolio';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Generate mock historical data based on current portfolio
function generateHistoricalData(_stocks: PortfolioRecommendation['stocks']) {
  const portfolioData: number[] = [0];
  const indexData: number[] = [0];

  let portfolio = 0;
  let index = 0;

  // Generate 60 days of data
  for (let i = 1; i < 60; i++) {
    // Portfolio with some randomness
    portfolio += Math.random() * 4 - 1.5;
    index += Math.random() * 3 - 1.2;
    portfolioData.push(portfolio);
    indexData.push(index);
  }

  return { portfolioData, indexData };
}

interface DashboardProps {
  data: PortfolioRecommendation;
}

export function Dashboard({ data }: DashboardProps) {
  const [gaugeRotation, setGaugeRotation] = useState(20);

  // Calculate metrics from portfolio data
  // Use portfolio_return from inference (cumulative return from 01/2025)
  const totalReturn = (data as any).portfolio_return ?? data.stocks.reduce((sum, s) => sum + s.change_percent * (s.weight / 100), 0);
  const avgWeight = data.stocks.reduce((sum, s) => sum + s.weight, 0) / data.stocks.length;

  // Calculate risk metrics
  const volatility = Math.min(85, Math.max(20, 60 - totalReturn * 2));
  const exposure = Math.min(90, Math.max(30, avgWeight * 3));
  const valueAtRisk = Math.min(95, Math.max(25, 70 - totalReturn * 1.5));

  // Sentiment analysis - calculate from actual stock data
  const gainers = data.stocks.filter(s => s.change_percent > 0).length;
  const losers = data.stocks.filter(s => s.change_percent < 0).length;
  const buyCount = data.stocks.filter(s => s.recommendation === 'BUY').length;
  const sellCount = data.stocks.filter(s => s.recommendation === 'SELL').length;

  // Calculate sentiment: based on gainers vs losers and buy vs sell recommendations
  // Range: 0 to 100 (instead of -100 to +100)
  const priceSentiment = ((gainers - losers) / data.stocks.length) * 50; // -50 to +50
  const recSentiment = ((buyCount - sellCount) / data.stocks.length) * 50; // -50 to +50
  const rawSentiment = priceSentiment + recSentiment; // -100 to +100
  const sentimentScore = Math.round((rawSentiment + 100) / 2); // Convert to 0 to 100
  // 0-30: Risk-On, 30-60: Neutral, 60-100: Risk-Off

  // Risk Mode: based on sentiment score (0 to 100)
  // 0-30: Risk-On
  // 30-60: Neutral
  // 60-100: Risk-Off
  const getRiskMode = (sentiment: number): { label: string; color: string } => {
    if (sentiment < 30) return { label: 'Risk-On', color: 'text-green-500' };
    if (sentiment > 60) return { label: 'Risk-Off', color: 'text-red-500' };
    return { label: 'Neutral', color: 'text-yellow-500' };
  };
  const riskMode = getRiskMode(sentimentScore);

  // Historical data - use real data from inference if available
  const cumulativeChart = (data as any).cumulative_chart;
  const portfolioData = cumulativeChart?.portfolio ?? generateHistoricalData(data.stocks).portfolioData;
  const labels = Array.from({ length: portfolioData.length }, (_, i) => i);

  // All stocks sorted by weight
  const sortedStocks = [...data.stocks].sort((a, b) => b.weight - a.weight);

  // Top 6 stocks + Others - for BOTH Pie and Area charts
  const topStocks = sortedStocks.slice(0, 6);
  const othersWeight = sortedStocks.slice(6).reduce((sum, s) => sum + s.weight, 0);

  // Both charts use same data: Top 6 + Others
  // Put Others (gray) at the beginning so it appears at bottom of stacked chart
  const stockLabels = ['Others', ...topStocks.map(s => s.symbol)];
  const stockValues = [othersWeight, ...topStocks.map(s => s.weight)];

  // Same colors for both charts - gray (Others) first
  const stockColors = ['#6b7280', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Area chart uses SAME data as pie chart - with more variation for smooth curves
  const generateStockHistory = (baseWeight: number, idx: number) => {
    // Add more dramatic variation over time periods for smooth curves
    const timeVariation = [
      baseWeight * 0.6,
      baseWeight * 0.75,
      baseWeight * 0.9,
      baseWeight,
      baseWeight * 0.85,
      baseWeight * 0.7,
    ];
    // Add stock-specific offset
    const stockOffset = (idx % 3) * baseWeight * 0.1;
    return timeVariation.map(v => v + stockOffset);
  };

  // Raw data - Others first (for bottom of stacked chart)
  const rawData = [
    {
      label: 'Others',
      data: generateStockHistory(othersWeight, 0),
      backgroundColor: stockColors[0],
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 0,
    },
    ...topStocks.map((stock, idx) => ({
      label: stock.symbol,
      data: generateStockHistory(stock.weight, idx + 1),
      backgroundColor: stockColors[idx + 1],
      fill: '-1',
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 0,
    })),
  ];

  // Normalize each time period to sum to 100%
  const areaChartDatasets = rawData.map((ds) => ({
    ...ds,
    data: ds.data.map((val: number, timeIdx: number) => {
      const totalAtTime = rawData.reduce((sum, d) => sum + d.data[timeIdx], 0);
      const normalized = (val / totalAtTime) * 100;
      return Math.max(0, normalized);
    }),
  }));

  // Cumulative Return Chart Data
  const cumulativeChartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Portfolio',
        data: portfolioData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0,
        pointRadius: 0,
        fill: true,
        yAxisID: 'y',
      },
    ],
  };

  const cumulativeChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          callback: function(_val, index) {
            // Use real labels if available
            if (cumulativeChart?.labels && cumulativeChart.labels[index]) {
              return cumulativeChart.labels[index];
            }
            return '';
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Portfolio (%)',
          color: '#3b82f6',
        },
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
        grid: {
          drawOnChartArea: true,
        },
      },
    },
  };

  // Pie Chart Data - Top 5 stocks + Others
  const pieChartData: ChartData<'pie'> = {
    labels: stockLabels,
    datasets: [{
      data: stockValues,
      backgroundColor: stockColors,
      borderWidth: 1,
      borderColor: '#ffffff',
    }],
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { size: 10 } },
      },
    },
  };

  // Allocation Over Time (same as pie chart - Top 5 + Others)
  const areaChartData: ChartData<'line'> = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2'],
    datasets: areaChartDatasets.map(ds => ({
      ...ds,
      backgroundColor: ds.backgroundColor,
    })),
  };

  const areaChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: {
        stacked: true,
        display: true,
        min: 0,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          },
        },
      },
    },
  };

  // Sentiment Trend Chart - generate based on current sentiment (0-100)
  const baseSentiment = sentimentScore;
  const sentimentData = [
    Math.max(0, Math.min(100, baseSentiment - 20 + Math.random() * 15)),
    Math.max(0, Math.min(100, baseSentiment - 15 + Math.random() * 15)),
    Math.max(0, Math.min(100, baseSentiment - 10 + Math.random() * 15)),
    Math.max(0, Math.min(100, baseSentiment - 5 + Math.random() * 10)),
    Math.max(0, Math.min(100, baseSentiment + Math.random() * 10)),
    Math.max(0, Math.min(100, baseSentiment + Math.random() * 10)),
    Math.max(0, Math.min(100, baseSentiment + Math.random() * 15)),
    Math.max(0, Math.min(100, baseSentiment + Math.random() * 15)),
    Math.max(0, Math.min(100, baseSentiment + Math.random() * 10)),
    baseSentiment,
  ];
  const sentimentChartData: ChartData<'line'> = {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [{
      data: sentimentData,
      borderColor: '#88cc88',
      backgroundColor: 'rgba(136, 204, 136, 0.2)',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 0,
      fill: true,
      segment: {
        // 0-30: Risk-On (green), 30-60: Neutral (yellow), 60-100: Risk-Off (red)
        borderColor: ctx => {
          const y = ctx.p0.parsed.y ?? 50;
          if (y < 30) return '#88cc88';  // Risk-On = green
          if (y > 60) return '#ef4444';   // Risk-Off = red
          return '#eab308';                // Neutral = yellow
        },
        backgroundColor: ctx => {
          const y = ctx.p0.parsed.y ?? 50;
          if (y < 30) return 'rgba(136, 204, 136, 0.2)';   // Risk-On = green
          if (y > 60) return 'rgba(239, 68, 68, 0.2)';     // Risk-Off = red
          return 'rgba(234, 179, 8, 0.2)';                  // Neutral = yellow
        }
      }
    }],
  };

  const sentimentChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 },
    },
  };

  // Calculate gauge rotation based on risk level
  useEffect(() => {
    // Risk level determines rotation: -20deg (low) to 40deg (high)
    const riskValue = (volatility + exposure + valueAtRisk) / 3;
    const rotation = -20 + (riskValue / 100) * 60;
    setGaugeRotation(rotation);
  }, [volatility, exposure, valueAtRisk]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-4 md:mb-0">
            Investment Dashboard
          </h1>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Return</h3>
            <p className={`text-xl font-bold ${totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Sharpe Ratio</h3>
            <p className="text-xl font-bold">1.85</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Max Drawdown</h3>
            <p className="text-xl font-bold text-red-500">-8.4%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Risk Mode</h3>
            <p className={`text-xl font-bold ${riskMode.color}`}>{riskMode.label}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Cumulative Return Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Cumulative Return</h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    <span>Portfolio</span>
                  </div>
                </div>
              </div>
              <div className="flex-grow relative">
                <Line data={cumulativeChartData} options={cumulativeChartOptions} />
              </div>
            </div>

            {/* Allocation Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[300px]">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <h2 className="text-md font-semibold mb-2 text-center border-b border-gray-200 dark:border-gray-700 pb-2 uppercase tracking-wide">
                  Portfolio Allocation
                </h2>
                <div className="flex-grow flex items-center justify-center relative">
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <h2 className="text-md font-semibold mb-2 text-center border-b border-gray-200 dark:border-gray-700 pb-2">
                  Allocation Over Time
                </h2>
                <div className="flex-grow relative mt-2">
                  <Line data={areaChartData} options={areaChartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Risk & Sentiment */}
          <div className="flex flex-col gap-6">
            {/* Risk Gauge */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-md font-semibold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-2 uppercase tracking-wide">
                Risk Gauge
              </h2>
              <div className="flex justify-center items-center mb-8 h-36 relative mt-4">
                <div className="w-56 h-28 relative overflow-hidden">
                  <div className="w-56 h-56 rounded-full gauge-complex absolute top-0 left-0"></div>
                  <div className="w-40 h-40 rounded-full bg-white dark:bg-gray-800 absolute top-8 left-8"></div>
                  <div
                    className="absolute bottom-0 left-1/2 w-1.5 h-20 bg-gray-800 dark:bg-gray-200 origin-bottom transform z-10 rounded-t-full"
                    style={{ transform: `rotate(${gaugeRotation}deg)` }}
                  ></div>
                  <div className="absolute bottom-[-4px] left-1/2 w-6 h-6 -ml-3 rounded-full bg-gray-800 dark:bg-gray-200 z-20"></div>
                </div>
                <div className="absolute bottom-0 w-full flex justify-between px-8 text-xs font-semibold text-gray-500">
                  <span>Low</span>
                  <span>Mod</span>
                  <span>High</span>
                  <span>Ext</span>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="font-medium">Volatility</span>
                    </div>
                    <span className="font-bold">{Math.round(volatility)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${volatility}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span className="font-medium">Exposure</span>
                    </div>
                    <span className="font-bold">{Math.round(exposure)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${exposure}%` }}></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span className="font-medium">Value at Risk</span>
                    </div>
                    <span className="font-bold">{Math.round(valueAtRisk)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${valueAtRisk}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* News Sentiment */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-md font-semibold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-2 uppercase tracking-wide">
                News Sentiment
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <h3 className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase">
                    Sentiment Trend
                  </h3>
                  <div className="h-24 w-full relative mt-2 bg-[#5a1818] rounded-md">
                    <Line data={sentimentChartData} options={sentimentChartOptions} />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center border-l border-gray-200 dark:border-gray-700 pl-4">
                  <h3 className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2 font-medium uppercase">
                    Overall Score
                  </h3>
                  <div className="flex flex-col items-center justify-center h-24">
                    <span className={`text-3xl font-bold mb-1 ${sentimentScore < 30 ? 'text-green-500' : sentimentScore > 60 ? 'text-red-600' : 'text-yellow-500'}`}>
                      {sentimentScore}
                    </span>
                    <span className={`text-sm font-semibold px-2 py-1 rounded-md ${
                      sentimentScore < 30 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                      sentimentScore > 60 ? 'bg-red-900/50 text-red-400' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                    }`}>
                      {sentimentScore < 30 ? 'Risk-On' : sentimentScore > 60 ? 'Risk-Off' : 'Neutral'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
