const r = require('express').Router();
const c = require('../controllers/publicController');

r.get('/menu/:slug', c.getPublicMenu);
r.post('/orders/:slug', c.placePublicOrder);

module.exports = r;
