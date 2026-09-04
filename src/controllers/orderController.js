const orderService = require('../services/orderService');
const Kot = require('../models/Kot');

async function list(req, res) {
  const orders = await orderService.listOrders(req.user.tenantId, {
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
  });
  res.json(orders);
}

async function getOne(req, res) {
  const bundle = await orderService.getOrderBundle(req.user.tenantId, req.params.id);
  if (!bundle) return res.status(404).json({ message: 'Order not found' });
  res.json(bundle);
}

async function transition(req, res) {
  const { status, cancelReason } = req.body;
  if (!status) return res.status(400).json({ message: 'status is required' });
  const bundle = await orderService.transitionOrder(
    req.user.tenantId,
    req.params.id,
    status,
    req.user.userId,
    cancelReason
  );
  res.json(bundle);
}

async function listKots(req, res) {
  const q = { tenantId: req.user.tenantId, status: { $ne: 'CANCELLED' } };
  if (req.query.status) q.status = req.query.status;
  const kots = await Kot.find(q).sort({ createdAt: -1 });
  res.json(kots);
}

async function kotAction(req, res) {
  const action = String(req.body.action || '').toUpperCase();
  const kot = await orderService.transitionKot(req.user.tenantId, req.params.id, action);
  res.json(kot);
}

module.exports = { list, getOne, transition, listKots, kotAction };
