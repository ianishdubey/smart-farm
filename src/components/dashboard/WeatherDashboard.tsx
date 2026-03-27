import { useEffect, useState } from 'react';
import { Farm } from '../../lib/supabase';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle } from 'lucide-react';

interface Props {
  farm: Farm | null;
}

interface WeatherData {
  date: string;
  temperature: number;
  humidity: number;
  rainProbability: number;
  windSpeed: number;
  condition: string;
}

export default function WeatherDashboard({ farm }: Props) {
  const [currentWeather, setCurrentWeather] = useState<WeatherData>({
    date: new Date().toISOString().split('T')[0],
    temperature: 24,
    humidity: 65,
    rainProbability: 20,
    windSpeed: 12,
    condition: 'Partly Cloudy',
  });

  const [forecast, setForecast] = useState<WeatherData[]>([
    { date: 'Mon', temperature: 24, humidity: 65, rainProbability: 20, windSpeed: 12, condition: 'Sunny' },
    { date: 'Tue', temperature: 26, humidity: 70, rainProbability: 40, windSpeed: 15, condition: 'Cloudy' },
    { date: 'Wed', temperature: 23, humidity: 80, rainProbability: 70, windSpeed: 18, condition: 'Rainy' },
    { date: 'Thu', temperature: 22, humidity: 75, rainProbability: 60, windSpeed: 14, condition: 'Rainy' },
    { date: 'Fri', temperature: 25, humidity: 60, rainProbability: 30, windSpeed: 10, condition: 'Partly Cloudy' },
    { date: 'Sat', temperature: 27, humidity: 55, rainProbability: 10, windSpeed: 8, condition: 'Sunny' },
    { date: 'Sun', temperature: 28, humidity: 50, rainProbability: 5, windSpeed: 6, condition: 'Sunny' },
  ]);

  const aiWeatherInsight = 'Rain expected in 2 days. Avoid irrigation today and tomorrow. Good conditions for applying fertilizer after rainfall.';

  if (!farm) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-600">Please set up your farm profile to view weather data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Weather Dashboard</h2>
          <p className="text-gray-600">Real-time weather data for {farm.location_name}</p>
        </div>
        <div className="bg-gray-100 px-3 py-2 rounded-lg text-xs text-gray-600">
          📊 <strong>Data Source:</strong> Sample Data (Real-time API integration coming soon)
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-blue-100 mb-1">Current Weather</p>
            <p className="text-3xl font-bold">{currentWeather.temperature}°C</p>
            <p className="text-blue-100 mt-1">{currentWeather.condition}</p>
          </div>
          <Sun className="h-20 w-20 text-yellow-300" />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-blue-400">
          <div>
            <div className="flex items-center mb-1">
              <Droplets className="h-4 w-4 mr-1" />
              <span className="text-sm text-blue-100">Humidity</span>
            </div>
            <p className="text-xl font-semibold">{currentWeather.humidity}%</p>
          </div>
          <div>
            <div className="flex items-center mb-1">
              <CloudRain className="h-4 w-4 mr-1" />
              <span className="text-sm text-blue-100">Rain</span>
            </div>
            <p className="text-xl font-semibold">{currentWeather.rainProbability}%</p>
          </div>
          <div>
            <div className="flex items-center mb-1">
              <Wind className="h-4 w-4 mr-1" />
              <span className="text-sm text-blue-100">Wind</span>
            </div>
            <p className="text-xl font-semibold">{currentWeather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900 mb-1">AI Weather Insight</p>
            <p className="text-sm text-yellow-800">{aiWeatherInsight}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Forecast</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {forecast.map((day, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 mb-2">{day.date}</p>
              {day.condition === 'Sunny' ? (
                <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              ) : day.condition === 'Rainy' ? (
                <CloudRain className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              ) : (
                <Cloud className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-lg font-bold text-gray-900 mb-1">{day.temperature}°C</p>
              <p className="text-xs text-gray-600">Rain: {day.rainProbability}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Farming Days</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Friday - Sunday</p>
                <p className="text-sm text-gray-600">Ideal for irrigation and spraying</p>
              </div>
              <Sun className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Wednesday - Thursday</p>
                <p className="text-sm text-gray-600">Expected rainfall - good for sowing</p>
              </div>
              <CloudRain className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <Droplets className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Irrigation Schedule</p>
                <p className="text-xs text-gray-600">Skip irrigation for 2 days due to expected rain</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Cloud className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Pest Control</p>
                <p className="text-xs text-gray-600">Apply pesticide on Friday when weather is clear</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <Wind className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Wind Advisory</p>
                <p className="text-xs text-gray-600">Moderate winds expected - avoid aerial spraying</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
