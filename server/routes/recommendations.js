const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, authMiddleware } = require('../auth');

// Add recommendation
router.post('/', authMiddleware, async (req, res) => {
  try {
    const recId = generateId();
    const {
      farm_id,
      recommended_crop,
      confidence_score,
      profit_potential,
      reasoning,
      season,
    } = req.body;

    await dbUtils.run(
      `INSERT INTO crop_recommendations (id, farm_id, farmer_id, recommended_crop, confidence_score, profit_potential, reasoning, season)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recId,
        farm_id,
        req.userId,
        recommended_crop,
        confidence_score,
        profit_potential,
        reasoning,
        season,
      ]
    );

    const rec = await dbUtils.get(
      'SELECT * FROM crop_recommendations WHERE id = ?',
      [recId]
    );

    res.status(201).json(rec);
  } catch (error) {
    console.error('Create recommendation error:', error);
    res.status(500).json({ error: 'Failed to create recommendation' });
  }
});

module.exports = router;
