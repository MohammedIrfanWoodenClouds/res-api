const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const Expense = require('../models/Expense');
const SalaryPayment = require('../models/SalaryPayment');
const Kot = require('../models/Kot');

function oid(tenantId) {
  return new mongoose.Types.ObjectId(String(tenantId));
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function resolveRange(preset, from, to) {
  const now = new Date();
  if (preset === 'today') return { from: startOfDay(now), to: endOfDay(now) };
  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { from: startOfDay(y), to: endOfDay(y) };
  }
  if (preset === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return { from: startOfDay(d), to: endOfDay(now) };
  }
  if (preset === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: startOfDay(d), to: endOfDay(now) };
  }
  if (from || to) {
    return {
      from: from ? startOfDay(from) : new Date(0),
      to: to ? endOfDay(to) : endOfDay(now),
    };
  }
  return { from: startOfDay(now), to: endOfDay(now) };
}

function dateFilter(from, to, field = 'createdAt') {
  return { [field]: { $gte: from, $lte: to } };
}

async function salesReport(tenantId, range) {
  const { from, to } = resolveRange(range.preset, range.from, range.to);
  const invoices = await Invoice.find({
    tenantId,
    status: 'ACTIVE',
    ...dateFilter(from, to),
  }).sort({ createdAt: -1 });

  const grossSales = invoices.reduce((s, i) => s + i.total, 0);
  const tax = invoices.reduce((s, i) => s + i.taxTotal, 0);
  const discount = 0;
  const netSales = grossSales;
  const byPayment = {};
  const byType = {};
  const byDate = {};

  for (const inv of invoices) {
    byPayment[inv.paymentMethod] = (byPayment[inv.paymentMethod] || 0) + inv.total;
    byType[inv.orderType] = (byType[inv.orderType] || 0) + inv.total;
    const key = inv.createdAt.toISOString().slice(0, 10);
    byDate[key] = (byDate[key] || 0) + inv.total;
  }

  return {
    from,
    to,
    summary: {
      grossSales,
      discount,
      tax,
      netSales,
      numberOfOrders: invoices.length,
      averageOrderValue: invoices.length ? Math.round((netSales / invoices.length) * 100) / 100 : 0,
    },
    byDate: Object.entries(byDate).map(([date, amount]) => ({ date, amount })),
    byPaymentMethod: Object.entries(byPayment).map(([method, amount]) => ({ method, amount })),
    byOrderType: Object.entries(byType).map(([type, amount]) => ({ type, amount })),
    rows: invoices.map((i) => ({
      date: i.createdAt,
      invoiceNumber: i.invoiceNumber,
      type: i.orderType,
      amount: i.total,
      paymentMethod: i.paymentMethod,
      id: i._id,
    })),
  };
}

async function itemSalesReport(tenantId, range) {
  const { from, to } = resolveRange(range.preset, range.from, range.to);
  const invoices = await Invoice.find({
    tenantId,
    status: 'ACTIVE',
    ...dateFilter(from, to),
  });
  const map = {};
  for (const inv of invoices) {
    for (const line of inv.lines) {
      if (!map[line.itemName]) map[line.itemName] = { item: line.itemName, qty: 0, sales: 0 };
      map[line.itemName].qty += line.quantity;
      map[line.itemName].sales += line.lineTotal;
    }
  }
  return {
    from,
    to,
    rows: Object.values(map).sort((a, b) => b.sales - a.sales),
  };
}

async function purchaseReport(tenantId, range) {
  const { from, to } = resolveRange(range.preset, range.from, range.to);
  const rows = await Purchase.find({
    tenantId,
    status: 'ACTIVE',
    ...dateFilter(from, to, 'date'),
  }).sort({ date: -1 });
  return {
    from,
    to,
    total: rows.reduce((s, r) => s + r.total, 0),
    rows,
  };
}

async function expenseReport(tenantId, range) {
  const { from, to } = resolveRange(range.preset, range.from, range.to);
  const rows = await Expense.find({
    tenantId,
    status: 'ACTIVE',
    ...dateFilter(from, to, 'date'),
  }).sort({ date: -1 });
  const byCategory = {};
  for (const e of rows) {
    byCategory[e.categoryName] = (byCategory[e.categoryName] || 0) + e.amount;
  }
  return {
    from,
    to,
    total: rows.reduce((s, r) => s + r.amount, 0),
    byCategory: Object.entries(byCategory).map(([category, amount]) => ({ category, amount })),
    rows,
  };
}

