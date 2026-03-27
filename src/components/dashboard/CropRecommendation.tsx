import { useEffect, useState } from 'react';
import { Farm, Crop } from '../../lib/supabase';
import { Sprout, TrendingUp, DollarSign, Droplets, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  farm: Farm | null;
}

interface Recommendation {
  crop: Crop;
  confidence: number;
  profitPotential: number;
  reasoning: string;
}

export default function CropRecommendation({ farm }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('Rabi');

  useEffect(() => {
    if (farm) {
      generateRecommendations();
    }
  }, [farm, selectedSeason]);

  async function generateRecommendations() {
    if (!farm) return;
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch crops for the selected season
      const cropsRes = await fetch(`${apiUrl}/crops/by-season/${selectedSeason}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!cropsRes.ok) {
        throw new Error('Failed to fetch crops');
      }

      const crops = await cropsRes.json();

      const filteredCrops = crops?.filter(crop =>
        crop.suitable_soil_types.includes(farm.soil_type || '')
      ) || [];

      const recommendations: Recommendation[] = filteredCrops.map(crop => {
        const baseConfidence = 70;
        const soilMatch = crop.suitable_soil_types.includes(farm.soil_type || '') ? 15 : 0;
        const irrigationMatch =
          (farm.irrigation_type === 'Drip' && crop.water_requirement === 'Low') ||
          (farm.irrigation_type === 'Canal' && crop.water_requirement === 'Medium') ||
          (farm.irrigation_type === 'Tube Well' && crop.water_requirement === 'High') ? 10 : 5;

        const confidence = Math.min(baseConfidence + soilMatch + irrigationMatch, 95);

        const costPerAcre = 15000;
        const revenue = crop.avg_yield_per_acre * crop.avg_market_price;
        const profitPotential = revenue - costPerAcre;

        let reasoning = `Suitable for ${farm.soil_type} soil. `;
        reasoning += `Average yield: ${crop.avg_yield_per_acre} quintals/acre. `;
        reasoning += `Current market price: ₹${crop.avg_market_price}/quintal. `;
        reasoning += `Growing duration: ${crop.growing_duration_days} days.`;

        return { crop, confidence, profitPotential, reasoning };
      });

      recommendations.sort((a, b) => b.confidence - a.confidence);
      setRecommendations(recommendations.slice(0, 6));

      if (user) {
        const topRec = recommendations[0];
        await fetch(`${apiUrl}/recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            farm_id: farm.id,
            recommended_crop: topRec.crop.crop_name,
            confidence_score: topRec.confidence,
            profit_potential: topRec.profitPotential,
            reasoning: topRec.reasoning,
            season: selectedSeason,
          }),
        });
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!farm) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">Please set up your farm profile to get crop recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Crop Recommendations</h2>
          <p className="text-gray-600">AI-powered suggestions based on your farm conditions</p>
        </div>
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="Rabi">Rabi Season</option>
          <option value="Kharif">Kharif Season</option>
          <option value="Zaid">Zaid Season</option>
          <option value="Year Round">Year Round</option>
        </select>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing farm conditions...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all hover:shadow-md ${
                  index === 0 ? 'border-green-500' : 'border-gray-100'
                }`}
              >
                {index === 0 && (
                  <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
                    BEST MATCH
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{rec.crop.crop_name}</h3>
                      {rec.crop.crop_name_hindi && (
                        <span className="text-lg text-gray-600">({rec.crop.crop_name_hindi})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Droplets className="h-4 w-4 mr-1" />
                        {rec.crop.water_requirement} Water
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {rec.crop.growing_duration_days} days
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="bg-green-100 px-4 py-2 rounded-lg mb-2">
                      <p className="text-sm text-green-700 font-medium">AI Confidence</p>
                      <p className="text-2xl font-bold text-green-800">{rec.confidence}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-sm">Expected Yield</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {rec.crop.avg_yield_per_acre} Q/acre
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-sm">Market Price</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{rec.crop.avg_market_price}/Q
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-sm">Profit Potential</span>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      ₹{Math.round(rec.profitPotential).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Why this crop?</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{rec.reasoning}</p>
                </div>

                <div className="mt-4 flex gap-3">
                  <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                    Select This Crop
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    More Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Sprout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No crop recommendations available for {selectedSeason} season with your soil type.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
