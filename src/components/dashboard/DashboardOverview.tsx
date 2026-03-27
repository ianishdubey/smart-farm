import { useEffect, useState } from 'react';
import { Farm } from '../../lib/supabase';
import { Cloud, Sprout, TrendingUp, DollarSign, MapPin, Droplets, Activity } from 'lucide-react';

interface Props {
  farm: Farm | null;
  onNavigate?: (tab: string) => void;
}

export default function DashboardOverview({ farm, onNavigate }: Props) {
  const [stats, setStats] = useState({
    currentCrop: 'Wheat',
    temperature: 24,
    expectedYield: 22,
    profitThisSeason: 125000,
    soilHealth: 'Good',
    insights: 3,
  });

  const aiInsights = [
    { insight_text: 'Optimal sowing time for Wheat is approaching. Weather conditions are favorable.', priority: 'high', created_at: new Date().toISOString() },
    { insight_text: 'Your soil nitrogen levels may be low. Consider applying fertilizer before next season.', priority: 'medium', created_at: new Date().toISOString() },
    { insight_text: 'Market prices for Mustard are 15% higher than last year. Consider allocation.', priority: 'medium', created_at: new Date().toISOString() },
  ];

  const summaryCards = [
    { label: 'Current Crop', value: stats.currentCrop, icon: Sprout, color: 'green' },
    { label: 'Weather Today', value: `${stats.temperature}°C`, icon: Cloud, color: 'blue' },
    { label: 'Expected Yield', value: `${stats.expectedYield} Q/acre`, icon: TrendingUp, color: 'indigo' },
    { label: 'Profit This Season', value: `₹${stats.profitThisSeason.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
    { label: 'Soil Health', value: stats.soilHealth, icon: Activity, color: 'amber' },
    { label: 'AI Insights', value: `${aiInsights.length} New`, icon: Activity, color: 'purple' },
  ];

  if (!farm) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">No farm profile found. Please create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening with your farm today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className={`bg-${card.color}-100 p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 text-${card.color}-600`} />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Farm Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Location:</span>
              <span className="ml-2 font-medium text-gray-900">{farm.location_name}</span>
            </div>
            <div className="flex items-center text-sm">
              <Sprout className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Farm Size:</span>
              <span className="ml-2 font-medium text-gray-900">{farm.farm_size} acres</span>
            </div>
            <div className="flex items-center text-sm">
              <Droplets className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Irrigation:</span>
              <span className="ml-2 font-medium text-gray-900">{farm.irrigation_type}</span>
            </div>
            <div className="flex items-center text-sm">
              <Activity className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Soil Type:</span>
              <span className="ml-2 font-medium text-gray-900">{farm.soil_type || 'Unknown'}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="mb-1">Coordinates:</p>
              <p className="font-mono text-xs text-gray-500">
                {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 text-green-600 mr-2" />
            AI Insights
          </h3>
          <div className="space-y-3">
            {aiInsights.length === 0 ? (
              <p className="text-sm text-gray-500">No insights available yet.</p>
            ) : (
              aiInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.priority === 'high'
                      ? 'bg-red-50 border-red-200'
                      : insight.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <p className="text-sm text-gray-800">{insight.insight_text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-xl font-semibold mb-2">Quick Actions</h3>
        <p className="text-green-100 mb-4">Get started with AI-powered recommendations</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate && onNavigate('crops')}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all px-4 py-3 rounded-lg text-left space-y-2"
          >
            <Sprout className="h-5 w-5 mb-1" />
            <p className="font-medium text-sm">Get Crop Recommendations</p>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('yield')}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all px-4 py-3 rounded-lg text-left space-y-2"
          >
            <TrendingUp className="h-5 w-5 mb-1" />
            <p className="font-medium text-sm">Predict Yield</p>
          </button>
          <button
            onClick={() => onNavigate && onNavigate('weather')}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 transition-all px-4 py-3 rounded-lg text-left space-y-2"
          >
            <Cloud className="h-5 w-5 mb-1" />
            <p className="font-medium text-sm">Check Weather</p>
          </button>
        </div>
      </div>
    </div>
  );
}
