const r = require('express').Router();
const c = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/auth');
const { requireTenant } = require('../middleware/tenant');

r.use(authenticate, requireRole('RESTAURANT'), requireTenant);

r.get('/profile', c.getProfile);
r.put('/profile', c.upload.single('logo'), c.updateProfile);

r.get('/categories', c.listCategories);
r.post('/categories', c.createCategory);
r.put('/categories/:id', c.updateCategory);
r.delete('/categories/:id', c.deleteCategory);

r.get('/items', c.listItems);
r.post('/items', c.upload.single('photo'), c.createItem);
r.put('/items/:id', c.upload.single('photo'), c.updateItem);
r.delete('/items/:id', c.deleteItem);

r.get('/tables', c.listTables);
r.post('/tables', c.createTable);
r.put('/tables/:id', c.updateTable);
r.delete('/tables/:id', c.deleteTable);

module.exports = r;
