const mongoose = require('mongoose');

const DEFAULT_EXPENSE_CATEGORIES = [
  'Electricity',
  'Water',
  'Rent',
  'Gas',
  'Transport',
  'Maintenance',
  'Marketing',
  'Office',
  'Other',
];

const expenseCategorySchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);
module.exports.DEFAULT_EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
