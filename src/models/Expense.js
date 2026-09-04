const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    voucherNumber: { type: String, required: true },
    date: { type: Date, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    categoryName: { type: String, required: true },
    description: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank', 'Other'], default: 'Cash' },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ tenantId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('Expense', expenseSchema);