async function salaryReport(tenantId, range) {
  const { from, to } = resolveRange(range.preset, range.from, range.to);
  const rows = await SalaryPayment.find({
    tenantId,
    status: 'ACTIVE',
    ...dateFilter(from, to, 'paymentDate'),
  }).sort({ paymentDate: -1 });
  return {
    from,
    to,
    totalPaid: rows.reduce((s, r) => s + r.paid, 0),
    rows: rows.map((r) => ({
      employee: r.employeeName,
      month: r.month,
      salary: r.salary,
      paid: r.paid,
      pending: Math.max(0, r.salary - r.paid),
      paymentDate: r.paymentDate,
      paymentMethod: r.paymentMethod,
      id: r._id,
    })),
  };
}

async function pnlReport(tenantId, range) {
  const { from, to } = resolveRange(range.preset, range.from, range.to);
  const tid = oid(tenantId);
  const [sales, purchases, salaries, expenses] = await Promise.all([
    Invoice.aggregate([
      { $match: { tenantId: tid, status: 'ACTIVE', createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Purchase.aggregate([
      { $match: { tenantId: tid, status: 'ACTIVE', date: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    SalaryPayment.aggregate([
      { $match: { tenantId: tid, status: 'ACTIVE', paymentDate: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$paid' } } },
    ]),
    Expense.aggregate([
      { $match: { tenantId: tid, status: 'ACTIVE', date: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$amount' }, byCat: { $push: { category: '$categoryName', amount: '$amount' } } } },
    ]),
  ]);

  const salesTotal = sales[0]?.total || 0;
  const purchasesTotal = purchases[0]?.total || 0;
  const salariesTotal = salaries[0]?.total || 0;
  const expensesTotal = expenses[0]?.total || 0;
  const expenseByCategory = {};
  for (const row of expenses[0]?.byCat || []) {
    expenseByCategory[row.category] = (expenseByCategory[row.category] || 0) + row.amount;
  }

  const totalExpenses = purchasesTotal + salariesTotal + expensesTotal;
  return {
    label: 'Operational P&L',
    from,
    to,
    revenue: { sales: salesTotal },
    expenses: {
      purchases: purchasesTotal,
      salaries: salariesTotal,
      ...expenseByCategory,
      totalExpenses,
    },
    netProfit: salesTotal - totalExpenses,
  };
}

async function dashboard(tenantId) {
  const { from, to } = resolveRange('today');
  const tid = oid(tenantId);

  const [salesAgg, orderCount, pendingKot, expenseAgg, purchaseAgg, salaryAgg, recentOrders, salesByHour] =
    await Promise.all([
      Invoice.aggregate([
        { $match: { tenantId: tid, status: 'ACTIVE', createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ tenantId, createdAt: { $gte: from, $lte: to }, status: { $ne: 'CANCELLED' } }),
      Kot.countDocuments({ tenantId, status: { $in: ['CREATED', 'PREPARING'] } }),
      Expense.aggregate([
        { $match: { tenantId: tid, status: 'ACTIVE', date: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Purchase.aggregate([
        { $match: { tenantId: tid, status: 'ACTIVE', date: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      SalaryPayment.aggregate([
        { $match: { tenantId: tid, status: 'ACTIVE', paymentDate: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$paid' } } },
      ]),
      Order.find({ tenantId }).sort({ createdAt: -1 }).limit(8),
      Invoice.aggregate([
        { $match: { tenantId: tid, status: 'ACTIVE', createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            total: { $sum: '$total' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  const sales = salesAgg[0]?.total || 0;
  const expenses = (expenseAgg[0]?.total || 0) + (purchaseAgg[0]?.total || 0) + (salaryAgg[0]?.total || 0);
  return {
    metrics: {
      sales,
      orders: orderCount,
      pendingKot,
      expenses: expenseAgg[0]?.total || 0,
      netProfit: sales - expenses,
    },
    recentOrders,
    salesChart: salesByHour.map((h) => ({ hour: h._id, total: h.total })),
  };
}

module.exports = {
  resolveRange,
  salesReport,
  itemSalesReport,
  purchaseReport,
  expenseReport,
  salaryReport,
  pnlReport,
  dashboard,
};
