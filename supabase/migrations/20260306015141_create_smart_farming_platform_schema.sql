/*
  # Smart Farming Platform Database Schema

  ## Overview
  Complete database schema for AI-powered smart farming platform with farmer management,
  crop recommendations, financial analytics, and AI insights.

  ## New Tables

  ### 1. farmers
  Core farmer profile information
  - `id` (uuid, primary key) - Links to auth.users
  - `full_name` (text) - Farmer's full name
  - `phone` (text) - Contact number
  - `language_preference` (text) - en, hi, or pa
  - `role` (text) - 'farmer' or 'admin'
  - `created_at` (timestamptz) - Registration date

  ### 2. farms
  Farm property details
  - `id` (uuid, primary key)
  - `farmer_id` (uuid, foreign key) - Owner
  - `farm_name` (text) - Farm name
  - `location_name` (text) - Location description
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `farm_size` (numeric) - Size in acres
  - `irrigation_type` (text) - Irrigation method
  - `soil_type` (text) - Soil classification
  - `boundary_coordinates` (jsonb) - Optional polygon for farm boundary
  - `created_at` (timestamptz)

  ### 3. crops_database
  Master crop information
  - `id` (uuid, primary key)
  - `crop_name` (text) - Crop name
  - `crop_name_hindi` (text) - Hindi name
  - `crop_name_punjabi` (text) - Punjabi name
  - `suitable_soil_types` (text[]) - Compatible soils
  - `water_requirement` (text) - Low/Medium/High
  - `season` (text) - Kharif/Rabi/Zaid
  - `avg_yield_per_acre` (numeric) - Expected yield
  - `avg_market_price` (numeric) - Average price per quintal
  - `growing_duration_days` (int) - Days to harvest
  - `created_at` (timestamptz)

  ### 4. soil_types
  Soil type master data
  - `id` (uuid, primary key)
  - `soil_name` (text) - Soil type name
  - `description` (text) - Characteristics
  - `suitable_crops` (text[]) - Recommended crops
  - `ph_range` (text) - pH range
  - `water_retention` (text) - Retention capacity

  ### 5. farm_history
  Historical crop data for soil estimation
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `year` (int) - Year grown
  - `crop_grown` (text) - Crop name
  - `yield_achieved` (numeric) - Actual yield
  - `soil_color` (text) - Observed color
  - `water_retention_observed` (text) - Observed retention

  ### 6. expenses
  Farm expense tracking
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `category` (text) - Seeds/Fertilizers/Labor/Machinery/Water/Pesticides
  - `amount` (numeric) - Expense amount
  - `description` (text) - Details
  - `expense_date` (date) - When spent
  - `crop_related` (text) - Related crop
  - `created_at` (timestamptz)

  ### 7. payments
  Crop sales and payment tracking
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `crop_sold` (text) - Crop name
  - `quantity` (numeric) - Quantity sold
  - `buyer_name` (text) - Buyer information
  - `amount_received` (numeric) - Payment received
  - `pending_amount` (numeric) - Outstanding payment
  - `sale_date` (date) - Sale date
  - `payment_status` (text) - Paid/Pending/Partial
  - `created_at` (timestamptz)

  ### 8. yield_records
  Crop yield tracking
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `crop_name` (text) - Crop harvested
  - `season` (text) - Season
  - `year` (int) - Year
  - `predicted_yield` (numeric) - AI prediction
  - `actual_yield` (numeric) - Actual harvest
  - `yield_per_acre` (numeric) - Calculated yield
  - `created_at` (timestamptz)

  ### 9. weather_logs
  Weather data cache
  - `id` (uuid, primary key)
  - `location_lat` (numeric) - Latitude
  - `location_lng` (numeric) - Longitude
  - `temperature` (numeric) - Temperature °C
  - `humidity` (numeric) - Humidity %
  - `rain_probability` (numeric) - Rain chance %
  - `wind_speed` (numeric) - Wind speed km/h
  - `weather_condition` (text) - Description
  - `forecast_date` (date) - Forecast date
  - `fetched_at` (timestamptz) - Cache timestamp

  ### 10. crop_recommendations
  AI crop recommendations
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `recommended_crop` (text) - Crop name
  - `confidence_score` (numeric) - AI confidence %
  - `profit_potential` (numeric) - Expected profit
  - `reasoning` (text) - Recommendation explanation
  - `season` (text) - Target season
  - `created_at` (timestamptz)

  ### 11. diseases_database
  Crop disease information
  - `id` (uuid, primary key)
  - `disease_name` (text) - Disease name
  - `disease_name_hindi` (text) - Hindi name
  - `disease_name_punjabi` (text) - Punjabi name
  - `affected_crops` (text[]) - Susceptible crops
  - `symptoms` (text) - Symptoms description
  - `treatment` (text) - Treatment recommendations
  - `prevention` (text) - Prevention measures
  - `image_url` (text) - Reference image

  ### 12. disease_detections
  Disease detection records
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `crop_name` (text) - Affected crop
  - `image_url` (text) - Uploaded image
  - `detected_disease` (text) - Disease detected
  - `confidence` (numeric) - Detection confidence
  - `treatment_suggested` (text) - Treatment advice
  - `created_at` (timestamptz)

  ### 13. market_prices
  Mandi price tracking
  - `id` (uuid, primary key)
  - `crop_name` (text) - Crop name
  - `market_location` (text) - Mandi location
  - `price_per_quintal` (numeric) - Price
  - `price_date` (date) - Price date
  - `created_at` (timestamptz)

  ### 14. chatbot_queries
  Chatbot interaction logs
  - `id` (uuid, primary key)
  - `farmer_id` (uuid, foreign key) - User asking
  - `query` (text) - User question
  - `response` (text) - Bot answer
  - `category` (text) - Query category
  - `created_at` (timestamptz)

  ### 15. notifications
  Alert system
  - `id` (uuid, primary key)
  - `farmer_id` (uuid, foreign key) - Recipient
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `type` (text) - rain_warning/pest_alert/sowing_time/scheme
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz)

  ### 16. ai_insights
  Automated AI insights
  - `id` (uuid, primary key)
  - `farm_id` (uuid, foreign key)
  - `farmer_id` (uuid, foreign key)
  - `insight_text` (text) - Insight message
  - `insight_type` (text) - Type of insight
  - `priority` (text) - high/medium/low
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Farmers can only access their own data
  - Admins can access all data
*/

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  language_preference text DEFAULT 'en',
  role text DEFAULT 'farmer',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own profile"
  ON farmers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON farmers FOR SELECT
  TO authenticated
  USING (role = 'admin' AND auth.uid() = id);

