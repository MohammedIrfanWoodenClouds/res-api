const r = require('express').Router();
const c = require('../controllers/expenseController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);
r.get('/categories', c.listCategories);
r.get('/', c.list);
r.post('/', c.create);
r.post('/:id/cancel', c.cancel);

module.exports = r;
