const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employeeName: { type: String, required: true },
    month: { type: String, required: true },
    salary: { type: Number, required: true },
    paid: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'Bank', 'UPI', 'Other'], default: 'Bank' },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryPayment', salaryPaymentSchema);