CREATE POLICY "Farmers can update own profile"
  ON farmers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON farmers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow new users to create their profile during signup
CREATE POLICY "Users can create profile during signup"
  ON farmers FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Create farms table
CREATE TABLE IF NOT EXISTS farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  farm_name text NOT NULL,
  location_name text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  farm_size numeric NOT NULL,
  irrigation_type text NOT NULL,
  soil_type text,
  boundary_coordinates jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own farms"
  ON farms FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can create own farms"
  ON farms FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers can update own farms"
  ON farms FOR UPDATE
  TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "Farmers can delete own farms"
  ON farms FOR DELETE
  TO authenticated
  USING (farmer_id = auth.uid());

-- Create crops_database table
CREATE TABLE IF NOT EXISTS crops_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text UNIQUE NOT NULL,
  crop_name_hindi text,
  crop_name_punjabi text,
  suitable_soil_types text[] DEFAULT '{}',
  water_requirement text DEFAULT 'Medium',
  season text,
  avg_yield_per_acre numeric DEFAULT 0,
  avg_market_price numeric DEFAULT 0,
  growing_duration_days int DEFAULT 90,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crops_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crops database"
  ON crops_database FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage crops database"
  ON crops_database FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'));

-- Create soil_types table
CREATE TABLE IF NOT EXISTS soil_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  soil_name text UNIQUE NOT NULL,
  description text,
  suitable_crops text[] DEFAULT '{}',
  ph_range text,
  water_retention text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE soil_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view soil types"
  ON soil_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage soil types"
  ON soil_types FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'));

