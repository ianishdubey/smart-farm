const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, generateToken, bcrypt, authMiddleware } = require('../auth');

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user exists
    const existingUser = await dbUtils.get(
      'SELECT id FROM farmers WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userId = generateId();
    const hashedPassword = await bcrypt.hash(password, 10);

    await dbUtils.run(
      `INSERT INTO farmers (id, email, password, full_name, role, language_preference)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, fullName, 'farmer', 'en']
    );

    const token = generateToken(userId);

    res.json({
      user: {
        id: userId,
        email,
        fullName,
        role: 'farmer',
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await dbUtils.get(
      'SELECT id, email, password, full_name, role FROM farmers WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Signin failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await dbUtils.get(
      'SELECT id, email, full_name, role, phone, language_preference, created_at FROM farmers WHERE id = ?',
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      language_preference: user.language_preference,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { full_name, phone, language_preference } = req.body;

    await dbUtils.run(
      `UPDATE farmers 
       SET full_name = ?, phone = ?, language_preference = ? 
       WHERE id = ?`,
      [full_name, phone, language_preference, req.userId]
    );

    const updatedUser = await dbUtils.get(
      'SELECT id, email, full_name, role, phone, language_preference FROM farmers WHERE id = ?',
      [req.userId]
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
