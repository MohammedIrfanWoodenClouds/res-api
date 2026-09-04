const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String, required: true },
    date: { type: Date, required: true },
    invoiceNumber: { type: String, default: '', trim: true },
    total: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    notes: { type: String, default: '' },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);
