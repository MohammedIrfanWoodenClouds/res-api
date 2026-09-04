const r = require('express').Router();
const c = require('../controllers/salaryController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);

r.get('/employees', c.listEmployees);
r.post('/employees', c.createEmployee);
r.put('/employees/:id', c.updateEmployee);
r.delete('/employees/:id', c.deactivateEmployee);

r.get('/', c.listSalaries);
r.post('/', c.createSalary);
r.post('/:id/cancel', c.cancelSalary);

module.exports = r;