-- Create farm_history table
CREATE TABLE IF NOT EXISTS farm_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  year int NOT NULL,
  crop_grown text NOT NULL,
  yield_achieved numeric DEFAULT 0,
  soil_color text,
  water_retention_observed text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE farm_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own farm history"
  ON farm_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM farms WHERE id = farm_id AND farmer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can manage own farm history"
  ON farm_history FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM farms WHERE id = farm_id AND farmer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM farms WHERE id = farm_id AND farmer_id = auth.uid()));

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  description text,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  crop_related text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can manage own expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  crop_sold text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  buyer_name text,
  amount_received numeric NOT NULL DEFAULT 0,
  pending_amount numeric DEFAULT 0,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_status text DEFAULT 'Paid',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can manage own payments"
  ON payments FOR ALL
  TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

-- Create yield_records table
CREATE TABLE IF NOT EXISTS yield_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  crop_name text NOT NULL,
  season text,
  year int NOT NULL,
  predicted_yield numeric DEFAULT 0,
  actual_yield numeric DEFAULT 0,
  yield_per_acre numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE yield_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own yield records"
  ON yield_records FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can manage own yield records"
  ON yield_records FOR ALL
  TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

-- Create weather_logs table
CREATE TABLE IF NOT EXISTS weather_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_lat numeric NOT NULL,
  location_lng numeric NOT NULL,
  temperature numeric,
  humidity numeric,
  rain_probability numeric,
  wind_speed numeric,
  weather_condition text,
  forecast_date date NOT NULL,
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE weather_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weather logs"
  ON weather_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage weather logs"
  ON weather_logs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'));

-- Create crop_recommendations table
CREATE TABLE IF NOT EXISTS crop_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  recommended_crop text NOT NULL,
  confidence_score numeric DEFAULT 0,
  profit_potential numeric DEFAULT 0,
  reasoning text,
  season text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crop_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own recommendations"
  ON crop_recommendations FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can create recommendations"
  ON crop_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid());

-- Create diseases_database table
CREATE TABLE IF NOT EXISTS diseases_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name text UNIQUE NOT NULL,
  disease_name_hindi text,
  disease_name_punjabi text,
  affected_crops text[] DEFAULT '{}',
  symptoms text,
  treatment text,
  prevention text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE diseases_database ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view diseases database"
  ON diseases_database FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage diseases database"
  ON diseases_database FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'));

-- Create disease_detections table
CREATE TABLE IF NOT EXISTS disease_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  crop_name text NOT NULL,
  image_url text,
  detected_disease text,
  confidence numeric DEFAULT 0,
  treatment_suggested text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disease_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own disease detections"
  ON disease_detections FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can create disease detections"
  ON disease_detections FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid());

-- Create market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name text NOT NULL,
  market_location text NOT NULL,
  price_per_quintal numeric NOT NULL DEFAULT 0,
  price_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market prices"
  ON market_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage market prices"
  ON market_prices FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin'));

-- Create chatbot_queries table
CREATE TABLE IF NOT EXISTS chatbot_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  query text NOT NULL,
  response text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own chatbot queries"
  ON chatbot_queries FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Farmers can create chatbot queries"
  ON chatbot_queries FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid() OR farmer_id IS NULL);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id) ON DELETE CASCADE NOT NULL,
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE NOT NULL,
  insight_text text NOT NULL,
  insight_type text NOT NULL,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farmers can view own insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can create insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (
    farmer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM farmers WHERE id = auth.uid() AND role = 'admin')
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farms_farmer_id ON farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_farmer_id ON expenses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_payments_farmer_id ON payments(farmer_id);
CREATE INDEX IF NOT EXISTS idx_yield_records_farmer_id ON yield_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_farmer_id ON notifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_weather_logs_location ON weather_logs(location_lat, location_lng, forecast_date);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop ON market_prices(crop_name, price_date);
