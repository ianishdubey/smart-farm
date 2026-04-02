const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize database
require('./db');

const authRoutes = require('./routes/auth');
const farmsRoutes = require('./routes/farms');
const cropsRoutes = require('./routes/crops');
const expensesRoutes = require('./routes/expenses');
const paymentsRoutes = require('./routes/payments');
const farmHistoryRoutes = require('./routes/farmHistory');
const recommendationsRoutes = require('./routes/recommendations');
const adminRoutes = require('./routes/admin');
const chatbotRoutes = require('./routes/chatbot');

const app = express();

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'SmartFarm AI API Server', version: '1.0.0', status: 'running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/crops', cropsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/farm-history', farmHistoryRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
