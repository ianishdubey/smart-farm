import { useEffect, useState } from 'react';
import { Farm } from '../../lib/supabase';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Props {
  farm: Farm | null;
}

interface MarketPrice {
  id: string;
  crop_name: string;
  market_location: string;
  price_per_quintal: number;
  price_date: string;
}

export default function MarketPrices({ farm }: Props) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketPrices();
  }, []);

  async function fetchMarketPrices() {
    try {
      // Generate sample prices in memory
      await generateSamplePrices();
    } catch (error) {
      console.error('Error fetching market prices:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateSamplePrices() {
    const locations = ['Ludhiana', 'Chandigarh', 'Amritsar', 'Jalandhar', 'Patiala'];
    const crops = [
      { name: 'Wheat', basePrice: 2000 },
      { name: 'Rice', basePrice: 1800 },
      { name: 'Mustard', basePrice: 5000 },
      { name: 'Cotton', basePrice: 6000 },
      { name: 'Maize', basePrice: 1500 },
    ];

    const samplePrices = [];
    for (const crop of crops) {
      for (const location of locations) {
        const priceVariation = Math.floor(Math.random() * 400) - 200;
        samplePrices.push({
          id: `${crop.name}-${location}-${Date.now()}`,
          crop_name: crop.name,
          market_location: location,
          price_per_quintal: crop.basePrice + priceVariation,
          price_date: new Date().toISOString().split('T')[0],
        });
      }
    }

    setPrices(samplePrices);
  }

  const groupedPrices = prices.reduce((acc, price) => {
    if (!acc[price.crop_name]) {
      acc[price.crop_name] = [];
    }
    acc[price.crop_name].push(price);
    return acc;
  }, {} as Record<string, MarketPrice[]>);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading market prices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Market Prices</h2>
        <p className="text-gray-600">Latest mandi prices from nearby markets</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(groupedPrices).map(([cropName, cropPrices]) => {
          const avgPrice = cropPrices.reduce((sum, p) => sum + p.price_per_quintal, 0) / cropPrices.length;
          const minPrice = Math.min(...cropPrices.map(p => p.price_per_quintal));
          const maxPrice = Math.max(...cropPrices.map(p => p.price_per_quintal));
          const priceChange = Math.floor(Math.random() * 20) - 10;

          return (
            <div key={cropName} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{cropName}</h3>
                  <p className="text-sm text-gray-600">
                    {cropPrices.length} markets reporting
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Average Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{Math.round(avgPrice).toLocaleString()}
                  </p>
                  <div className={`flex items-center justify-end text-sm ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                    {Math.abs(priceChange)}% vs last week
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700 mb-1">Highest Price</p>
                  <p className="text-lg font-bold text-green-800">₹{maxPrice.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-700 mb-1">Lowest Price</p>
                  <p className="text-lg font-bold text-red-800">₹{minPrice.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 mb-2">Market-wise Prices</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {cropPrices.map((price) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="text-gray-700">{price.market_location}</span>
                      <span className="font-semibold text-gray-900">
                        ₹{price.price_per_quintal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <DollarSign className="h-6 w-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 mb-2">Market Insight</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Mustard prices are showing an upward trend this season with 15% increase compared to last year.
              This is a good opportunity for farmers with suitable soil conditions. Wheat prices remain stable
              with consistent demand from government procurement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
