const r = require('express').Router();
const c = require('../controllers/reportController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);
r.get('/dashboard', c.dashboard);
r.get('/sales', c.sales);
r.get('/item-sales', c.itemSales);
r.get('/purchases', c.purchases);
r.get('/expenses', c.expenses);
r.get('/salaries', c.salaries);
r.get('/pnl', c.pnl);

module.exports = r;
