// Re-export from database.ts for backward compatibility
export { db as supabase, setAuthToken, getAuthToken } from './database';

// Type definitions
export type UserRole = 'farmer' | 'admin';

export interface Farmer {
  id: string;
  full_name: string;
  phone: string | null;
  language_preference: string;
  role: UserRole;
  created_at: string;
}

export interface Farm {
  id: string;
  farmer_id: string;
  farm_name: string;
  location_name: string;
  latitude: number;
  longitude: number;
  farm_size: number;
  irrigation_type: string;
  soil_type: string | null;
  boundary_coordinates: any;
  created_at: string;
}

export interface Crop {
  id: string;
  crop_name: string;
  crop_name_hindi: string | null;
  crop_name_punjabi: string | null;
  suitable_soil_types: string[];
  water_requirement: string;
  season: string | null;
  avg_yield_per_acre: number;
  avg_market_price: number;
  growing_duration_days: number;
}

export interface Expense {
  id: string;
  farm_id: string;
  farmer_id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  crop_related: string | null;
  season: string | null;
  season_year: number | null;
  created_at: string;
}

export interface Payment {
  id: string;
  farm_id: string;
  farmer_id: string;
  crop_sold: string;
  quantity: number;
  buyer_name: string | null;
  amount_received: number;
  pending_amount: number;
  sale_date: string;
  season: string | null;
  season_year: number | null;
  payment_status: string;
  created_at: string;
}

