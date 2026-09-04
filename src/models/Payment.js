const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Other'], required: true },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
