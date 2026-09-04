const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Kot = require('../models/Kot');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const { nextPadded } = require('../utils/counters');

const ALLOWED = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

async function createPublicOrder(tenantId, payload) {
  const { items, orderType, tableId, customerName, customerPhone, notes } = payload;
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('Cart items are required');
    err.status = 400;
    throw err;
  }
  if (!['DINE_IN', 'TAKEAWAY'].includes(orderType)) {
    const err = new Error('orderType must be DINE_IN or TAKEAWAY');
    err.status = 400;
    throw err;
  }

  let tableName = '';
  let resolvedTableId = null;
  if (orderType === 'DINE_IN') {
    if (!tableId) {
      const err = new Error('tableId is required for DINE_IN');
      err.status = 400;
      throw err;
    }
    const table = await Table.findOne({ _id: tableId, tenantId, isActive: true });
    if (!table) {
      const err = new Error('Invalid table');
      err.status = 400;
      throw err;
    }
    tableName = table.name;
    resolvedTableId = table._id;
  }

  const lines = [];
  let subtotal = 0;
  let taxTotal = 0;
  for (const row of items) {
    const qty = Number(row.quantity);
    if (!row.menuItemId || !Number.isFinite(qty) || qty < 1) {
      const err = new Error('Each item needs menuItemId and quantity >= 1');
      err.status = 400;
      throw err;
    }
    const menuItem = await MenuItem.findOne({
      _id: row.menuItemId,
      tenantId,
      isActive: true,
      isAvailable: true,
    });
    if (!menuItem) {
      const err = new Error('One or more menu items are unavailable');
      err.status = 400;
      throw err;
    }
    const lineSubtotal = round2(menuItem.price * qty);
    const lineTax = round2(lineSubtotal * (menuItem.taxPercent / 100));
    const lineTotal = round2(lineSubtotal + lineTax);
    subtotal += lineSubtotal;
    taxTotal += lineTax;
    lines.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      quantity: qty,
      unitPrice: menuItem.price,
      taxPercent: menuItem.taxPercent,
      lineSubtotal,
      lineTax,
      lineTotal,
    });
  }

  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  const total = round2(subtotal + taxTotal);
  const orderNumber = await nextPadded(tenantId, 'order');

  const order = await Order.create({
    tenantId,
    orderNumber,
    orderType,
    status: 'NEW',
    tableId: resolvedTableId,
    tableName,
    customerName: customerName || '',
    customerPhone: customerPhone || '',
    notes: notes || '',
    subtotal,
    taxTotal,
    total,
  });

  await OrderItem.insertMany(
    lines.map((l) => ({
      tenantId,
      orderId: order._id,
      ...l,
    }))
  );

  return getOrderBundle(tenantId, order._id);
}

async function getOrderBundle(tenantId, orderId) {
  const order = await Order.findOne({ _id: orderId, tenantId });
  if (!order) return null;
  const items = await OrderItem.find({ tenantId, orderId: order._id });
  const kot = order.kotId ? await Kot.findOne({ _id: order.kotId, tenantId }) : null;
  return { order, items, kot };
}

async function listOrders(tenantId, { status, from, to } = {}) {
  const q = { tenantId };
  if (status) q.status = status;
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  return Order.find(q).sort({ createdAt: -1 });
}

async function transitionOrder(tenantId, orderId, nextStatus, userId, cancelReason = '') {
  const order = await Order.findOne({ _id: orderId, tenantId });
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  const allowed = ALLOWED[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    const err = new Error(`Cannot change status from ${order.status} to ${nextStatus}`);
    err.status = 400;
    throw err;
  }

  if (nextStatus === 'CONFIRMED') {
    const items = await OrderItem.find({ tenantId, orderId: order._id });
    const kotNumber = await nextPadded(tenantId, 'kot');
    const kot = await Kot.create({
      tenantId,
      orderId: order._id,
      kotNumber,
      status: 'CREATED',
      tableName: order.tableName,
      orderType: order.orderType,
      items: items.map((i) => ({ name: i.name, quantity: i.quantity })),
    });
    order.kotId = kot._id;
    order.status = 'CONFIRMED';
    await order.save();
    return getOrderBundle(tenantId, order._id);
  }

  if (nextStatus === 'PREPARING') {
    order.status = 'PREPARING';
    await order.save();
    if (order.kotId) {
      await Kot.updateOne(
        { _id: order.kotId, tenantId, status: 'CREATED' },
        { $set: { status: 'PREPARING' } }
      );
    }
    return getOrderBundle(tenantId, order._id);
  }

  if (nextStatus === 'READY') {
    order.status = 'READY';
    await order.save();
    if (order.kotId) {
      await Kot.updateOne(
        { _id: order.kotId, tenantId, status: { $in: ['CREATED', 'PREPARING'] } },
        { $set: { status: 'READY' } }
      );
    }
    return getOrderBundle(tenantId, order._id);
  }

  if (nextStatus === 'CANCELLED') {
    order.status = 'CANCELLED';
    order.cancelledBy = userId;
    order.cancelledAt = new Date();
    order.cancelReason = cancelReason || '';
    await order.save();
    if (order.kotId) {
      const kot = await Kot.findOne({ _id: order.kotId, tenantId });
      if (kot && ['CREATED', 'PREPARING'].includes(kot.status)) {
        kot.status = 'CANCELLED';
        kot.cancelledBy = userId;
        kot.cancelledAt = new Date();
        kot.cancelReason = cancelReason || '';
        await kot.save();
      }
    }
    return getOrderBundle(tenantId, order._id);
  }

  const err = new Error('Use billing to complete READY orders');
  err.status = 400;
  throw err;
}

async function transitionKot(tenantId, kotId, action) {
  const kot = await Kot.findOne({ _id: kotId, tenantId });
  if (!kot) {
    const err = new Error('KOT not found');
    err.status = 404;
    throw err;
  }
  if (action === 'START') {
    if (kot.status !== 'CREATED') {
      const err = new Error('Only CREATED KOTs can be started');
      err.status = 400;
      throw err;
    }
    kot.status = 'PREPARING';
    await kot.save();
    await Order.updateOne({ _id: kot.orderId, tenantId, status: 'CONFIRMED' }, { $set: { status: 'PREPARING' } });
    return kot;
  }
  if (action === 'READY') {
    if (!['CREATED', 'PREPARING'].includes(kot.status)) {
      const err = new Error('KOT cannot be marked READY');
      err.status = 400;
      throw err;
    }
    kot.status = 'READY';
    await kot.save();
    await Order.updateOne(
      { _id: kot.orderId, tenantId, status: { $in: ['CONFIRMED', 'PREPARING'] } },
      { $set: { status: 'READY' } }
    );
    return kot;
  }
  const err = new Error('Unknown KOT action');
  err.status = 400;
  throw err;
}

module.exports = {
  createPublicOrder,
  getOrderBundle,
  listOrders,
  transitionOrder,
  transitionKot,
  ALLOWED,
};
