const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const { nextInvoiceNumber } = require('../utils/counters');
const { getOrderBundle } = require('./orderService');

const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Other'];

async function billOrder(tenantId, orderId, paymentMethod, userId) {
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    const err = new Error('Invalid payment method');
    err.status = 400;
    throw err;
  }

  const order = await Order.findOne({ _id: orderId, tenantId });
  if (!order) {
    const err = new Error('Order not found');
    err.status = 404;
    throw err;
  }
  if (order.status !== 'READY') {
    const err = new Error('Only READY orders can be billed');
    err.status = 400;
    throw err;
  }
  if (order.invoiceId) {
    const err = new Error('Order already billed');
    err.status = 400;
    throw err;
  }

  const items = await OrderItem.find({ tenantId, orderId: order._id });
  const invoiceNumber = await nextInvoiceNumber(tenantId);

  const invoice = await Invoice.create({
    tenantId,
    orderId: order._id,
    invoiceNumber,
    status: 'ACTIVE',
    orderType: order.orderType,
    tableName: order.tableName,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    lines: items.map((i) => ({
      itemName: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      taxPercent: i.taxPercent,
      lineSubtotal: i.lineSubtotal,
      lineTax: i.lineTax,
      lineTotal: i.lineTotal,
    })),
    subtotal: order.subtotal,
    taxTotal: order.taxTotal,
    total: order.total,
    paymentMethod,
  });

  const payment = await Payment.create({
    tenantId,
    invoiceId: invoice._id,
    orderId: order._id,
    amount: order.total,
    method: paymentMethod,
    status: 'ACTIVE',
  });

  invoice.paymentId = payment._id;
  await invoice.save();

  order.status = 'COMPLETED';
  order.invoiceId = invoice._id;
  await order.save();

  return {
    order,
    items,
    invoice,
    payment,
  };
}

async function getInvoice(tenantId, invoiceId) {
  const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
  if (!invoice) return null;
  const payment = invoice.paymentId
    ? await Payment.findOne({ _id: invoice.paymentId, tenantId })
    : null;
  return { invoice, payment };
}

async function listInvoices(tenantId, { from, to } = {}) {
  const q = { tenantId, status: 'ACTIVE' };
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  return Invoice.find(q).sort({ createdAt: -1 });
}

module.exports = {
  billOrder,
  getInvoice,
  listInvoices,
  PAYMENT_METHODS,
};
