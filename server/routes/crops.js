const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { authMiddleware } = require('../auth');

// Get all crops
router.get('/database', async (req, res) => {
  try {
    const crops = await dbUtils.all('SELECT * FROM crops_database');

    const formattedCrops = crops.map(crop => ({
      id: crop.id,
      crop_name: crop.crop_name,
      crop_name_hindi: crop.crop_name_hindi,
      crop_name_punjabi: crop.crop_name_punjabi,
      suitable_soil_types: (crop.suitable_soil_types || '').split(',').filter(x => x),
      water_requirement: crop.water_requirement,
      season: crop.season,
      avg_yield_per_acre: crop.avg_yield_per_acre,
      avg_market_price: crop.avg_market_price,
      growing_duration_days: crop.growing_duration_days,
    }));

    res.json(formattedCrops);
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// Get crops by season
router.get('/by-season/:season', async (req, res) => {
  try {
    const crops = await dbUtils.all(
      'SELECT * FROM crops_database WHERE season = ?',
      [req.params.season]
    );

    const formattedCrops = crops.map(crop => ({
      id: crop.id,
      crop_name: crop.crop_name,
      crop_name_hindi: crop.crop_name_hindi,
      crop_name_punjabi: crop.crop_name_punjabi,
      suitable_soil_types: (crop.suitable_soil_types || '').split(',').filter(x => x),
      water_requirement: crop.water_requirement,
      season: crop.season,
      avg_yield_per_acre: crop.avg_yield_per_acre,
      avg_market_price: crop.avg_market_price,
      growing_duration_days: crop.growing_duration_days,
    }));

    res.json(formattedCrops);
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

module.exports = router;
