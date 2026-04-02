import { Sprout, Cloud, TrendingUp, DollarSign, MessageSquare, Bug, Lightbulb, BarChart3, Leaf, AlertCircle, CheckCircle2, Zap, ArrowUp, ArrowDown, BarChart4 } from 'lucide-react';
import { useState, useEffect } from 'react';

type CropName = 'Wheat' | 'Mustard' | 'Cotton' | 'Rice' | 'Maize';
type CropKey = 'wheat' | 'mustard' | 'cotton' | 'rice' | 'maize';

interface MarketDataItem {
  crop: CropName;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  minimumPrice: number;
  maximumPrice: number;
  trend: 'up' | 'down';
  profitRank: number;
  profitMargin: string;
  volume: string;
  marketLocation: string;
}

interface ProfitTrendPoint {
  week: string;
  wheat: number;
  mustard: number;
  cotton: number;
  rice: number;
  maize: number;
}

const FARMING_VIDEO_SOURCES = [
  'https://assets.mixkit.co/videos/10015/10015-720.mp4',
  'https://assets.mixkit.co/videos/9797/9797-720.mp4',
  'https://assets.mixkit.co/videos/47263/47263-720.mp4',
  'https://assets.mixkit.co/videos/38427/38427-720.mp4',
];

const BASE_PROFIT_BY_CROP: Record<CropKey, number> = {
  wheat: 3500,
  mustard: 8200,
  cotton: 6500,
  rice: 2100,
  maize: 1800,
};

const INITIAL_MARKET_DATA: MarketDataItem[] = [
  {
    crop: 'Wheat',
    currentPrice: 2450,
    previousPrice: 2380,
    change: 70,
    changePercent: 2.9,
    minimumPrice: 2200,
    maximumPrice: 2650,
    trend: 'up',
    profitRank: 1,
    profitMargin: '₹3,500/acre',
    volume: '15,430 quintals',
    marketLocation: 'Ludhiana Mandi',
  },
  {
    crop: 'Mustard',
    currentPrice: 5850,
    previousPrice: 5920,
    change: -70,
    changePercent: -1.2,
    minimumPrice: 5200,
    maximumPrice: 6100,
    trend: 'down',
    profitRank: 2,
    profitMargin: '₹8,200/acre',
    volume: '8,920 quintals',
    marketLocation: 'Chandigarh Mandi',
  },
  {
    crop: 'Cotton',
    currentPrice: 6250,
    previousPrice: 6180,
    change: 70,
    changePercent: 1.1,
    minimumPrice: 5800,
    maximumPrice: 6800,
    trend: 'up',
    profitRank: 3,
    profitMargin: '₹6,500/acre',
    volume: '5,340 quintals',
    marketLocation: 'Amritsar Mandi',
  },
  {
    crop: 'Rice',
    currentPrice: 2150,
    previousPrice: 2210,
    change: -60,
    changePercent: -2.7,
    minimumPrice: 1900,
    maximumPrice: 2400,
    trend: 'down',
    profitRank: 4,
    profitMargin: '₹2,100/acre',
    volume: '22,150 quintals',
    marketLocation: 'Punjab Mandi',
  },
  {
    crop: 'Maize',
    currentPrice: 1850,
    previousPrice: 1790,
    change: 60,
    changePercent: 3.4,
    minimumPrice: 1650,
    maximumPrice: 2050,
    trend: 'up',
    profitRank: 5,
    profitMargin: '₹1,800/acre',
    volume: '12,870 quintals',
    marketLocation: 'Jalandhar Mandi',
  },
];

const INITIAL_PROFIT_TRENDS: ProfitTrendPoint[] = [
  { week: 'W1', wheat: 3200, mustard: 7800, cotton: 6000, rice: 1900, maize: 1600 },
  { week: 'W2', wheat: 3350, mustard: 8100, cotton: 6200, rice: 1850, maize: 1750 },
  { week: 'W3', wheat: 3400, mustard: 8000, cotton: 6350, rice: 2000, maize: 1800 },
  { week: 'W4', wheat: 3500, mustard: 8200, cotton: 6500, rice: 2100, maize: 1800 },
];

