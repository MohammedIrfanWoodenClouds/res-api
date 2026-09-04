require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const auth = require('./routes/auth');
const superAdmin = require('./routes/superAdmin');
const restaurant = require('./routes/restaurant');
const menu = require('./routes/menu');
const publicRoutes = require('./routes/public');
const orders = require('./routes/orders');
const kots = require('./routes/kots');
const invoices = require('./routes/invoices');
const purchases = require('./routes/purchases');
const expenses = require('./routes/expenses');
const salaries = require('./routes/salaries');
const reports = require('./routes/reports');

const app = express();
const allowedOrigins = String(process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/super-admin', superAdmin);
app.use('/api/restaurant', restaurant);
app.use('/api/menu', menu);
app.use('/api/public', publicRoutes);
app.use('/api/orders', orders);
app.use('/api/kots', kots);
app.use('/api/invoices', invoices);
app.use('/api/purchases', purchases);
app.use('/api/expenses', expenses);
app.use('/api/salaries', salaries);
app.use('/api/reports', reports);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

module.exports = app;
