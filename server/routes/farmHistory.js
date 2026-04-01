const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, authMiddleware } = require('../auth');

// Add farm history records
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const { farm_id, records } = req.body;

    const insertedRecords = [];
    for (const record of records) {
      const historyId = generateId();
      await dbUtils.run(
        `INSERT INTO farm_history (id, farm_id, year, crop_grown, yield_achieved, soil_color, water_retention_observed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          historyId,
          farm_id,
          record.year,
          record.crop_grown,
          record.yield_achieved,
          record.soil_color,
          record.water_retention_observed,
        ]
      );
      insertedRecords.push({ id: historyId, ...record });
    }

    res.status(201).json(insertedRecords);
  } catch (error) {
    console.error('Create farm history error:', error);
    res.status(500).json({ error: 'Failed to create farm history' });
  }
});

// Get farm history
router.get('/farm/:farmId', authMiddleware, async (req, res) => {
  try {
    const history = await dbUtils.all(
      'SELECT * FROM farm_history WHERE farm_id = ? ORDER BY year DESC',
      [req.params.farmId]
    );

    res.json(history);
  } catch (error) {
    console.error('Get farm history error:', error);
    res.status(500).json({ error: 'Failed to fetch farm history' });
  }
});

module.exports = router;
