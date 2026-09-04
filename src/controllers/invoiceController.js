const billingService = require('../services/billingService');
const Restaurant = require('../models/Restaurant');

async function bill(req, res) {
  const { paymentMethod } = req.body;
  const result = await billingService.billOrder(
    req.user.tenantId,
    req.params.orderId,
    paymentMethod,
    req.user.userId
  );
  const restaurant = await Restaurant.findById(req.user.tenantId);
  res.status(201).json({ ...result, restaurant });
}

async function list(req, res) {
  const invoices = await billingService.listInvoices(req.user.tenantId, {
    from: req.query.from,
    to: req.query.to,
  });
  res.json(invoices);
}

async function getOne(req, res) {
  const data = await billingService.getInvoice(req.user.tenantId, req.params.id);
  if (!data) return res.status(404).json({ message: 'Invoice not found' });
  const restaurant = await Restaurant.findById(req.user.tenantId);
  res.json({ ...data, restaurant });
}

module.exports = { bill, list, getOne };
