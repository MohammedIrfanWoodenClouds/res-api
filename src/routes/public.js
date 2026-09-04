const r = require('express').Router();
const c = require('../controllers/publicController');

r.get('/menu/:slug', c.getPublicMenu);
r.post('/orders/:slug', c.placePublicOrder);
r.get('/orders/:slug/:orderNumber', c.trackPublicOrder);

module.exports = r;
