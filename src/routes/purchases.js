const r = require('express').Router();
const c = require('../controllers/purchaseController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);

r.get('/suppliers', c.listSuppliers);
r.post('/suppliers', c.createSupplier);
r.put('/suppliers/:id', c.updateSupplier);
r.delete('/suppliers/:id', c.deleteSupplier);

r.get('/', c.listPurchases);
r.get('/:id', c.getPurchase);
r.post('/', c.createPurchase);
r.post('/:id/cancel', c.cancelPurchase);

module.exports = r;
