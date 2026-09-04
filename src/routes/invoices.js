const r = require('express').Router();
const c = require('../controllers/invoiceController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);
r.get('/', c.list);
r.get('/:id', c.getOne);
r.post('/bill/:orderId', c.bill);

module.exports = r;
