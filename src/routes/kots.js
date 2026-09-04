const r = require('express').Router();
const c = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);
r.get('/', c.listKots);
r.put('/:id/status', c.kotAction);

module.exports = r;