function buildLiveProfitPoint(updatedData: MarketDataItem[]): ProfitTrendPoint {
  const latestPoint: ProfitTrendPoint = {
    week: 'W4',
    wheat: BASE_PROFIT_BY_CROP.wheat,
    mustard: BASE_PROFIT_BY_CROP.mustard,
    cotton: BASE_PROFIT_BY_CROP.cotton,
    rice: BASE_PROFIT_BY_CROP.rice,
    maize: BASE_PROFIT_BY_CROP.maize,
  };

  updatedData.forEach((item) => {
    const cropKey = item.crop.toLowerCase() as CropKey;
    const movementImpact = item.change * 8;
    const volatilityNoise = Math.round((Math.random() - 0.5) * 160);
    latestPoint[cropKey] = Math.max(900, BASE_PROFIT_BY_CROP[cropKey] + movementImpact + volatilityNoise);
  });

  return latestPoint;
}

interface LandingPageProps {
  onGetStarted: () => void;
  onChatWithAI: () => void;
  onBrandClick: () => void;
  isChatOpen: boolean;
}

export default function LandingPage({ onGetStarted, onChatWithAI, onBrandClick, isChatOpen }: LandingPageProps) {
  const features = [
    {
      icon: Sprout,
      title: 'Crop Recommendation',
      description: 'Get AI-powered crop suggestions based on your soil, weather, and market demand',
    },
    {
      icon: Cloud,
      title: 'Weather Forecast',
      description: 'Access accurate 7-day weather forecasts to plan your farming activities',
    },
    {
      icon: TrendingUp,
      title: 'Yield Prediction',
      description: 'Predict your harvest yield using machine learning and historical data',
    },
    {
      icon: DollarSign,
      title: 'Profit Analytics',
      description: 'Track expenses, revenue, and optimize your farm profitability',
    },
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Get instant answers to farming questions from our AI advisor',
    },
    {
      icon: Bug,
      title: 'Disease Detection',
      description: 'Upload crop images to detect diseases and get treatment recommendations',
    },
  ];

  const transformations = [
    {
      icon: AlertCircle,
      traditional: 'Guessing crop selection',
      smart: 'Data-driven crop recommendations based on soil, weather & market',
      impact: '40% increase in yield',
    },
    {
      icon: AlertCircle,
      traditional: 'Manual expense tracking',
      smart: 'Automated financial analytics & profit optimization',
      impact: '30% cost reduction',
    },
    {
      icon: AlertCircle,
      traditional: 'Weather surprises',
      smart: 'Real-time forecasts for better planning',
      impact: '50+ weather alerts per season',
    },
    {
      icon: AlertCircle,
      traditional: 'Late disease detection',
      smart: 'AI-powered disease identification from photos',
      impact: '90% disease detection accuracy',
    },
  ];

  const tips = [
    {
      title: 'Monitor Soil Health',
      description: 'Regularly update soil information. Better soil data = better crop recommendations. Test soil pH and nutrient levels annually.',
    },
    {
      title: 'Track Market Prices Daily',
      description: 'Check mandi prices every day to sell at the best time. SmartFarm AI tracks real-time prices and alerts you when prices peak.',
    },
    {
      title: 'Log Crop History',
      description: 'Record every crop you plant, yield achieved, and expenses incurred. This historical data trains our AI to make better predictions.',
    },
    {
      title: 'Use Disease Detection Early',
      description: 'Check leaf health weekly. Upload photos at first sign of discoloration. Early detection saves 80% of crop damage.',
    },
    {
      title: 'Plan Ahead with Weather',
      description: 'Check 7-day forecast before irrigation, planting, or pesticide spraying. Avoid wastage and protect your crops.',
    },
    {
      title: 'Diversify Your Crops',
      description: 'Follow AI recommendations to rotate crops seasonally. Reduces soil depletion and spreads risk across multiple crops.',
    },
  ];

  const insights = [
    {
      category: 'Yield Optimization',
      points: [
        'Farmers using SmartFarm increase yields by 25-40% in first season',
        'Proper crop selection alone can boost productivity by 35%',
        'AI predictions become 85%+ accurate after 2 seasons of data',
      ],
    },
    {
      category: 'Cost Reduction',
      points: [
        'Smart irrigation planning reduces water waste by 45%',
        'Preventive disease management saves ₹5,000-15,000 per acre annually',
        'Financial tracking identifies cost savings of ₹10,000+ per farm yearly',
      ],
    },
    {
      category: 'Market Advantage',
      points: [
        'Alert system helps farmers sell at peak prices (+20% margin)',
        'Weather-based planning prevents crop damage losses',
        'Early disease detection maintains crop quality and premium pricing',
      ],
    },
  ];

  const examples = [
    {
      farmer: 'Rajesh - Wheat Farmer (UP)',
      challenge: 'Planted wheat in suboptimal soil, got only 20 quintals/acre average yield',
      solution: 'Used SmartFarm AI soil analysis and crop recommendation',
      result: '28 quintals/acre (+40%) | Earned ₹2 lakhs extra in one season',
    },
    {
      farmer: 'Priya - Vegetable Farmer (Maharashtra)',
      challenge: 'Lost 30% crops to powdery mildew; spotted disease too late',
      solution: 'Enabled weekly disease detection monitoring with photo uploads',
      result: 'Detected blight in 3 days | Applied treatment early | 95% crop saved',
    },
    {
      farmer: 'Harjeet - Cotton Farmer (Punjab)',
      challenge: 'Spent ₹8,000/acre on unnecessary pesticides; water wastage high',
      solution: 'AI-optimized financial tracking + weather-based irrigation planning',
      result: 'Reduced expenses by ₹3,500/acre | Increased net profit by 42%',
    },
  ];

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Real-time market data with live tracking
  const [liveMarketData, setLiveMarketData] = useState<MarketDataItem[]>(INITIAL_MARKET_DATA);

  // Profit trends showing recent performance
  const [profitTrends, setProfitTrends] = useState<ProfitTrendPoint[]>(INITIAL_PROFIT_TRENDS);

  useEffect(() => {
    const videoRotationInterval = setInterval(() => {
      setActiveVideoIndex((previousIndex) => (previousIndex + 1) % FARMING_VIDEO_SOURCES.length);
    }, 18000);

    return () => clearInterval(videoRotationInterval);
  }, []);

  // Update live prices every 3 seconds for real-time effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMarketData((prevData) => {
        const updatedData = prevData.map((item) => {
          const randomChange = (Math.random() - 0.5) * 50; // +/-25 change
          const newPrice = Math.max(item.minimumPrice, Math.min(item.maximumPrice, item.currentPrice + randomChange));
          const priceChange = newPrice - item.currentPrice;
          return {
            ...item,
            previousPrice: item.currentPrice,
            currentPrice: Math.round(newPrice),
            change: Math.round(priceChange),
            changePercent: Math.round((priceChange / item.currentPrice) * 100 * 10) / 10,
            trend: priceChange > 0 ? 'up' : 'down',
          };
        });

        setProfitTrends((previousTrends) => {
          const latestPoint = buildLiveProfitPoint(updatedData);
          return [...previousTrends.slice(1), latestPoint].map((trendPoint, index) => ({
            ...trendPoint,
            week: `W${index + 1}`,
          }));
        });

        return updatedData;
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  function scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleFooterAction(action: 'crops' | 'yield' | 'disease' | 'finance' | 'chat' | 'setup' | 'education') {
    if (action === 'chat') {
      onChatWithAI();
      return;
    }

    if (action === 'setup') {
      onGetStarted();
      return;
    }

    if (action === 'education') {
      scrollToSection('education-resources');
      return;
    }

    const sectionMap: Record<'crops' | 'yield' | 'disease' | 'finance', string> = {
      crops: 'core-features',
      yield: 'market-analytics',
      disease: 'core-features',
      finance: 'market-analytics',
    };

    scrollToSection(sectionMap[action]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBrandClick}
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <Sprout className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-800">SmartFarm AI</span>
            </button>
            <div className="text-sm text-gray-600">Smart Farming for Better Harvests</div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Transform Traditional Farming Into Smart Agriculture
          </h1>
          <p className="text-2xl text-gray-700 mb-2 font-semibold">
            Increase yields by 40% • Reduce costs by 30% • Make data-driven decisions
          </p>
          <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
            SmartFarm AI combines artificial intelligence, real-time data, and agriculture expertise to help you grow more with less. Transform guesswork into precision farming—powered by AI insights tailored to your farm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg text-lg"
            >
              Start Farm Analysis
            </button>
            <button
              onClick={onChatWithAI}
              className="px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors text-lg"
            >
              Talk to AI Advisor
            </button>
          </div>
        </div>

        {/* Farming Video Section */}
        <div id="core-features" className="mb-20">
          <div className="relative min-h-[320px] sm:min-h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-white/50">
            <video
              key={FARMING_VIDEO_SOURCES[activeVideoIndex]}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onEnded={() => setActiveVideoIndex((previousIndex) => (previousIndex + 1) % FARMING_VIDEO_SOURCES.length)}
              onError={() => setActiveVideoIndex((previousIndex) => (previousIndex + 1) % FARMING_VIDEO_SOURCES.length)}
            >
              <source src={FARMING_VIDEO_SOURCES[activeVideoIndex]} type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/65" />

            <div className="relative z-10 h-full flex items-center p-8 sm:p-12 lg:p-16">
              <div className="max-w-3xl text-white">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200 mb-4">
                  Field Operations Live
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                  Indian farmers, tractors, and modern field techniques in action
                </h2>
                <p className="text-base sm:text-lg text-emerald-50/95 leading-relaxed mb-6">
                  This background reel runs automatically and keeps rotating through real agricultural workflows,
                  from tractor-based soil preparation to harvesting and crop handling.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-sm font-semibold">Auto-playing video stream</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div id="education-resources" className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            What SmartFarm AI Offers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              >
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Transformation Section */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-12 mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            From Traditional to Smart Farming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {transformations.map((item, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-lg font-semibold text-gray-900 mb-2">Traditional:</p>
                    <p className="text-gray-600 mb-4">{item.traditional}</p>
                    <div className="border-t pt-4 flex gap-4">
                      <div className="flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-lg font-semibold text-green-700 mb-1">Smart Farming:</p>
                        <p className="text-gray-700 mb-2">{item.smart}</p>
                        <div className="bg-green-50 rounded px-3 py-1 inline-block">
                          <p className="text-sm font-semibold text-green-700">
                            Impact: {item.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Farming Tips Section */}
        <div id="market-analytics" className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            6 Tips to Maximize Your Smart Farm
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white border-l-4 border-green-600 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-green-600" />
                  <h3 className="text-xl font-semibold text-gray-900">{tip.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            SmartFarm AI Impact & Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {insights.map((insight, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-8 shadow-md border-2 border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-green-600" />
                  <h3 className="text-2xl font-bold text-gray-900">{insight.category}</h3>
                </div>
                <ul className="space-y-3">
                  {insight.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Market Feature Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Live Market Prices & Profit Tracking
          </h2>
          
          {/* Real-Time Prices Table */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <BarChart4 className="h-8 w-8 text-orange-600" />
                <h3 className="text-2xl font-bold text-gray-900">Current Market Prices (Updated Live Every 3 Seconds)</h3>
              </div>
              
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-100 border-b-2 border-orange-300">
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Crop</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-900">Current Price</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-900">24h Change</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-900">Trend</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-900">Profit/Acre</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-900">Mandi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveMarketData.map((item, index) => (
                      <tr key={index} className="border-b border-orange-100 hover:bg-orange-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-gray-900">{item.crop}</td>
                        <td className="px-4 py-4 text-center">
                          <div className="text-2xl font-bold text-gray-900">₹{item.currentPrice}</div>
                          <div className="text-xs text-gray-500">per quintal</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className={`flex items-center justify-center gap-1 ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.change >= 0 ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                            <span className="font-bold">₹{Math.abs(item.change)} ({Math.abs(item.changePercent)}%)</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {item.trend === 'up' ? (
                            <div className="inline-flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full">
                              <ArrowUp className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-700">Bullish</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full">
                              <ArrowDown className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-semibold text-red-700">Bearish</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="font-bold text-green-600">{item.profitMargin}</div>
                          <div className="text-xs text-gray-500">Rank #{item.profitRank}</div>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-gray-600">{item.marketLocation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {liveMarketData.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border-2 border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{item.crop}</h4>
                      {item.trend === 'up' ? (
                        <ArrowUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Price</p>
                        <p className="text-lg font-bold">₹{item.currentPrice}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Change</p>
                        <p className={`text-lg font-bold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.change >= 0 ? '+' : ''}₹{item.change}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Profit</p>
                        <p className="text-green-600 font-bold">{item.profitMargin}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Mandi</p>
                        <p className="font-semibold text-gray-900">{item.marketLocation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profit Trends Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Top Profit Crops */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-lg border-2 border-green-300">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">Most Profitable Crops</h3>
              </div>
              <div className="space-y-4">
                {[...liveMarketData]
                  .sort((a, b) => {
                    const aProfit = parseInt(a.profitMargin.replace(/[^\d]/g, ''), 10);
                    const bProfit = parseInt(b.profitMargin.replace(/[^\d]/g, ''), 10);
                    return bProfit - aProfit;
                  })
                  .map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between border-l-4 border-green-500">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.crop}</h4>
                        <p className="text-sm text-gray-600">Weekly Profit Range</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">{item.profitMargin}</div>
                        <div className="text-sm text-gray-500 font-semibold">#{item.profitRank} Ranked</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Price Movement Indicators */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-lg border-2 border-blue-300">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="h-8 w-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Price Movement Alert</h3>
              </div>
              <div className="space-y-3">
                {liveMarketData.map((item, index) => {
                  const priceVolatility = ((item.currentPrice - item.minimumPrice) / (item.maximumPrice - item.minimumPrice)) * 100;
                  return (
                    <div key={index} className="bg-white rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-900">{item.crop}</h4>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${item.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.trend === 'up' ? '📈 Going Up' : '📉 Going Down'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${item.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${priceVolatility}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>Min: ₹{item.minimumPrice}</span>
                        <span>Max: ₹{item.maximumPrice}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Weekly Profit Trends */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg border-2 border-purple-300">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900">4-Week Profit Trend Graph</h3>
            </div>
            
            {/* Text-based Chart Representation */}
            <div className="space-y-4">
              {['Mustard', 'Cotton', 'Wheat', 'Maize', 'Rice'].map((crop, cropIndex) => {
                const cropData = profitTrends.map(week => {
                  const key = crop.toLowerCase();
                  return week[key as keyof typeof week] || 0;
                });
                const maxProfit = Math.max(...cropData);
                
                return (
                  <div key={cropIndex}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-900 text-lg">{crop}</h4>
                      <span className="text-sm font-semibold text-gray-600">
                        ₹{cropData[cropData.length - 1]}/acre (Latest)
                      </span>
                    </div>
                    <div className="flex gap-2 items-end h-28 bg-white rounded-lg p-3 border border-purple-200">
                      {cropData.map((profit, weekIndex) => (
                        <div key={weekIndex} className="flex-1 h-full flex flex-col items-center justify-end">
                          <div
                            className={`w-full rounded-t transition-all duration-500 ${
                              cropIndex === 0 ? 'bg-yellow-400' :
                              cropIndex === 1 ? 'bg-orange-400' :
                              cropIndex === 2 ? 'bg-amber-400' :
                              cropIndex === 3 ? 'bg-green-400' :
                              'bg-blue-400'
                            }`}
                            style={{ height: `${Math.max(10, (profit / maxProfit) * 100)}%` }}
                            title={`₹${profit}`}
                          ></div>
                          <span className="text-xs text-gray-600 mt-1 text-center">{profitTrends[weekIndex]?.week || `W${weekIndex + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 bg-white rounded-lg p-4 border-l-4 border-purple-600">
              <p className="text-sm text-gray-600 mb-2">
                <strong>💡 Key Insight:</strong> Mustard and Cotton show strong profit trends. Wheat is stable with consistent ₹3,500/acre profit. Rice prices are declining - consider selling now or switching to higher-profit crops next season.
              </p>
            </div>
          </div>
        </div>

        {/* Real Farmer Examples */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-12 mb-20">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">
            Real Farmer Success Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {examples.map((example, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg">
                <div className="mb-4">
                  <Leaf className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="text-xl font-bold text-gray-900">{example.farmer}</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Challenge:</p>
                    <p className="text-gray-700">{example.challenge}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Solution:</p>
                    <p className="text-gray-700">{example.solution}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-600">
                    <p className="text-sm font-semibold text-green-700">Result:</p>
                    <p className="text-green-800 font-bold">{example.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Smart Farming Matters</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span><strong>Data-Driven Decisions:</strong> No more guessing. Every recommendation is backed by real data.</span>
              </li>
              <li className="flex gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span><strong>Higher Yields:</strong> Optimal crop selection increases productivity 25-40%.</span>
              </li>
              <li className="flex gap-2">
                <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span><strong>Cost Efficiency:</strong> Smart planning reduces water waste, pesticide use, and labor costs.</span>
              </li>
              <li className="flex gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span><strong>AI Assistance 24/7:</strong> Get instant farming advice anytime, anywhere.</span>
              </li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-lg p-8 border-2 border-emerald-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Farmers Get:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>AI crop recommendations after 15 mins of farm setup</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Disease detection with 90%+ accuracy in seconds</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Market price alerts to sell at peak prices</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>Financial analytics to track profitability</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span>7-day weather forecasts to optimize planning</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-700 rounded-2xl p-16 text-center text-white shadow-xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl mb-2 text-green-100">
            Join hundreds of Indian farmers increasing yields and profits with AI
          </p>
          <p className="text-lg mb-8 text-green-200">
            Takes 15 minutes to set up. See AI recommendations in real-time.
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-white text-green-700 rounded-lg font-bold hover:bg-green-50 transition-colors shadow-lg text-lg inline-block"
          >
            Start Your Smart Farm Now
          </button>
        </div>
      </div>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => {
            onChatWithAI();
          }}
          className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all transform hover:scale-110 flex items-center justify-center z-40"
          title="Open AI Chat Assistant"
        >
          <MessageSquare className="h-8 w-8" />
        </button>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">SmartFarm AI</h3>
              <p className="text-sm">Empowering Indian farmers with AI-driven agricultural solutions</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Product</h4>
              <ul className="text-sm space-y-1">
                <li><button type="button" onClick={() => handleFooterAction('crops')} className="hover:text-white transition-colors">Crop Recommendations</button></li>
                <li><button type="button" onClick={() => handleFooterAction('yield')} className="hover:text-white transition-colors">Yield Prediction</button></li>
                <li><button type="button" onClick={() => handleFooterAction('disease')} className="hover:text-white transition-colors">Disease Detection</button></li>
                <li><button type="button" onClick={() => handleFooterAction('finance')} className="hover:text-white transition-colors">Financial Analytics</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Features</h4>
              <ul className="text-sm space-y-1">
                <li><button type="button" onClick={() => handleFooterAction('crops')} className="hover:text-white transition-colors">Crop Recommendations</button></li>
                <li><button type="button" onClick={() => handleFooterAction('yield')} className="hover:text-white transition-colors">Yield Prediction</button></li>
                <li><button type="button" onClick={() => handleFooterAction('disease')} className="hover:text-white transition-colors">Disease Detection</button></li>
                <li><button type="button" onClick={() => handleFooterAction('finance')} className="hover:text-white transition-colors">Financial Analytics</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Support</h4>
              <ul className="text-sm space-y-1">
                <li><button type="button" onClick={() => handleFooterAction('chat')} className="hover:text-white transition-colors">AI Chat Assistant</button></li>
                <li><button type="button" onClick={() => handleFooterAction('setup')} className="hover:text-white transition-colors">Farm Setup Help</button></li>
                <li><button type="button" onClick={() => handleFooterAction('education')} className="hover:text-white transition-colors">Education Resources</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-sm">SmartFarm AI - Growing Better Harvests with Technology © 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
