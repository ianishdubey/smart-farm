const express = require('express');
const router = express.Router();
const { dbUtils } = require('../db');
const { generateId, generateToken, bcrypt, authMiddleware } = require('../auth');

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      full_name,
      phone,
      language_preference,
    } = req.body;

    const normalizedFullName = String(fullName || full_name || '').trim();
    const normalizedPhone = typeof phone === 'string' ? phone.trim() || null : null;
    const normalizedLanguagePreference =
      typeof language_preference === 'string' && ['en', 'hi', 'pa'].includes(language_preference)
        ? language_preference
        : 'en';

    if (!email || !password || !normalizedFullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

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
      `INSERT INTO farmers (id, email, password, full_name, role, language_preference, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        email,
        hashedPassword,
        normalizedFullName,
        'farmer',
        normalizedLanguagePreference,
        normalizedPhone,
      ]
    );

    const createdUser = await dbUtils.get(
      'SELECT id, email, full_name, role, phone, language_preference, created_at FROM farmers WHERE id = ?',
      [userId]
    );

    const token = generateToken(userId);

    res.json({
      user: {
        id: createdUser.id,
        email: createdUser.email,
        full_name: createdUser.full_name,
        fullName: createdUser.full_name,
        role: createdUser.role,
        phone: createdUser.phone,
        language_preference: createdUser.language_preference,
        created_at: createdUser.created_at,
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
      `SELECT id, email, password, full_name, role, phone, language_preference, created_at
       FROM farmers
       WHERE email = ?`,
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
        full_name: user.full_name,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
        language_preference: user.language_preference,
        created_at: user.created_at,
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
      email: user.email,
      full_name: user.full_name,
      fullName: user.full_name,
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
    const currentUser = await dbUtils.get(
      'SELECT id, email, full_name, role, phone, language_preference, created_at FROM farmers WHERE id = ?',
      [req.userId]
    );

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { full_name, fullName, phone, language_preference } = req.body;

    const baseFullName =
      typeof full_name === 'string'
        ? full_name
        : typeof fullName === 'string'
          ? fullName
          : currentUser.full_name || '';
    const normalizedFullName = baseFullName.trim();

    if (!normalizedFullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const normalizedPhone =
      phone === null
        ? null
        : typeof phone === 'string'
          ? phone.trim() || null
          : currentUser.phone;

    const normalizedLanguagePreference =
      typeof language_preference === 'string' && ['en', 'hi', 'pa'].includes(language_preference)
        ? language_preference
        : currentUser.language_preference || 'en';

    await dbUtils.run(
      `UPDATE farmers 
       SET full_name = ?, phone = ?, language_preference = ? 
       WHERE id = ?`,
      [normalizedFullName, normalizedPhone, normalizedLanguagePreference, req.userId]
    );

    const updatedUser = await dbUtils.get(
      'SELECT id, email, full_name, role, phone, language_preference, created_at FROM farmers WHERE id = ?',
      [req.userId]
    );

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      fullName: updatedUser.full_name,
      phone: updatedUser.phone,
      language_preference: updatedUser.language_preference,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
