const r = require('express').Router();
const c = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);
r.get('/', c.list);
r.get('/:id', c.getOne);
r.put('/:id/status', c.transition);

module.exports = r;
