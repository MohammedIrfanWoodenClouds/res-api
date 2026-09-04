const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const { nextExpenseNumber } = require('../utils/counters');

async function listCategories(req, res) {
  const items = await ExpenseCategory.find({ tenantId: req.user.tenantId, isActive: true }).sort({
    name: 1,
  });
  res.json(items);
}

async function list(req, res) {
  const items = await Expense.find({ tenantId: req.user.tenantId, status: 'ACTIVE' }).sort({
    date: -1,
  });
  res.json(items);
}

async function create(req, res) {
  const { date, categoryId, description, amount, paymentMethod } = req.body;
  if (!date || !categoryId || amount === undefined) {
    return res.status(400).json({ message: 'date, categoryId and amount are required' });
  }
  const category = await ExpenseCategory.findOne({
    _id: categoryId,
    tenantId: req.user.tenantId,
    isActive: true,
  });
  if (!category) return res.status(400).json({ message: 'Invalid category' });

  const voucherNumber = await nextExpenseNumber(req.user.tenantId);
  const expense = await Expense.create({
    tenantId: req.user.tenantId,
    voucherNumber,
    date: new Date(date),
    categoryId: category._id,
    categoryName: category.name,
    description: description || '',
    amount: Number(amount),
    paymentMethod: paymentMethod || 'Cash',
  });
  res.status(201).json(expense);
}

async function cancel(req, res) {
  const expense = await Expense.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });
  expense.status = 'CANCELLED';
  expense.cancelledBy = req.user.userId;
  expense.cancelledAt = new Date();
  expense.cancelReason = req.body.cancelReason || '';
  await expense.save();
  res.json(expense);
}

module.exports = { listCategories, list, create, cancel };
