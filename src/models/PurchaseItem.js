const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true, index: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'kg', trim: true },
    rate: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseItem', purchaseItemSchema);
