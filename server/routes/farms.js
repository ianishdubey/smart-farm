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

// Update farm
router.put('/:farmId', authMiddleware, async (req, res) => {
  try {
    const existingFarm = await dbUtils.get(
      'SELECT * FROM farms WHERE id = ? AND farmer_id = ? LIMIT 1',
      [req.params.farmId, req.userId]
    );

    if (!existingFarm) {
      return res.status(404).json({ error: 'Farm not found or access denied' });
    }

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

    const normalizedFarmName =
      typeof farm_name === 'string' && farm_name.trim()
        ? farm_name.trim()
        : existingFarm.farm_name;

    const normalizedLocationName =
      typeof location_name === 'string' && location_name.trim()
        ? location_name.trim()
        : existingFarm.location_name;

    const parsedLatitude =
      latitude === undefined || latitude === null || latitude === ''
        ? Number(existingFarm.latitude)
        : Number(latitude);
    const parsedLongitude =
      longitude === undefined || longitude === null || longitude === ''
        ? Number(existingFarm.longitude)
        : Number(longitude);
    const parsedFarmSize =
      farm_size === undefined || farm_size === null || farm_size === ''
        ? Number(existingFarm.farm_size)
        : Number(farm_size);

    if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }

    if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    if (!Number.isFinite(parsedFarmSize) || parsedFarmSize <= 0) {
      return res.status(400).json({ error: 'Farm size must be greater than 0' });
    }

    const normalizedIrrigationType =
      typeof irrigation_type === 'string' && irrigation_type.trim()
        ? irrigation_type.trim()
        : existingFarm.irrigation_type;

    const normalizedSoilType =
      soil_type === null
        ? null
        : typeof soil_type === 'string'
          ? soil_type.trim() || null
          : existingFarm.soil_type;

    const normalizedBoundaryCoordinates =
      boundary_coordinates === undefined ? existingFarm.boundary_coordinates : boundary_coordinates;

    await dbUtils.run(
      `UPDATE farms
       SET farm_name = ?, location_name = ?, latitude = ?, longitude = ?, farm_size = ?, irrigation_type = ?, soil_type = ?, boundary_coordinates = ?
       WHERE id = ? AND farmer_id = ?`,
      [
        normalizedFarmName,
        normalizedLocationName,
        parsedLatitude,
        parsedLongitude,
        parsedFarmSize,
        normalizedIrrigationType,
        normalizedSoilType,
        normalizedBoundaryCoordinates,
        req.params.farmId,
        req.userId,
      ]
    );

    const updatedFarm = await dbUtils.get(
      'SELECT * FROM farms WHERE id = ? AND farmer_id = ? LIMIT 1',
      [req.params.farmId, req.userId]
    );

    return res.json(updatedFarm);
  } catch (error) {
    console.error('Update farm error:', error);
    return res.status(500).json({ error: 'Failed to update farm' });
  }
});

module.exports = router;
