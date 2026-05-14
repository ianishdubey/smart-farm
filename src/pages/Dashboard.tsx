import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Farm } from '../lib/supabase';
import {
  LayoutDashboard,
  Cloud,
  Sprout,
  TrendingUp,
  DollarSign,
  BarChart3,
  MessageSquare,
  Bug,
  Bell,
  LogOut,
  Settings,
  Users,
  X,
  MapPin,
} from 'lucide-react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import WeatherDashboard from '../components/dashboard/WeatherDashboard';
import CropRecommendation from '../components/dashboard/CropRecommendation';
import YieldPrediction from '../components/dashboard/YieldPrediction';
import FinancialAnalytics from '../components/dashboard/FinancialAnalytics';
import MarketPrices from '../components/dashboard/MarketPrices';
import DiseaseDetection from '../components/dashboard/DiseaseDetection';
import AdminPanel from '../components/dashboard/AdminPanel';
import ChatBot from '../components/ChatBot';

type Tab = 'overview' | 'weather' | 'crops' | 'yield' | 'finance' | 'market' | 'disease' | 'admin';

interface DashboardProps {
  onBrandClick: () => void;
}

const VALID_TABS: Tab[] = ['overview', 'weather', 'crops', 'yield', 'finance', 'market', 'disease', 'admin'];
const IRRIGATION_TYPES = ['Canal', 'Drip', 'Sprinkler', 'Rainfed', 'Tube Well'];
const SOIL_TYPES = ['Loamy', 'Clay', 'Sandy Loam', 'Black Soil', 'Alluvial', 'Red Soil'];

function getTabFromUrl(): Tab {
  const searchParams = new URLSearchParams(window.location.search);
  const tab = searchParams.get('tab');
  if (tab && VALID_TABS.includes(tab as Tab)) {
    return tab as Tab;
  }
  return 'overview';
}

