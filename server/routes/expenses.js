const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, authMiddleware } = require('../auth');

// Add expense
router.post('/', authMiddleware, async (req, res) => {
  try {
    const expenseId = generateId();
    const {
      farm_id,
      category,
      amount,
      description,
      expense_date,
      crop_related,
      season,
      season_year,
    } = req.body;

    const parsedSeasonYear = Number.parseInt(String(season_year), 10);
    const normalizedSeasonYear = Number.isInteger(parsedSeasonYear) ? parsedSeasonYear : null;

    await dbUtils.run(
      `INSERT INTO expenses (
        id,
        farm_id,
        farmer_id,
        category,
        amount,
        description,
        expense_date,
        crop_related,
        season,
        season_year
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseId,
        farm_id,
        req.userId,
        category,
        amount,
        description,
        expense_date,
        crop_related,
        season || null,
        normalizedSeasonYear,
      ]
    );

    const expense = await dbUtils.get(
      'SELECT * FROM expenses WHERE id = ?',
      [expenseId]
    );

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Get expenses for farm
router.get('/farm/:farmId', authMiddleware, async (req, res) => {
  try {
    const expenses = await dbUtils.all(
      'SELECT * FROM expenses WHERE farm_id = ? ORDER BY expense_date DESC',
      [req.params.farmId]
    );

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Update expense
router.put('/:expenseId', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      amount,
      description,
      expense_date,
      crop_related,
      season,
      season_year,
    } = req.body;

    const parsedSeasonYear = Number.parseInt(String(season_year), 10);
    const normalizedSeasonYear = Number.isInteger(parsedSeasonYear) ? parsedSeasonYear : null;

    const updateResult = await dbUtils.run(
      `UPDATE expenses
       SET category = ?, amount = ?, description = ?, expense_date = ?, crop_related = ?, season = ?, season_year = ?
       WHERE id = ? AND farmer_id = ?`,
      [
        category,
        amount,
        description || null,
        expense_date,
        crop_related || null,
        season || null,
        normalizedSeasonYear,
        req.params.expenseId,
        req.userId,
      ]
    );

    if (!updateResult.changes) {
      return res.status(404).json({ error: 'Expense not found or access denied' });
    }

    const expense = await dbUtils.get(
      'SELECT * FROM expenses WHERE id = ? AND farmer_id = ?',
      [req.params.expenseId, req.userId]
    );

    return res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    return res.status(500).json({ error: 'Failed to update expense' });
  }
});

module.exports = router;
