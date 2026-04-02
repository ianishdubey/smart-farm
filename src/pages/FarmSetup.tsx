import { useState } from 'react';
import { MapPin, Droplets, Sprout } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FarmSetupProps {
  onComplete: () => void;
  onBrandClick: () => void;
}

export default function FarmSetup({ onComplete, onBrandClick }: FarmSetupProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    farmName: '',
    locationName: '',
    latitude: 30.7333,
    longitude: 76.7794,
    farmSize: '',
    irrigationType: 'Canal',
    soilType: '',
    soilColor: '',
    waterRetention: 'Good',
    pastCrops: ['', '', ''],
    pastYields: ['', '', ''],
  });

  const irrigationTypes = ['Canal', 'Drip', 'Sprinkler', 'Rainfed', 'Tube Well'];
  const soilTypes = ['Loamy', 'Clay', 'Sandy Loam', 'Black Soil', 'Alluvial', 'Red Soil'];
  const soilColors = ['Dark Brown', 'Light Brown', 'Black', 'Red', 'Yellow'];
  const waterRetentions = ['Low', 'Medium', 'Good', 'High'];

  function estimateSoilType() {
    const { soilColor, waterRetention, pastCrops } = formData;

    if (soilColor === 'Black' || pastCrops.includes('Cotton')) {
      return 'Black Soil';
    }
    if (waterRetention === 'High' && pastCrops.includes('Rice')) {
      return 'Clay';
    }
    if (waterRetention === 'Low' || waterRetention === 'Medium') {
      return 'Sandy Loam';
    }
    if (pastCrops.some(crop => ['Wheat', 'Maize'].includes(crop))) {
      return 'Loamy';
    }
    return 'Alluvial';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const estimatedSoil = formData.soilType || estimateSoilType();

      // Create farm
      const farmResponse = await fetch(`${apiUrl}/farms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          farm_name: formData.farmName,
          location_name: formData.locationName,
          latitude: formData.latitude,
          longitude: formData.longitude,
          farm_size: parseFloat(formData.farmSize),
          irrigation_type: formData.irrigationType,
          soil_type: estimatedSoil,
        }),
      });

      if (!farmResponse.ok) {
        throw new Error('Failed to create farm');
      }

      const farmData = await farmResponse.json();

      // Add farm history if in step 2
      if (farmData && step === 2) {
        const historyRecords = formData.pastCrops
          .map((crop, index) => ({
            farm_id: farmData.id,
            year: new Date().getFullYear() - (index + 1),
            crop_grown: crop,
            yield_achieved: parseFloat(formData.pastYields[index]) || 0,
            soil_color: formData.soilColor,
            water_retention_observed: formData.waterRetention,
          }))
          .filter(record => record.crop_grown);

        if (historyRecords.length > 0) {
          const historyResponse = await fetch(`${apiUrl}/farm-history/batch`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              farm_id: farmData.id,
              records: historyRecords,
            }),
          });

          if (!historyResponse.ok) {
            throw new Error('Failed to save farm history');
          }
        }
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Error creating farm profile');
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          setError('Could not get your location. Please enter manually.');
        }
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBrandClick}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Sprout className="h-7 w-7 text-green-600" />
            <span className="text-2xl font-bold text-green-800">SmartFarm AI</span>
          </button>
          <button
            type="button"
            onClick={onBrandClick}
            className="text-sm font-semibold text-green-700 hover:text-green-900"
          >
            Home
          </button>
        </div>
      </nav>

      <div className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-emerald-100">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Farm Profile Setup</h2>
            <p className="text-gray-600">
              {step === 1 ? 'Step 1: Basic Farm Information' : 'Step 2: Soil Type Estimation (Optional)'}
            </p>
            <div className="mt-4 flex gap-2">
              <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-green-600' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={formData.farmName}
                    onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Green Valley Farm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Ludhiana, Punjab"
                      required
                    />
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Use GPS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farm Size (acres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.farmSize}
                    onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., 10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Droplets className="inline h-4 w-4 mr-1" />
                    Irrigation Type
                  </label>
                  <select
                    value={formData.irrigationType}
                    onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {irrigationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soil Type (if known)
                  </label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Unknown - Estimate from history</option>
                    {soilTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  {!formData.soilType && (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-green-100 text-green-700 py-3 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                    >
                      Help Me Estimate Soil Type
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : formData.soilType ? 'Create Farm Profile' : 'Skip & Create Profile'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-green-800">
                    Answer these questions to help us estimate your soil type based on historical data.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soil Color
                  </label>
                  <select
                    value={formData.soilColor}
                    onChange={(e) => setFormData({ ...formData, soilColor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select soil color</option>
                    {soilColors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Water Retention
                  </label>
                  <select
                    value={formData.waterRetention}
                    onChange={(e) => setFormData({ ...formData, waterRetention: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    {waterRetentions.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crops Grown in Last 3 Years
                  </label>
                  {formData.pastCrops.map((crop, index) => (
                    <div key={index} className="mb-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={crop}
                          onChange={(e) => {
                            const newCrops = [...formData.pastCrops];
                            newCrops[index] = e.target.value;
                            setFormData({ ...formData, pastCrops: newCrops });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder={`Crop ${index + 1}`}
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={formData.pastYields[index]}
                          onChange={(e) => {
                            const newYields = [...formData.pastYields];
                            newYields[index] = e.target.value;
                            setFormData({ ...formData, pastYields: newYields });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Yield (quintals/acre)"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    Estimated Soil Type: {estimateSoilType()}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Farm Profile'}
                  </button>
                </div>
              </>
            )}
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
