import { useEffect, useState } from 'react';
import { Users, Sprout, MessageSquare, TrendingUp } from 'lucide-react';

export default function AdminPanel() {
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarms: 0,
    chatbotQueries: 0,
    recommendations: 0,
  });

  const [farmers, setFarmers] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) return;

      const [statsRes, farmersRes] = await Promise.all([
        fetch(`${apiUrl}/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/admin/farmers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalFarmers: statsData.totalFarmers || 0,
          activeFarms: statsData.activeFarms || 0,
          chatbotQueries: statsData.chatbotQueries || 0,
          recommendations: statsData.recommendations || 0,
        });
      }

      if (farmersRes.ok) {
        const farmersData = await farmersRes.json();
        setFarmers(farmersData || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Panel</h2>
        <p className="text-gray-600">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Farmers</p>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalFarmers}</p>
          <p className="text-xs text-gray-500 mt-1">Registered users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Farms</p>
            <Sprout className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeFarms}</p>
          <p className="text-xs text-gray-500 mt-1">Farm profiles</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">AI Chatbot Queries</p>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.chatbotQueries}</p>
          <p className="text-xs text-gray-500 mt-1">Total interactions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Recommendations</p>
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.recommendations}</p>
          <p className="text-xs text-gray-500 mt-1">Generated insights</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Registered Farmers</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Language</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((farmer) => (
                <tr key={farmer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{farmer.full_name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{farmer.phone || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{farmer.language_preference}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(farmer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Manage Crop Database
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Manage Soil Types
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Manage Disease Database
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              Send Notification to Farmers
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New farmer registered</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">45 chatbot queries today</p>
                <p className="text-xs text-gray-500">Updated just now</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <Sprout className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">12 crop recommendations generated</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
