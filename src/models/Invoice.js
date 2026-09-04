const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    invoiceNumber: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    orderType: { type: String, required: true },
    tableName: { type: String, default: '' },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    lines: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        taxPercent: { type: Number, default: 0 },
        lineSubtotal: { type: Number, required: true },
        lineTax: { type: Number, required: true },
        lineTotal: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    taxTotal: { type: Number, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Other'], required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