export default function Dashboard({ onBrandClick }: DashboardProps) {
  const { user, farmer, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(() => getTabFromUrl());
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    language_preference: 'en',
  });
  const [farmProfileForm, setFarmProfileForm] = useState({
    farm_name: '',
    location_name: '',
    latitude: '',
    longitude: '',
    farm_size: '',
    irrigation_type: 'Canal',
    soil_type: '',
  });

  useEffect(() => {
    if (user) {
      fetchFarm();
    }
  }, [user]);

  useEffect(() => {
    const currentTab = getTabFromUrl();
    setActiveTab(currentTab);

    if (window.location.pathname === '/dashboard') {
      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.get('tab')) {
        window.history.replaceState({}, '', '/dashboard?tab=overview');
      }
    }

    const handlePopState = () => {
      if (window.location.pathname === '/dashboard') {
        setActiveTab(getTabFromUrl());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeTab === 'admin' && farmer?.role !== 'admin') {
      setActiveTab('overview');
      if (window.location.pathname === '/dashboard') {
        window.history.replaceState({}, '', '/dashboard?tab=overview');
      }
    }
  }, [activeTab, farmer?.role]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (window.location.pathname === '/dashboard') {
      window.history.pushState({}, '', `/dashboard?tab=${tab}`);
    }
  }

  async function fetchFarm() {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/farms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFarm(data);
      } else {
        console.error('Failed to fetch farm');
      }
    } catch (error) {
      console.error('Error fetching farm:', error);
    } finally {
      setLoading(false);
    }
  }

  function openProfileEditor() {
    setProfileForm({
      full_name: farmer?.full_name || '',
      phone: farmer?.phone || '',
      language_preference: farmer?.language_preference || 'en',
    });
    setFarmProfileForm({
      farm_name: farm?.farm_name || '',
      location_name: farm?.location_name || '',
      latitude: farm?.latitude !== undefined && farm?.latitude !== null ? String(farm.latitude) : '',
      longitude: farm?.longitude !== undefined && farm?.longitude !== null ? String(farm.longitude) : '',
      farm_size: farm?.farm_size !== undefined && farm?.farm_size !== null ? String(farm.farm_size) : '',
      irrigation_type: farm?.irrigation_type || 'Canal',
      soil_type: farm?.soil_type || '',
    });
    setProfileError('');
    setProfileSuccess('');
    setShowProfileEditor(true);
  }

  function captureCurrentLocation() {
    if (!navigator.geolocation) {
      setProfileError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFarmProfileForm((previous) => ({
          ...previous,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => {
        setProfileError('Could not fetch current location. Please enter coordinates manually.');
      }
    );
  }

  async function handleProfileUpdate(event: React.FormEvent) {
    event.preventDefault();

    const normalizedFullName = profileForm.full_name.trim();
    if (!normalizedFullName) {
      setProfileError('Full name is required.');
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError('');
      setProfileSuccess('');

      await updateProfile({
        full_name: normalizedFullName,
        phone: profileForm.phone.trim() || null,
        language_preference: profileForm.language_preference,
      });

      if (farm) {
        const normalizedFarmName = farmProfileForm.farm_name.trim();
        const normalizedLocationName = farmProfileForm.location_name.trim();
        const parsedLatitude = Number.parseFloat(farmProfileForm.latitude);
        const parsedLongitude = Number.parseFloat(farmProfileForm.longitude);
        const parsedFarmSize = Number.parseFloat(farmProfileForm.farm_size);

        if (!normalizedFarmName) {
          setProfileError('Farm name is required.');
          return;
        }

        if (!normalizedLocationName) {
          setProfileError('Location name is required.');
          return;
        }

        if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
          setProfileError('Latitude must be between -90 and 90.');
          return;
        }

        if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
          setProfileError('Longitude must be between -180 and 180.');
          return;
        }

        if (!Number.isFinite(parsedFarmSize) || parsedFarmSize <= 0) {
          setProfileError('Farm size must be greater than 0.');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const token = localStorage.getItem('auth_token');

        if (!token) {
          setProfileError('Not authenticated');
          return;
        }

        const farmResponse = await fetch(`${apiUrl}/farms/${farm.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            farm_name: normalizedFarmName,
            location_name: normalizedLocationName,
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            farm_size: parsedFarmSize,
            irrigation_type: farmProfileForm.irrigation_type,
            soil_type: farmProfileForm.soil_type || null,
            boundary_coordinates: farm.boundary_coordinates,
          }),
        });

        if (!farmResponse.ok) {
          let message = 'Failed to update farm profile.';
          try {
            const errorData = await farmResponse.json();
            if (errorData?.error) {
              message = errorData.error;
            }
          } catch {
            // Ignore JSON parsing errors for non-JSON responses.
          }
          throw new Error(message);
        }

        const updatedFarm = await farmResponse.json();
        setFarm(updatedFarm);
      }

      setProfileSuccess('Profile updated successfully.');
    } catch (error: any) {
      setProfileError(error?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  const navigation = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'weather', name: 'Weather', icon: Cloud },
    { id: 'crops', name: 'Crop Recommendation', icon: Sprout },
    { id: 'yield', name: 'Yield Prediction', icon: TrendingUp },
    { id: 'finance', name: 'Financial Analytics', icon: DollarSign },
    { id: 'market', name: 'Market Prices', icon: BarChart3 },
    { id: 'disease', name: 'Disease Detection', icon: Bug },
    ...(farmer?.role === 'admin' ? [{ id: 'admin', name: 'Admin Panel', icon: Users }] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your farm data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onBrandClick}
                className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
              >
                <div className="bg-green-600 p-2 rounded-lg">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-900">SmartFarm AI</h1>
                  <p className="text-xs text-gray-500">{farm?.farm_name || 'No Farm'}</p>
                </div>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{farmer?.full_name || 'Farmer'}</p>
                {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
              </div>
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={openProfileEditor}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Edit Profile"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as Tab)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </aside>

          <main className="flex-1">
            {activeTab === 'overview' && <DashboardOverview farm={farm} onNavigate={(tab) => handleTabChange(tab as Tab)} />}
            {activeTab === 'weather' && <WeatherDashboard farm={farm} />}
            {activeTab === 'crops' && <CropRecommendation farm={farm} />}
            {activeTab === 'yield' && <YieldPrediction farm={farm} />}
            {activeTab === 'finance' && <FinancialAnalytics farm={farm} />}
            {activeTab === 'market' && <MarketPrices farm={farm} />}
            {activeTab === 'disease' && <DiseaseDetection farm={farm} />}
            {activeTab === 'admin' && farmer?.role === 'admin' && <AdminPanel />}
          </main>
        </div>
      </div>

      {showProfileEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <p className="text-sm text-gray-500">Update personal and farm details anytime</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowProfileEditor(false);
                  setProfileError('');
                  setProfileSuccess('');
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="px-6 py-5 space-y-4">
              {profileError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                  {profileSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(event) =>
                    setProfileForm((previous) => ({ ...previous, full_name: event.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((previous) => ({ ...previous, phone: event.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                <select
                  value={profileForm.language_preference}
                  onChange={(event) =>
                    setProfileForm((previous) => ({
                      ...previous,
                      language_preference: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="pa">Punjabi</option>
                </select>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Farm Profile</h4>

                {!farm ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                    Farm profile was not found. Please complete farm setup first.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
                      <input
                        type="text"
                        value={farmProfileForm.farm_name}
                        onChange={(event) =>
                          setFarmProfileForm((previous) => ({
                            ...previous,
                            farm_name: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter farm name"
                        required={!!farm}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                      <input
                        type="text"
                        value={farmProfileForm.location_name}
                        onChange={(event) =>
                          setFarmProfileForm((previous) => ({
                            ...previous,
                            location_name: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Ludhiana, Punjab"
                        required={!!farm}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={farmProfileForm.latitude}
                          onChange={(event) =>
                            setFarmProfileForm((previous) => ({
                              ...previous,
                              latitude: event.target.value,
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required={!!farm}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={farmProfileForm.longitude}
                          onChange={(event) =>
                            setFarmProfileForm((previous) => ({
                              ...previous,
                              longitude: event.target.value,
                            }))
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required={!!farm}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={captureCurrentLocation}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Use Current Location
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Farm Size (acres)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={farmProfileForm.farm_size}
                        onChange={(event) =>
                          setFarmProfileForm((previous) => ({
                            ...previous,
                            farm_size: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required={!!farm}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Irrigation Type</label>
                      <select
                        value={farmProfileForm.irrigation_type}
                        onChange={(event) =>
                          setFarmProfileForm((previous) => ({
                            ...previous,
                            irrigation_type: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {IRRIGATION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type</label>
                      <select
                        value={farmProfileForm.soil_type}
                        onChange={(event) =>
                          setFarmProfileForm((previous) => ({
                            ...previous,
                            soil_type: event.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Unknown</option>
                        {SOIL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileEditor(false);
                    setProfileError('');
                    setProfileSuccess('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all hover:scale-110"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {showChat && <ChatBot onClose={() => setShowChat(false)} />}
    </div>
  );
}
