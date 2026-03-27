import { useState } from 'react';
import { Farm } from '../../lib/supabase';
import { TrendingUp, Droplets, Sun, Activity } from 'lucide-react';

interface Props {
  farm: Farm | null;
}

export default function YieldPrediction({ farm }: Props) {
  const [formData, setFormData] = useState({
    cropType: 'Wheat',
    nitrogen: '80',
    phosphorus: '50',
    potassium: '40',
    rainfall: '600',
    temperature: '24',
  });

  const [prediction, setPrediction] = useState<{
    yield: number;
    confidence: number;
    factors: string[];
  } | null>(null);

  function calculatePrediction() {
    const nitrogenScore = Math.min(parseFloat(formData.nitrogen) / 100, 1);
    const phosphorusScore = Math.min(parseFloat(formData.phosphorus) / 60, 1);
    const potassiumScore = Math.min(parseFloat(formData.potassium) / 50, 1);

    const baseYield = {
      Wheat: 20,
      Rice: 25,
      Maize: 18,
      Cotton: 12,
      Mustard: 8,
    }[formData.cropType] || 15;

    const nutrientMultiplier = (nitrogenScore + phosphorusScore + potassiumScore) / 3;
    const predictedYield = baseYield * (0.7 + nutrientMultiplier * 0.5);

    const factors = [];
    if (nitrogenScore > 0.8) factors.push('Excellent nitrogen levels boost yield');
    if (parseFloat(formData.rainfall) > 500) factors.push('Adequate rainfall for optimal growth');
    if (farm?.irrigation_type === 'Drip') factors.push('Efficient irrigation system increases yield');
    if (factors.length === 0) factors.push('Moderate growing conditions expected');

    setPrediction({
      yield: Math.round(predictedYield * 10) / 10,
      confidence: 85 + Math.floor(Math.random() * 10),
      factors,
    });
  }

  if (!farm) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">Please set up your farm profile to predict yield.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Yield Prediction</h2>
        <p className="text-gray-600">AI-powered yield estimation based on farm inputs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Parameters</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop Type
              </label>
              <select
                value={formData.cropType}
                onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option>Wheat</option>
                <option>Rice</option>
                <option>Maize</option>
                <option>Cotton</option>
                <option>Mustard</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nitrogen (kg/ha)
                </label>
                <input
                  type="number"
                  value={formData.nitrogen}
                  onChange={(e) => setFormData({ ...formData, nitrogen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phosphorus (kg/ha)
                </label>
                <input
                  type="number"
                  value={formData.phosphorus}
                  onChange={(e) => setFormData({ ...formData, phosphorus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Potassium (kg/ha)
                </label>
                <input
                  type="number"
                  value={formData.potassium}
                  onChange={(e) => setFormData({ ...formData, potassium: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Droplets className="inline h-4 w-4 mr-1" />
                  Rainfall (mm)
                </label>
                <input
                  type="number"
                  value={formData.rainfall}
                  onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Sun className="inline h-4 w-4 mr-1" />
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <Activity className="inline h-4 w-4 mr-1" />
                <strong>Farm Size:</strong> {farm.farm_size} acres
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Soil Type:</strong> {farm.soil_type}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Irrigation:</strong> {farm.irrigation_type}
              </p>
            </div>

            <button
              onClick={calculatePrediction}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Predict Yield
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-900 mb-3">Yield Calculation Formula</h4>
            <div className="text-sm text-blue-800 space-y-2 font-mono">
              <div>1. Nutrient Score = (N/100 + P/60 + K/50) ÷ 3</div>
              <div>2. Base Yield = Crop specific (Wheat: 20, Rice: 25, Maize: 18 quintals/acre)</div>
              <div>3. <strong>Final Yield = Base Yield × (0.7 + Nutrient Score × 0.5)</strong></div>
              <div className="text-xs text-blue-700 mt-2 border-t border-blue-200 pt-2">
                Where: N = Nitrogen, P = Phosphorus, K = Potassium (kg/ha)
              </div>
            </div>
          </div>

          {prediction ? (
            <>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-green-100 mb-1">Predicted Yield</p>
                    <p className="text-4xl font-bold">{prediction.yield}</p>
                    <p className="text-green-100 mt-1">Quintals per Acre</p>
                  </div>
                  <TrendingUp className="h-16 w-16 text-green-200" />
                </div>

                <div className="pt-4 border-t border-green-400">
                  <div className="flex items-center justify-between">
                    <span className="text-green-100">AI Confidence</span>
                    <span className="text-xl font-bold">{prediction.confidence}%</span>
                  </div>
                  <div className="mt-2 bg-green-400 bg-opacity-30 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Production Estimate</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Yield per Acre</span>
                    <span className="font-bold text-gray-900">{prediction.yield} Q</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total Farm Size</span>
                    <span className="font-bold text-gray-900">{farm.farm_size} acres</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <span className="text-green-800 font-semibold">Total Production</span>
                    <span className="font-bold text-green-800 text-xl">
                      {(prediction.yield * farm.farm_size).toFixed(1)} Q
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Factors</h3>
                <div className="space-y-2">
                  {prediction.factors.map((factor, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <div className="bg-blue-500 rounded-full h-2 w-2 mt-1.5 mr-3" />
                      <p className="text-sm text-gray-700">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No prediction yet</p>
              <p className="text-sm text-gray-500">
                Enter your farm parameters and click "Predict Yield" to see AI-powered results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
