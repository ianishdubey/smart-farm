const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'farm.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function ensureColumnExists(tableName, columnName, columnDefinition) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Error checking columns for ${tableName}:`, err.message);
      return;
    }

    const hasColumn = Array.isArray(columns) && columns.some((column) => column.name === columnName);
    if (hasColumn) return;

    db.run(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
      (alterErr) => {
        if (alterErr) {
          console.error(`Error adding ${columnName} to ${tableName}:`, alterErr.message);
        } else {
          console.log(`✓ Added ${columnName} to ${tableName}`);
        }
      }
    );
  });
}

function initializeDatabase() {
  db.serialize(() => {
    // Farmers table
    db.run(`CREATE TABLE IF NOT EXISTS farmers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      phone TEXT,
      language_preference TEXT DEFAULT 'en',
      role TEXT DEFAULT 'farmer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating farmers table:', err.message);
    });

    // Farms table
    db.run(`CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      farm_name TEXT,
      location_name TEXT,
      latitude REAL,
      longitude REAL,
      farm_size REAL,
      irrigation_type TEXT,
      soil_type TEXT,
      boundary_coordinates TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farmer_id) REFERENCES farmers(id)
    )`, (err) => {
      if (err) console.error('Error creating farms table:', err.message);
    });

    // Crops database
    db.run(`CREATE TABLE IF NOT EXISTS crops_database (
      id TEXT PRIMARY KEY,
      crop_name TEXT UNIQUE,
      crop_name_hindi TEXT,
      crop_name_punjabi TEXT,
      suitable_soil_types TEXT,
      water_requirement TEXT,
      season TEXT,
      avg_yield_per_acre REAL,
      avg_market_price REAL,
      growing_duration_days INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating crops_database table:', err.message);
    });

    // Farm history
    db.run(`CREATE TABLE IF NOT EXISTS farm_history (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      year INTEGER,
      crop_grown TEXT,
      yield_achieved REAL,
      soil_color TEXT,
      water_retention_observed TEXT,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    )`, (err) => {
      if (err) console.error('Error creating farm_history table:', err.message);
    });

    // Expenses
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      category TEXT,
      amount REAL,
      description TEXT,
      expense_date DATE,
      crop_related TEXT,
      season TEXT,
      season_year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id),
      FOREIGN KEY(farmer_id) REFERENCES farmers(id)
    )`, (err) => {
      if (err) console.error('Error creating expenses table:', err.message);
    });

    // Payments
    db.run(`CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      crop_sold TEXT,
      quantity REAL,
      buyer_name TEXT,
      amount_received REAL,
      pending_amount REAL,
      sale_date DATE,
      season TEXT,
      season_year INTEGER,
      payment_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id),
      FOREIGN KEY(farmer_id) REFERENCES farmers(id)
    )`, (err) => {
      if (err) console.error('Error creating payments table:', err.message);
    });

    // Crop recommendations
    db.run(`CREATE TABLE IF NOT EXISTS crop_recommendations (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      farmer_id TEXT NOT NULL,
      recommended_crop TEXT,
      confidence_score REAL,
      profit_potential REAL,
      reasoning TEXT,
      season TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id),
      FOREIGN KEY(farmer_id) REFERENCES farmers(id)
    )`, (err) => {
      if (err) console.error('Error creating crop_recommendations table:', err.message);
    });

    // Chatbot queries
    db.run(`CREATE TABLE IF NOT EXISTS chatbot_queries (
      id TEXT PRIMARY KEY,
      farmer_id TEXT NOT NULL,
      query TEXT,
      response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farmer_id) REFERENCES farmers(id)
    )`, (err) => {
      if (err) console.error('Error creating chatbot_queries table:', err.message);
    });

    // Soil types
    db.run(`CREATE TABLE IF NOT EXISTS soil_types (
      id TEXT PRIMARY KEY,
      soil_name TEXT,
      description TEXT,
      suitable_crops TEXT,
      ph_range TEXT,
      water_retention TEXT
    )`, (err) => {
      if (err) console.error('Error creating soil_types table:', err.message);
      else insertDefaultData();
    });

    // Backfill columns for existing local databases created before these fields existed.
    ensureColumnExists('expenses', 'season', 'TEXT');
    ensureColumnExists('expenses', 'season_year', 'INTEGER');
    ensureColumnExists('payments', 'season', 'TEXT');
    ensureColumnExists('payments', 'season_year', 'INTEGER');
  });
}

function insertDefaultData() {
  // Check if crops already exist
  db.get('SELECT COUNT(*) as count FROM crops_database', (err, row) => {
    if (err) {
      console.error('Error checking crops:', err.message);
      return;
    }

    if (row && row.count > 0) {
      console.log('✓ Crops data already exists');
      return;
    }

    // Insert crops data
    const crops = [
      ['wheat', 'गेहूं', 'ਕਣਕ', 'Loamy,Clay', 'Low', 'Rabi', 50, 2800, 120],
      ['rice', 'धान', 'ਚਾਵਲ', 'Clayey,Loamy', 'High', 'Kharif', 60, 2400, 150],
      ['maize', 'मक्का', 'ਮੱਕੀ', 'Loamy,Sandy-Loam', 'Medium', 'Kharif', 45, 1800, 120],
      ['cotton', 'कपास', 'ਪੱਟੀ', 'Loamy,Well-Drained', 'Medium', 'Kharif', 18, 5200, 180],
      ['sugar_cane', 'गन्ना', 'ਗੰਨਾ', 'Loamy,Well-Drained', 'High', 'Rabi', 70, 700, 365],
      ['potatoes', 'आलू', 'ਆਲੂ', 'Sandy-Loam,Loamy', 'Medium', 'Rabi', 200, 1200, 90],
      ['onion', 'प्याज', 'ਪਿਆਜ', 'Loamy,Sandy-Loam', 'Medium', 'Rabi', 250, 2000, 150],
      ['tomato', 'टमाटर', 'ਟਮਾਟਰ', 'Loamy,Sandy-Loam', 'Medium', 'Kharif', 400, 1200, 90],
      ['soybean', 'सोयाबीन', 'ਸੋਇਆ', 'Loamy,Well-Drained', 'Low', 'Kharif', 20, 3800, 100],
    ];

    crops.forEach((crop, index) => {
      const id = `crop_${index}_${Date.now()}`;
      db.run(
        `INSERT OR IGNORE INTO crops_database 
         (id, crop_name, crop_name_hindi, crop_name_punjabi, suitable_soil_types, water_requirement, season, avg_yield_per_acre, avg_market_price, growing_duration_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...crop],
        (err) => {
          if (err) console.error(`Error inserting crop ${crop[0]}:`, err.message);
        }
      );
    });

    console.log('✓ Default crops data inserted');
  });
}

// Helper functions for database operations
const dbUtils = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },

  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  },
};

module.exports = { db, dbUtils };
