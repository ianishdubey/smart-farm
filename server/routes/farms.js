const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, authMiddleware } = require('../auth');

// Create farm
router.post('/', authMiddleware, async (req, res) => {
  try {
    const farmId = generateId();
    const {
      farm_name,
      location_name,
      latitude,
      longitude,
      farm_size,
      irrigation_type,
      soil_type,
      boundary_coordinates,
    } = req.body;

    await dbUtils.run(
      `INSERT INTO farms (id, farmer_id, farm_name, location_name, latitude, longitude, farm_size, irrigation_type, soil_type, boundary_coordinates)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmId,
        req.userId,
        farm_name,
        location_name,
        latitude,
        longitude,
        farm_size,
        irrigation_type,
        soil_type,
        boundary_coordinates,
      ]
    );

    const farm = await dbUtils.get(
      'SELECT * FROM farms WHERE id = ?',
      [farmId]
    );

    res.status(201).json(farm);
  } catch (error) {
    console.error('Create farm error:', error);
    res.status(500).json({ error: 'Failed to create farm' });
  }
});

// Get user's farm
router.get('/', authMiddleware, async (req, res) => {
  try {
    const farm = await dbUtils.get(
      'SELECT * FROM farms WHERE farmer_id = ? LIMIT 1',
      [req.userId]
    );

    res.json(farm || null);
  } catch (error) {
    console.error('Get farm error:', error);
    res.status(500).json({ error: 'Failed to fetch farm' });
  }
});

// Get all farms
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const farms = await dbUtils.all(
      'SELECT * FROM farms WHERE farmer_id = ?',
      [req.userId]
    );

    res.json(farms);
  } catch (error) {
    console.error('Get farms error:', error);
    res.status(500).json({ error: 'Failed to fetch farms' });
  }
});

module.exports = router;
