const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { authMiddleware } = require('../auth');

// Get admin stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const farmersResult = await dbUtils.all(
      "SELECT COUNT(*) as count FROM farmers WHERE role = 'farmer'"
    );
    const farmsResult = await dbUtils.all(
      'SELECT COUNT(*) as count FROM farms'
    );
    const recsResult = await dbUtils.all(
      'SELECT COUNT(*) as count FROM crop_recommendations'
    );
    const queriesResult = await dbUtils.all(
      'SELECT COUNT(*) as count FROM chatbot_queries'
    );

    const stats = {
      totalFarmers: farmersResult[0]?.count || 0,
      activeFarms: farmsResult[0]?.count || 0,
      recommendations: recsResult[0]?.count || 0,
      chatbotQueries: queriesResult[0]?.count || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all farmers (admin only)
router.get('/farmers', authMiddleware, async (req, res) => {
  try {
    const farmers = await dbUtils.all(
      'SELECT id, full_name, email, phone, role, created_at FROM farmers WHERE role = ?',
      ['farmer']
    );

    res.json(farmers);
  } catch (error) {
    console.error('Get farmers error:', error);
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

module.exports = router;
