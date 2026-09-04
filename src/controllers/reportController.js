const reportService = require('../services/reportService');

function rangeFromQuery(q) {
  return { preset: q.preset, from: q.from, to: q.to };
}

async function sales(req, res) {
  res.json(await reportService.salesReport(req.user.tenantId, rangeFromQuery(req.query)));
}

async function itemSales(req, res) {
  res.json(await reportService.itemSalesReport(req.user.tenantId, rangeFromQuery(req.query)));
}

async function purchases(req, res) {
  res.json(await reportService.purchaseReport(req.user.tenantId, rangeFromQuery(req.query)));
}

async function expenses(req, res) {
  res.json(await reportService.expenseReport(req.user.tenantId, rangeFromQuery(req.query)));
}

async function salaries(req, res) {
  res.json(await reportService.salaryReport(req.user.tenantId, rangeFromQuery(req.query)));
}

async function pnl(req, res) {
  res.json(await reportService.pnlReport(req.user.tenantId, rangeFromQuery(req.query)));
}

async function dashboard(req, res) {
  res.json(await reportService.dashboard(req.user.tenantId));
}

module.exports = { sales, itemSales, purchases, expenses, salaries, pnl, dashboard };
