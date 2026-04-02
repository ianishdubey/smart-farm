const jwt = require('jwt-simple');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { dbUtils } = require('./db');

const secret = process.env.JWT_SECRET || 'your-secret-key';

const generateId = () => uuidv4();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.encode({ userId, iat: Math.floor(Date.now() / 1000) }, secret);
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    const decoded = jwt.decode(token, secret);
    return decoded.userId;
  } catch (err) {
    return null;
  }
};

// Middleware to check authentication
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = verifyToken(token);
  
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = userId;
  next();
};

module.exports = {
  generateId,
  generateToken,
  verifyToken,
  authMiddleware,
  bcrypt,
};
