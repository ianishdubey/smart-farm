const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, authMiddleware } = require('../auth');

// Add chatbot query
router.post('/', authMiddleware, async (req, res) => {
  try {
    const queryId = generateId();
    const { query, response } = req.body;

    await dbUtils.run(
      `INSERT INTO chatbot_queries (id, farmer_id, query, response)
       VALUES (?, ?, ?, ?)`,
      [queryId, req.userId, query, response]
    );

    const chatQuery = await dbUtils.get(
      'SELECT * FROM chatbot_queries WHERE id = ?',
      [queryId]
    );

    res.status(201).json(chatQuery);
  } catch (error) {
    console.error('Create chatbot query error:', error);
    res.status(500).json({ error: 'Failed to save query' });
  }
});

module.exports = router;
